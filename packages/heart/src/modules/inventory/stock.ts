import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import type { Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { notifyStaff, type StaffNotice } from '../notifications/index.ts';
import { getSetting } from '../settings/index.ts';

// The only code that moves stock (DOC/backend/04, 21). Inventory owns the
// ledger and the balance columns products.stock and product_variants.stock.
// Every write locks products, then variants, in id order, so parallel orders
// cannot deadlock and each one reads the balance the last one left. The lock
// is FOR NO KEY UPDATE: an order line referencing the product holds a key-share
// lock, and a full FOR UPDATE would deadlock against a second checkout.

/** Print-on-demand partners make each item to order, so counts do not apply. */
export const MADE_TO_ORDER_PARTNERS = ['qikink', 'printrove'] as const;
export const isMadeToOrder = (partner: string | null | undefined): boolean => (MADE_TO_ORDER_PARTNERS as readonly (string | null | undefined)[]).includes(partner);

/** Made-to-order lines are capped per order, not by a stock count. */
export const MADE_TO_ORDER_LINE_CAP = 100;

export interface ReserveLine { orderItemId: string; variantId: string; qty: number }
export interface StockChange { variantId: string; delta: number }

type Locked = {
  id: string; product_id: string; sku: string; stock: number; is_active: boolean;
  partner_provider: string | null; partner_availability: string | null; product_kind: string; product_status: string; product_deleted: boolean;
};

const records = (rows: object[]): SQL => sql`jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)`;
const uuids = (ids: string[]): SQL => sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `);
const isTracked = (v: Pick<Locked, 'partner_provider' | 'product_kind'>) => !isMadeToOrder(v.partner_provider) && v.product_kind === 'physical';

async function lockVariants(tx: Transaction, variantIds: string[]): Promise<Map<string, Locked>> {
  const ids = [...new Set(variantIds)].sort();
  if (!ids.length) return new Map();
  const { rows: owners } = await tx.execute<{ product_id: string }>(sql`SELECT DISTINCT product_id FROM product_variants WHERE id IN (${uuids(ids)})`);
  if (owners.length) await tx.execute(sql`SELECT id FROM products WHERE id IN (${uuids(owners.map((o) => o.product_id))}) ORDER BY id FOR NO KEY UPDATE`);
  await tx.execute(sql`SELECT id FROM product_variants WHERE id IN (${uuids(ids)}) ORDER BY id FOR NO KEY UPDATE`);
  const { rows } = await tx.execute<Locked>(sql`
    SELECT v.id, v.product_id, v.sku, v.stock, v.is_active, p.partner_provider, p.partner_availability, p.product_kind, p.status AS product_status, p.deleted_at IS NOT NULL AS product_deleted
    FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id IN (${uuids(ids)})`);
  return new Map(rows.map((r) => [r.id, r]));
}

/** Rewrites products.stock from its active variants. Call with the product locked. */
export async function syncProductStock(tx: Transaction, productIds: string[]): Promise<void> {
  const ids = [...new Set(productIds)];
  if (!ids.length) return;
  await tx.execute(sql`UPDATE products p SET stock = coalesce((SELECT sum(v.stock) FROM product_variants v WHERE v.product_id = p.id AND v.is_active), 0) WHERE p.id IN (${uuids(ids)})`);
}

async function writeBalances(tx: Transaction, balances: Map<string, number>): Promise<void> {
  if (!balances.size) return;
  await tx.execute(sql`UPDATE product_variants v SET stock = x.stock, updated_at = now() FROM ${records([...balances].map(([id, stock]) => ({ id, stock })))} AS x(id uuid, stock int) WHERE v.id = x.id`);
}

interface Movement { product_id: string; variant_id: string; qty_change: number; reason: string; order_id: string | null; order_item_id: string | null; qty_after: number }

async function writeMovements(tx: Transaction, moves: Movement[]): Promise<void> {
  if (!moves.length) return;
  await tx.execute(sql`INSERT INTO stock_movements (id, product_id, variant_id, qty_change, reason, order_id, order_item_id, qty_after)
    SELECT x.id, x.product_id, x.variant_id, x.qty_change, x.reason, x.order_id, x.order_item_id, x.qty_after
    FROM ${records(moves.map((m) => ({ id: uuidv7(), ...m })))} AS x(id uuid, product_id uuid, variant_id uuid, qty_change int, reason text, order_id uuid, order_item_id uuid, qty_after int)`);
}

/** The store's calendar day: alerts are deduped per day in India, not per UTC day. */
const storeDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

/** Staff bell: rings once a day per variant at or below its level, in the same transaction as the stock write. */
async function raiseLevelAlerts(tx: Transaction, variantIds: string[]): Promise<void> {
  if (!variantIds.length) return;
  const { rows } = await tx.execute<{ id: string; sku: string; stock: number; name: string; threshold: number | null; partner_provider: string | null; product_kind: string }>(sql`
    SELECT v.id, v.sku, v.stock, p.name, p.low_stock_threshold AS threshold, p.partner_provider, p.product_kind
    FROM product_variants v JOIN products p ON p.id = v.product_id
    WHERE v.id IN (${uuids(variantIds)}) AND v.is_active AND p.status = 'active' AND p.deleted_at IS NULL`);
  const tracked = rows.filter(isTracked);
  if (!tracked.length) return;
  const storeWide = await getSetting('inventory.low_stock_threshold', tx);
  const day = storeDay();
  const notices = tracked.flatMap((v): StaffNotice[] => {
    if (v.stock === 0) return [{ kind: 'inventory', title: `${v.name.slice(0, 120)} is out of stock`, body: `${v.sku} has no units left.`, link: '/products', dedupeKey: `inventory.out:${v.id}:${day}` }];
    if (v.stock <= (v.threshold ?? storeWide)) return [{ kind: 'inventory', title: `${v.name.slice(0, 120)} is low on stock`, body: `${v.sku} has ${v.stock} left.`, link: '/products', dedupeKey: `inventory.low:${v.id}:${day}` }];
    return [];
  });
  await notifyStaff(tx, 'product.update', notices);
}

/**
 * Takes stock for an order, all lines or none. A retry of the same line takes
 * nothing more: the sale movement is the proof it already happened.
 */
export async function reserve(tx: Transaction, order: { orderId: string; lines: ReserveLine[] }): Promise<{ reserved: number; alreadyReserved: number }> {
  const { orderId, lines } = order;
  if (!lines.length) throw new AppError('VALIDATION_FAILED', 'There is nothing to reserve.');
  if (new Set(lines.map((l) => l.orderItemId)).size !== lines.length) throw new AppError('VALIDATION_FAILED', 'An order line appears twice.');
  if (lines.some((l) => !Number.isInteger(l.qty) || l.qty <= 0)) throw new AppError('VALIDATION_FAILED', 'Quantities must be whole numbers above zero.');

  const locked = await lockVariants(tx, lines.map((l) => l.variantId));
  // Read after the locks, so a parallel retry sees the first attempt's rows.
  const { rows: done } = await tx.execute<{ order_item_id: string }>(sql`SELECT order_item_id FROM stock_movements WHERE reason = 'sale' AND order_item_id IN (${uuids(lines.map((l) => l.orderItemId))})`);
  const already = new Set(done.map((d) => d.order_item_id));

  const balances = new Map<string, number>();
  const moves: Movement[] = [];
  const short: { field: string; message: string }[] = [];
  for (const line of lines) {
    if (already.has(line.orderItemId)) continue;
    const v = locked.get(line.variantId);
    if (!v || !v.is_active || v.product_status !== 'active' || v.product_deleted) { short.push({ field: line.variantId, message: 'This item is no longer available.' }); continue; }
    if (!isTracked(v)) {
      if (isMadeToOrder(v.partner_provider) && v.partner_availability !== 'ready_to_print') short.push({ field: line.variantId, message: 'This item cannot be printed right now.' });
      else if (line.qty > MADE_TO_ORDER_LINE_CAP) short.push({ field: line.variantId, message: `You can order up to ${MADE_TO_ORDER_LINE_CAP} of this item.` });
      continue;
    }
    const balance = balances.get(v.id) ?? v.stock;
    if (balance < line.qty) { short.push({ field: line.variantId, message: balance > 0 ? `Only ${balance} left of ${v.sku}.` : `${v.sku} is out of stock.` }); continue; }
    balances.set(v.id, balance - line.qty);
    moves.push({ product_id: v.product_id, variant_id: v.id, qty_change: -line.qty, reason: 'sale', order_id: orderId, order_item_id: line.orderItemId, qty_after: balance - line.qty });
  }
  if (short.length) throw new AppError('STOCK_INSUFFICIENT', short[0]!.message, short);

  await writeBalances(tx, balances);
  await writeMovements(tx, moves);
  await syncProductStock(tx, moves.map((m) => m.product_id));
  await raiseLevelAlerts(tx, [...balances.keys()]);
  return { reserved: lines.length - already.size, alreadyReserved: already.size };
}

/** Gives an order's stock back, once per line, however many times it is called. */
export async function release(tx: Transaction, order: { orderId: string; orderItemIds?: string[] }): Promise<{ released: number }> {
  const only = order.orderItemIds ? sql`AND order_item_id IN (${uuids(order.orderItemIds)})` : sql``;
  if (order.orderItemIds && !order.orderItemIds.length) return { released: 0 };
  const { rows: sales } = await tx.execute<{ order_item_id: string; variant_id: string; product_id: string; qty_change: number }>(
    sql`SELECT order_item_id, variant_id, product_id, qty_change FROM stock_movements WHERE order_id = ${order.orderId} AND reason = 'sale' ${only}`);
  if (!sales.length) return { released: 0 };

  const locked = await lockVariants(tx, sales.map((s) => s.variant_id));
  const { rows: done } = await tx.execute<{ order_item_id: string }>(sql`SELECT order_item_id FROM stock_movements WHERE reason = 'cancel' AND order_item_id IN (${uuids(sales.map((s) => s.order_item_id))})`);
  const already = new Set(done.map((d) => d.order_item_id));

  const balances = new Map<string, number>();
  const moves: Movement[] = [];
  for (const sale of sales) {
    if (already.has(sale.order_item_id)) continue;
    const after = (balances.get(sale.variant_id) ?? locked.get(sale.variant_id)!.stock) - sale.qty_change;
    balances.set(sale.variant_id, after);
    moves.push({ product_id: sale.product_id, variant_id: sale.variant_id, qty_change: -sale.qty_change, reason: 'cancel', order_id: order.orderId, order_item_id: sale.order_item_id, qty_after: after });
  }
  await writeBalances(tx, balances);
  await writeMovements(tx, moves);
  await syncProductStock(tx, moves.map((m) => m.product_id));
  return { released: moves.length };
}

/**
 * Staff stock edits, as changes rather than totals, so a sale made while the
 * editor was open is kept. A cut larger than what is left stops at zero, and
 * the ledger records what actually moved.
 */
export async function adjustStock(tx: Transaction, changes: StockChange[]): Promise<void> {
  const real = changes.filter((c) => c.delta !== 0);
  if (!real.length) return;
  const locked = await lockVariants(tx, real.map((c) => c.variantId));
  const balances = new Map<string, number>();
  const moves: Movement[] = [];
  for (const change of real) {
    const v = locked.get(change.variantId);
    if (!v) throw new AppError('NOT_FOUND', 'That variant does not exist.');
    const before = balances.get(v.id) ?? v.stock;
    const after = Math.max(0, before + change.delta);
    if (after === before) continue;
    balances.set(v.id, after);
    moves.push({ product_id: v.product_id, variant_id: v.id, qty_change: after - before, reason: 'admin_adjustment', order_id: null, order_item_id: null, qty_after: after });
  }
  await writeBalances(tx, balances);
  await writeMovements(tx, moves);
  await syncProductStock(tx, moves.map((m) => m.product_id));
  await raiseLevelAlerts(tx, [...balances.keys()]);
}

/**
 * How many of each variant one order line may hold right now: the stock for
 * in-house items, the per-line cap for print-to-order items, 0 when it cannot
 * be bought. Read-only; reserve() is the check that counts.
 */
export async function availableQty(db: Pick<Transaction, 'execute'>, variantIds: string[]): Promise<Map<string, number>> {
  const ids = [...new Set(variantIds)];
  if (!ids.length) return new Map();
  const { rows } = await db.execute<{ id: string; stock: number; ok: boolean; partner_provider: string | null; partner_availability: string | null; product_kind: string }>(sql`
    SELECT v.id, v.stock, (v.is_active AND p.status = 'active' AND p.deleted_at IS NULL) AS ok, p.partner_provider, p.partner_availability, p.product_kind
    FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id IN (${uuids(ids)})`);
  return new Map(rows.map((r) => {
    if (!r.ok || r.product_kind !== 'physical') return [r.id, 0];
    if (isMadeToOrder(r.partner_provider)) return [r.id, r.partner_availability === 'ready_to_print' ? MADE_TO_ORDER_LINE_CAP : 0];
    return [r.id, r.stock];
  }));
}
