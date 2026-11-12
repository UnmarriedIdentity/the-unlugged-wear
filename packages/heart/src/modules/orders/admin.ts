import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import { getDb, withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { getPaymentGateway } from '../../integrations/payments/index.ts';
import { afterCancel } from './checkout.ts';
import type { OrderStatus } from './read.ts';

// Staff side of orders (DOC/backend/06). Lists are filtered and paged in SQL,
// so the screen stays fast however many orders there are. A status change is
// one conditional UPDATE plus its history row: two staff clicking at once
// change it once, and a change the order is not ready for is refused.

export type AdminOrderTab = 'all' | 'unfulfilled' | 'unpaid' | 'cancelled' | 'finished';

/** Who may move an order where. Refunds and fulfilment sync drive the rest. */
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  failed: ['confirmed', 'cancelled'],
  refunded: [],
};

export interface AdminOrderRow {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string | null;
  totalPaise: number;
  paidPaise: number;
  refundedPaise: number;
  itemCount: number;
  isGuest: boolean;
}

export interface AdminOrderDetail extends AdminOrderRow {
  lines: { id: string; title: string; variant: string; qty: number; unitPaise: number; sku: string }[];
  subtotalPaise: number;
  shippingPaise: number;
  taxPaise: number;
  discountPaise: number;
  discountCode: string | null;
  cancellableUntil: string | null;
  history: { from: OrderStatus | null; to: OrderStatus; note: string | null; actor: string; at: string }[];
  allowedNext: OrderStatus[];
}

export interface AdminOrderStats { revenuePaise: number; activeQueue: number; delivered: number; issues: number; total: number }

const paise = (v: string | number | null) => (v === null ? 0 : Math.round(Number(v) * 100));

const TAB: Record<AdminOrderTab, SQL> = {
  all: sql`true`,
  unfulfilled: sql`o.status IN ('pending','confirmed','processing','failed')`,
  unpaid: sql`o.payment_status IN ('pending','failed') AND o.status <> 'cancelled'`,
  cancelled: sql`o.status = 'cancelled'`,
  finished: sql`o.status = 'delivered'`,
};

const FROM = sql`FROM orders o
  LEFT JOIN users u ON u.id = o.placed_by_user_id
  LEFT JOIN profiles pr ON pr.user_id = o.placed_by_user_id`;

type RowSql = {
  id: string; order_number: string; created_at: string; name: string | null; email: string | null; shipping_address: Record<string, string>; status: OrderStatus;
  payment_status: AdminOrderRow['paymentStatus']; method: string | null; grand_total: string; paid: string | null; refunded: string | null; items: number; guest: boolean;
};

const SELECT = sql`SELECT o.id, o.order_number, o.created_at,
    COALESCE(o.guest_name, trim(concat_ws(' ', pr.first_name, pr.last_name))) AS name, COALESCE(o.guest_email, u.email) AS email,
    o.shipping_address, o.status, o.payment_status, o.grand_total, o.placed_by_user_id IS NULL AS guest,
    (SELECT p.method FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC LIMIT 1) AS method,
    (SELECT sum(p.amount) FROM payments p WHERE p.order_id = o.id AND p.status IN ('captured','refunded')) AS paid,
    (SELECT sum(r.amount) FROM refunds r WHERE r.order_id = o.id AND r.status = 'completed') AS refunded,
    (SELECT coalesce(sum(oi.qty), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS items`;

const toRow = (r: RowSql): AdminOrderRow => {
  const a = r.shipping_address ?? {};
  return {
    orderNumber: r.order_number, createdAt: new Date(r.created_at).toISOString(), customerName: r.name || a.fullName || '—', customerEmail: r.email ?? '',
    customerPhone: a.phone ?? '', shippingAddress: [a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    status: r.status, paymentStatus: r.payment_status, paymentMethod: r.method, totalPaise: paise(r.grand_total), paidPaise: paise(r.paid), refundedPaise: paise(r.refunded),
    itemCount: r.items, isGuest: r.guest,
  };
};

export async function adminListOrders(input: { q?: string; tab?: AdminOrderTab; page?: number; perPage?: number }): Promise<{ rows: AdminOrderRow[]; total: number; stats: AdminOrderStats }> {
  const perPage = Math.min(Math.max(input.perPage ?? 20, 1), 5000);
  const page = Math.max(input.page ?? 1, 1);
  const q = input.q?.trim();
  const like = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
  const search = like
    ? sql`(o.order_number ILIKE ${like} OR o.guest_email ILIKE ${like} OR o.guest_name ILIKE ${like} OR u.email ILIKE ${like} OR concat_ws(' ', pr.first_name, pr.last_name) ILIKE ${like})`
    : sql`true`;
  const where = sql`WHERE ${TAB[input.tab ?? 'all']} AND ${search}`;
  const db = getDb();
  const [{ rows }, { rows: [count] }, { rows: [stats] }] = await Promise.all([
    db.execute<RowSql>(sql`${SELECT} ${FROM} ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`),
    db.execute<{ n: number }>(sql`SELECT count(*)::int AS n ${FROM} ${where}`),
    db.execute<{ revenue: string | null; queue: number; delivered: number; issues: number; total: number }>(sql`
      SELECT sum(grand_total) FILTER (WHERE payment_status = 'paid') AS revenue,
             count(*) FILTER (WHERE status IN ('pending','confirmed','processing'))::int AS queue,
             count(*) FILTER (WHERE status = 'delivered')::int AS delivered,
             count(*) FILTER (WHERE status = 'failed')::int AS issues,
             count(*)::int AS total
      FROM orders`),
  ]);
  return {
    rows: rows.map(toRow), total: count!.n,
    stats: { revenuePaise: paise(stats!.revenue), activeQueue: stats!.queue, delivered: stats!.delivered, issues: stats!.issues, total: stats!.total },
  };
}

export async function adminGetOrder(orderNumber: string): Promise<AdminOrderDetail> {
  const db = getDb();
  const { rows: [r] } = await db.execute<RowSql & { subtotal: string; shipping_fee: string; tax: string; discount: string; code: string | null; cancellable_until: string | null }>(sql`
    ${SELECT}, o.subtotal, o.shipping_fee, o.tax, o.discount, o.cancellable_until, (SELECT d.code FROM discount_codes d WHERE d.id = o.discount_code_id) AS code
    ${FROM} WHERE o.order_number = ${orderNumber}`);
  if (!r) throw new AppError('NOT_FOUND', 'That order does not exist.');
  const [{ rows: lines }, { rows: history }] = await Promise.all([
    db.execute<{ id: string; product_name: string; options: Record<string, string> | null; qty: number; unit_price: string; sku: string }>(sql`
      SELECT id, product_name, options, qty, unit_price, sku FROM order_items WHERE order_id = ${r.id} ORDER BY created_at, id`),
    db.execute<{ from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; actor: string; created_at: string; actor_name: string | null }>(sql`
      SELECT h.from_status, h.to_status, h.note, h.actor, h.created_at,
             (SELECT COALESCE(NULLIF(trim(concat_ws(' ', p.first_name, p.last_name)), ''), u.email) FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id::text = h.actor) AS actor_name
      FROM order_status_history h WHERE h.order_id = ${r.id} ORDER BY h.created_at, h.id`),
  ]);
  return {
    ...toRow(r),
    lines: lines.map((l) => ({ id: l.id, title: l.product_name, variant: [l.options?.Color, l.options?.Size].filter(Boolean).join(' / ') || 'Standard', qty: l.qty, unitPaise: paise(l.unit_price), sku: l.sku })),
    subtotalPaise: paise(r.subtotal), shippingPaise: paise(r.shipping_fee), taxPaise: paise(r.tax), discountPaise: paise(r.discount), discountCode: r.code,
    cancellableUntil: r.cancellable_until ? new Date(r.cancellable_until).toISOString() : null,
    history: history.map((h) => ({ from: h.from_status, to: h.to_status, note: h.note, actor: h.actor_name ?? h.actor, at: new Date(h.created_at).toISOString() })),
    allowedNext: NEXT_STATUS[r.status],
  };
}

export interface StatusChange { orderNumber: string; to: OrderStatus; note?: string }

/**
 * One staff status change. Cancelling releases stock and, when money was
 * taken, refunds it, which needs the refund permission (checked here too,
 * not only on the button).
 */
export async function adminSetOrderStatus(change: StatusChange, actorId: string, opts: { canRefund: boolean }): Promise<AdminOrderDetail> {
  const gateway = change.to === 'cancelled' ? await getPaymentGateway() : null;
  await withTransaction(async (tx) => {
    const { rows: [order] } = await tx.execute<{ id: string; status: OrderStatus; payment_status: string }>(sql`
      SELECT id, status, payment_status FROM orders WHERE order_number = ${change.orderNumber} FOR NO KEY UPDATE`);
    if (!order) throw new AppError('NOT_FOUND', 'That order does not exist.');
    if (order.status === change.to) throw new AppError('RULE_VIOLATION', `This order is already ${change.to}.`);
    if (!NEXT_STATUS[order.status].includes(change.to)) {
      throw new AppError('RULE_VIOLATION', `A ${order.status} order cannot be marked ${change.to}.`, [{ field: 'status', message: `Allowed next: ${NEXT_STATUS[order.status].join(', ') || 'none'}` }]);
    }
    if (change.to === 'cancelled' && order.payment_status === 'paid' && !opts.canRefund) {
      throw new AppError('FORBIDDEN', 'Cancelling a paid order refunds it, and you do not have permission to refund.');
    }
    const note = change.note?.trim().slice(0, 500) || null;
    await tx.execute(sql`UPDATE orders SET status = ${change.to}, updated_at = now() WHERE id = ${order.id} AND status = ${order.status}`);
    if (change.to === 'cancelled') {
      await afterCancel(tx, gateway!, { orderId: order.id, actorId, from: order.status, note: note ?? 'Cancelled by staff' });
    } else {
      await tx.execute(sql`INSERT INTO order_status_history (id, order_id, from_status, to_status, note, actor) VALUES (${uuidv7()}, ${order.id}, ${order.status}, ${change.to}, ${note}, ${actorId})`);
    }
  });
  return adminGetOrder(change.orderNumber);
}

/** Bulk "Mark as": each order on its own, so one refusal never blocks the rest. */
export async function adminSetOrdersStatus(orderNumbers: string[], to: OrderStatus, actorId: string, opts: { canRefund: boolean }): Promise<{ updated: string[]; refused: { orderNumber: string; reason: string }[] }> {
  const updated: string[] = [];
  const refused: { orderNumber: string; reason: string }[] = [];
  for (const orderNumber of [...new Set(orderNumbers)]) {
    try {
      await adminSetOrderStatus({ orderNumber, to }, actorId, opts);
      updated.push(orderNumber);
    } catch (error) {
      refused.push({ orderNumber, reason: error instanceof AppError ? error.message : 'Could not update this order.' });
    }
  }
  return { updated, refused };
}
