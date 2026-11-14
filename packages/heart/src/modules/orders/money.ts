import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import { getDb } from '../../platform/db/index.ts';

// Read models for the admin /payments and /refunds screens. Filtered and
// paged in SQL; money leaves as paise.

const paise = (v: string | number | null) => (v === null ? 0 : Math.round(Number(v) * 100));
const likeOf = (q?: string) => (q?.trim() ? `%${q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null);
const page = (input: { page?: number; perPage?: number }) => {
  const perPage = Math.min(Math.max(input.perPage ?? 20, 1), 5000);
  return { perPage, offset: (Math.max(input.page ?? 1, 1) - 1) * perPage };
};

const CUSTOMER = sql`COALESCE(o.guest_name, NULLIF(trim(concat_ws(' ', pr.first_name, pr.last_name)), ''), u.email)`;
const JOINS = sql`JOIN orders o ON o.id = x.order_id LEFT JOIN users u ON u.id = o.placed_by_user_id LEFT JOIN profiles pr ON pr.user_id = o.placed_by_user_id`;

export interface PaymentRow {
  id: string; orderNumber: string; customerName: string; customerEmail: string; method: string; provider: string; amountPaise: number; status: string;
  transactionId: string | null; paidAt: string | null; createdAt: string; refundedPaise: number; orderStatus: string;
}

export async function listPayments(input: { q?: string; status?: string; page?: number; perPage?: number }): Promise<{ rows: PaymentRow[]; total: number; stats: { capturedPaise: number; pendingPaise: number; pendingCount: number; refundedPaise: number } }> {
  const like = likeOf(input.q);
  const status = ['captured', 'pending', 'refunded', 'failed'].includes(input.status ?? '') ? sql`AND x.status = ${input.status}` : sql``;
  const where = sql`WHERE true ${status} ${like ? sql`AND (o.order_number ILIKE ${like} OR x.transaction_id ILIKE ${like} OR ${CUSTOMER} ILIKE ${like} OR COALESCE(o.guest_email, u.email) ILIKE ${like} OR x.method ILIKE ${like})` : sql``}`;
  const { perPage, offset } = page(input);
  const db = getDb();
  const [{ rows }, { rows: [count] }, { rows: [stats] }] = await Promise.all([
    db.execute<{ id: string; order_number: string; customer: string | null; email: string | null; method: string; provider: string; amount: string; status: string; transaction_id: string | null; paid_at: string | null; created_at: string; refunded: string | null; order_status: string }>(sql`
      SELECT x.id, o.order_number, ${CUSTOMER} AS customer, COALESCE(o.guest_email, u.email) AS email, x.method, x.provider, x.amount, x.status, x.transaction_id, x.paid_at, x.created_at, o.status AS order_status,
             (SELECT sum(r.amount) FROM refunds r WHERE r.payment_id = x.id AND r.status = 'completed') AS refunded
      FROM payments x ${JOINS} ${where} ORDER BY x.created_at DESC, x.id DESC LIMIT ${perPage} OFFSET ${offset}`),
    db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM payments x ${JOINS} ${where}`),
    db.execute<{ captured: string | null; pending: string | null; pending_count: number; refunded: string | null }>(sql`
      SELECT (SELECT sum(amount) FROM payments WHERE status IN ('captured','refunded')) AS captured,
             (SELECT sum(amount) FROM payments WHERE status = 'pending') AS pending,
             (SELECT count(*)::int FROM payments WHERE status = 'pending') AS pending_count,
             (SELECT sum(amount) FROM refunds WHERE status = 'completed') AS refunded`),
  ]);
  return {
    rows: rows.map((r) => ({ id: r.id, orderNumber: r.order_number, customerName: r.customer ?? '—', customerEmail: r.email ?? '', method: r.method, provider: r.provider, amountPaise: paise(r.amount), status: r.status,
      transactionId: r.transaction_id, paidAt: r.paid_at ? new Date(r.paid_at).toISOString() : null, createdAt: new Date(r.created_at).toISOString(), refundedPaise: paise(r.refunded), orderStatus: r.order_status })),
    total: count!.n,
    stats: { capturedPaise: paise(stats!.captured), pendingPaise: paise(stats!.pending), pendingCount: stats!.pending_count, refundedPaise: paise(stats!.refunded) },
  };
}

export interface RefundRow {
  id: string; orderNumber: string; customerName: string; amountPaise: number; reason: string; method: 'source' | 'upi' | 'bank_transfer'; status: 'processing' | 'completed' | 'rejected';
  payoutReference: string | null; destinationMasked: string | null; actorName: string; createdAt: string; updatedAt: string;
}

export async function listRefunds(input: { q?: string; status?: string; page?: number; perPage?: number }): Promise<{ rows: RefundRow[]; total: number; stats: { completedPaise: number; completed: number; processing: number; rejected: number } }> {
  const like = likeOf(input.q);
  const status = ['processing', 'completed', 'rejected'].includes(input.status ?? '') ? sql`AND x.status = ${input.status}` : sql``;
  const where: SQL = sql`WHERE true ${status} ${like ? sql`AND (o.order_number ILIKE ${like} OR ${CUSTOMER} ILIKE ${like} OR x.reason ILIKE ${like} OR x.payout_reference ILIKE ${like})` : sql``}`;
  const { perPage, offset } = page(input);
  const db = getDb();
  const [{ rows }, { rows: [count] }, { rows: [stats] }] = await Promise.all([
    db.execute<{ id: string; order_number: string; customer: string | null; amount: string; reason: string; method: RefundRow['method']; status: RefundRow['status']; payout_reference: string | null; payout_destination_masked: string | null; actor_name: string | null; created_at: string; updated_at: string }>(sql`
      SELECT x.id, o.order_number, ${CUSTOMER} AS customer, x.amount, x.reason, x.method, x.status, x.payout_reference, x.payout_destination_masked, x.created_at, x.updated_at,
             (SELECT COALESCE(NULLIF(trim(concat_ws(' ', ap.first_name, ap.last_name)), ''), au.email) FROM users au LEFT JOIN profiles ap ON ap.user_id = au.id WHERE au.id = x.actor) AS actor_name
      FROM refunds x ${JOINS} ${where} ORDER BY x.created_at DESC, x.id DESC LIMIT ${perPage} OFFSET ${offset}`),
    db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM refunds x ${JOINS} ${where}`),
    db.execute<{ done: string | null; completed: number; processing: number; rejected: number }>(sql`
      SELECT sum(amount) FILTER (WHERE status = 'completed') AS done, count(*) FILTER (WHERE status = 'completed')::int AS completed,
             count(*) FILTER (WHERE status = 'processing')::int AS processing, count(*) FILTER (WHERE status = 'rejected')::int AS rejected FROM refunds`),
  ]);
  return {
    rows: rows.map((r) => ({ id: r.id, orderNumber: r.order_number, customerName: r.customer ?? '—', amountPaise: paise(r.amount), reason: r.reason, method: r.method, status: r.status,
      payoutReference: r.payout_reference, destinationMasked: r.payout_destination_masked, actorName: r.actor_name ?? '—', createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at).toISOString() })),
    total: count!.n,
    stats: { completedPaise: paise(stats!.done), completed: stats!.completed, processing: stats!.processing, rejected: stats!.rejected },
  };
}
