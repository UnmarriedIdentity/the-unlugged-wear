import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { verifyReceipt } from '../auth/tokens.ts';
import { findDiscount } from './discounts.ts';
import type { ShippingAddress } from './schemas.ts';
import type { DiscountRule } from './pricing.ts';

// What a shopper may see of their orders. Nothing here is cached: every read
// is for one person, and a receipt token only opens its own order.

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';

export interface OrderLineView { id: string; productId: string; slug: string | null; title: string; color: string | null; size: string | null; unitPaise: number; qty: number; image: string | null }

export interface OrderView {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'upi' | 'cod' | 'netbanking' | 'wallet' | null;
  isGuest: boolean;
  lines: OrderLineView[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  shippingAddress: ShippingAddress;
  cancellableUntil: string | null;
  /** True while the free-cancel window is open for the account that placed it. */
  canCancel: boolean;
  history: { status: OrderStatus; at: string; note: string | null }[];
}

const paise = (v: string) => Math.round(Number(v) * 100);

type Loaded = OrderView & { ownerId: string | null };

async function load(where: ReturnType<typeof sql>, limit = 1): Promise<Loaded[]> {
  const db = getDb();
  const { rows: orders } = await db.execute<{ id: string; order_number: string; created_at: string; status: OrderStatus; payment_status: OrderView['paymentStatus']; placed_by_user_id: string | null;
    subtotal: string; discount: string; shipping_fee: string; tax: string; grand_total: string; shipping_address: ShippingAddress; cancellable_until: string | null; method: OrderView['paymentMethod'] }>(sql`
    SELECT o.id, o.order_number, o.created_at, o.status, o.payment_status, o.placed_by_user_id, o.subtotal, o.discount, o.shipping_fee, o.tax, o.grand_total, o.shipping_address, o.cancellable_until,
           (SELECT p.method FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC LIMIT 1) AS method
    FROM orders o WHERE ${where} ORDER BY o.created_at DESC LIMIT ${limit}`);
  if (!orders.length) return [];
  const ids = sql.join(orders.map((o) => sql`${o.id}::uuid`), sql`, `);
  const [{ rows: items }, { rows: history }] = await Promise.all([
    db.execute<{ id: string; order_id: string; product_id: string; external_id: string | null; slug: string | null; product_name: string; options: Record<string, string> | null; unit_price: string; qty: number; image: string | null }>(sql`
      SELECT oi.id, oi.order_id, oi.product_id, p.external_id, p.slug, oi.product_name, oi.options, oi.unit_price, oi.qty,
             (SELECT i.url FROM product_images i WHERE i.product_id = oi.product_id ORDER BY i.is_primary DESC, i.sort_order LIMIT 1) AS image
      FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id IN (${ids}) ORDER BY oi.created_at, oi.id`),
    db.execute<{ order_id: string; to_status: OrderStatus; note: string | null; created_at: string }>(sql`
      SELECT order_id, to_status, note, created_at FROM order_status_history WHERE order_id IN (${ids}) ORDER BY created_at, id`),
  ]);
  const now = Date.now();
  return orders.map((o) => ({
    id: o.id, orderNumber: o.order_number, createdAt: new Date(o.created_at).toISOString(), status: o.status, paymentStatus: o.payment_status, paymentMethod: o.method,
    isGuest: o.placed_by_user_id === null, ownerId: o.placed_by_user_id,
    lines: items.filter((i) => i.order_id === o.id).map((i) => ({
      id: i.id, productId: i.external_id ?? i.product_id, slug: i.slug, title: i.product_name, color: i.options?.Color ?? null, size: i.options?.Size ?? null,
      unitPaise: paise(i.unit_price), qty: i.qty, image: i.image,
    })),
    subtotalPaise: paise(o.subtotal), discountPaise: paise(o.discount), shippingPaise: paise(o.shipping_fee), taxPaise: paise(o.tax), grandTotalPaise: paise(o.grand_total),
    shippingAddress: o.shipping_address, cancellableUntil: o.cancellable_until ? new Date(o.cancellable_until).toISOString() : null,
    canCancel: o.placed_by_user_id !== null && o.status === 'pending' && o.cancellable_until !== null && new Date(o.cancellable_until).getTime() > now,
    history: history.filter((h) => h.order_id === o.id).map((h) => ({ status: h.to_status, at: new Date(h.created_at).toISOString(), note: h.note })),
  }));
}

/** An account's own orders, newest first. */
export async function listMyOrders(userId: string, limit = 50): Promise<OrderView[]> {
  return (await load(sql`o.placed_by_user_id = ${userId}`, limit)).map(({ ownerId: _owner, ...o }) => o);
}

/**
 * One order, for the account that placed it or for whoever holds its receipt
 * token. Anyone else gets the same "not found" as a number that never existed.
 */
export async function getOrderForViewer(orderNumber: string, viewer: { userId: string | null; receipt?: string }): Promise<OrderView> {
  const [found] = await load(sql`o.order_number = ${orderNumber}`);
  const isOwner = Boolean(found && viewer.userId && found.ownerId === viewer.userId);
  if (!found || !(isOwner || verifyReceipt(found.id, viewer.receipt))) throw new AppError('NOT_FOUND', 'We could not find that order.');
  const { ownerId: _owner, ...order } = found;
  // Only the account that placed it may cancel; a receipt only lets you look.
  return isOwner ? order : { ...order, canCancel: false };
}

/** "Apply" on the checkout form: is this code usable for this subtotal? Nothing is reserved. */
export async function previewDiscount(code: string, subtotalPaise: number): Promise<{ code: string; discountPaise: number; rule: DiscountRule; minOrderPaise: number | null }> {
  const d = await findDiscount(getDb(), code, subtotalPaise);
  const discountPaise = d.rule.type === 'percent' ? Math.round((subtotalPaise * Math.min(100, d.rule.percent)) / 100) : Math.min(subtotalPaise, d.rule.paise);
  return { code: d.code, discountPaise, rule: d.rule, minOrderPaise: d.minOrderPaise };
}
