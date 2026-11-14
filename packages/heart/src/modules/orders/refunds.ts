import 'server-only';
import { sql } from 'drizzle-orm';
import { withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { getPaymentGateway } from '../../integrations/payments/index.ts';
import { completeRefund, createRefund, paymentState, recordCodCollected, rejectRefund, settleIfFullyRefunded, type RefundMethod } from '../payments/index.ts';

// Staff refunds (DOC/backend/06 "Refund" transaction): the refund row, the
// payment and the order's payment status change together under the order's
// lock. Prepaid money goes back to its source; cash on delivery is paid out
// by staff and proven with a UTR. Nothing here can refund more than was paid.

export interface RefundableOrder {
  orderNumber: string;
  customerName: string;
  paymentMethod: string | null;
  paymentStatus: string;
  cashOnDelivery: boolean;
  collected: boolean;
  capturedPaise: number;
  refundedPaise: number;
  openPaise: number;
  availablePaise: number;
  hasOpenRefund: boolean;
}

async function lockOrder(tx: Parameters<Parameters<typeof withTransaction>[0]>[0], orderNumber: string) {
  const { rows: [o] } = await tx.execute<{ id: string; name: string | null; payment_status: string }>(sql`
    SELECT o.id, COALESCE(o.guest_name, trim(concat_ws(' ', pr.first_name, pr.last_name))) AS name, o.payment_status
    FROM orders o LEFT JOIN profiles pr ON pr.user_id = o.placed_by_user_id
    WHERE o.order_number = ${orderNumber} FOR NO KEY UPDATE OF o`);
  if (!o) throw new AppError('NOT_FOUND', 'That order does not exist.');
  return o;
}

/** What the refund form shows before anything is sent. */
export async function refundableOrder(orderNumber: string): Promise<RefundableOrder> {
  return withTransaction(async (tx) => {
    const o = await lockOrder(tx, orderNumber);
    const s = await paymentState(tx, o.id, false);
    return {
      orderNumber, customerName: o.name || '—', paymentMethod: s.method, paymentStatus: o.payment_status, cashOnDelivery: s.method === 'cod',
      collected: s.capturedPaise > 0, capturedPaise: s.capturedPaise, refundedPaise: s.refundedPaise, openPaise: s.openPaise, availablePaise: s.availablePaise, hasOpenRefund: s.hasOpenRefund,
    };
  });
}

/** Keeps orders.payment_status in step with what has actually gone back. */
async function syncPaymentStatus(tx: Parameters<Parameters<typeof withTransaction>[0]>[0], orderId: string) {
  if (await settleIfFullyRefunded(tx, orderId)) await tx.execute(sql`UPDATE orders SET payment_status = 'refunded', updated_at = now() WHERE id = ${orderId}`);
}

export interface IssueRefundInput {
  orderNumber: string;
  amountPaise: number;
  reason: string;
  method: RefundMethod;
  destination?: string;
  idempotencyKey: string;
}

export async function issueRefund(input: IssueRefundInput, actorId: string): Promise<{ refundId: string; status: 'completed' | 'processing'; replayed: boolean; order: RefundableOrder }> {
  const gateway = await getPaymentGateway();
  const result = await withTransaction(async (tx) => {
    const o = await lockOrder(tx, input.orderNumber);
    const made = await createRefund(tx, gateway, { orderId: o.id, amountPaise: input.amountPaise, reason: input.reason, method: input.method, destination: input.destination, idempotencyKey: input.idempotencyKey, actorId });
    if (!made.replayed) {
      await syncPaymentStatus(tx, o.id);
      await recordAudit(tx, { actorId, action: 'refund.create', entity: 'refunds', entityId: made.refundId, diff: { order: { from: null, to: input.orderNumber }, amountPaise: { from: null, to: input.amountPaise }, method: { from: null, to: input.method } } });
    }
    return made;
  });
  return { ...result, order: await refundableOrder(input.orderNumber) };
}

export async function markRefundPaid(refundId: string, payoutReference: string, actorId: string): Promise<void> {
  await withTransaction(async (tx) => {
    const { orderId } = await completeRefund(tx, refundId, payoutReference);
    await syncPaymentStatus(tx, orderId);
    await recordAudit(tx, { actorId, action: 'refund.complete', entity: 'refunds', entityId: refundId, diff: { status: { from: 'processing', to: 'completed' } } });
  });
}

export async function markRefundRejected(refundId: string, note: string, actorId: string): Promise<void> {
  if (!note.trim()) throw new AppError('VALIDATION_FAILED', 'Say why the payout will not happen.', [{ field: 'note', message: 'A reason is required.' }]);
  await withTransaction(async (tx) => {
    await rejectRefund(tx, refundId);
    await recordAudit(tx, { actorId, action: 'refund.reject', entity: 'refunds', entityId: refundId, diff: { status: { from: 'processing', to: 'rejected' }, note: { from: null, to: note.trim().slice(0, 500) } } });
  });
}

/** The courier handed over the cash: the order is paid and, from now on, refundable. */
export async function markCodCollected(orderNumber: string, actorId: string): Promise<void> {
  await withTransaction(async (tx) => {
    const o = await lockOrder(tx, orderNumber);
    const { rows: [order] } = await tx.execute<{ status: string }>(sql`SELECT status FROM orders WHERE id = ${o.id}`);
    if (order!.status === 'cancelled') throw new AppError('RULE_VIOLATION', 'A cancelled order has no cash to collect.');
    await recordCodCollected(tx, o.id);
    await tx.execute(sql`UPDATE orders SET payment_status = 'paid', updated_at = now() WHERE id = ${o.id}`);
    await recordAudit(tx, { actorId, action: 'payment.collect', entity: 'orders', entityId: o.id, diff: { paymentStatus: { from: 'pending', to: 'paid' } } });
  });
}
