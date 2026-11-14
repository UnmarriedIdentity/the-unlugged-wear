import 'server-only';
import { sql } from 'drizzle-orm';
import type { Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toRupees } from '../../platform/money/index.ts';
import type { PaymentGateway } from '../../integrations/payments/index.ts';

// Payments and refunds (DOC/backend/06). Every call runs inside the caller's
// order transaction, so a declined payment leaves no order, no stock taken
// and no discount used. Only the demo gateway exists until TL-INT-RAZORPAY.

export type PayMethod = 'card' | 'upi' | 'cod';

export interface TakePaymentInput {
  orderId: string;
  method: PayMethod;
  amountPaise: number;
  /** Unique per order: the gateway reference that makes a retry harmless. */
  reference: string;
  simulate?: 'decline';
}

/** Card and UPI are captured now; cash on delivery is recorded as pending. */
export async function takePayment(tx: Transaction, gateway: PaymentGateway, input: TakePaymentInput): Promise<{ paymentId: string; captured: boolean }> {
  const id = uuidv7();
  if (input.method === 'cod' || input.amountPaise === 0) {
    const captured = input.method !== 'cod';
    await tx.execute(sql`INSERT INTO payments (id, order_id, provider, method, amount, status, paid_at)
      VALUES (${id}, ${input.orderId}, ${gateway.slug}, ${input.method}, ${toRupees(input.amountPaise)}, ${captured ? 'captured' : 'pending'}, ${captured ? sql`now()` : null})`);
    return { paymentId: id, captured };
  }
  const result = await gateway.createPayment({ reference: input.reference, amountPaise: input.amountPaise, currency: 'INR', ...(input.simulate ? { simulate: input.simulate } : {}) });
  if (result.status !== 'captured') {
    throw new AppError('RULE_VIOLATION', 'The payment was declined. Nothing was charged; your bag is unchanged.', [{ field: 'payment', message: 'Payment declined.' }]);
  }
  await tx.execute(sql`INSERT INTO payments (id, order_id, provider, method, amount, status, transaction_id, paid_at)
    VALUES (${id}, ${input.orderId}, ${gateway.slug}, ${input.method}, ${toRupees(input.amountPaise)}, 'captured', ${result.providerRef}, now())`);
  return { paymentId: id, captured: true };
}

const paise = (v: string | number | null) => (v === null ? 0 : Math.round(Number(v) * 100));

export type RefundMethod = 'source' | 'upi' | 'bank_transfer';

export interface PaymentState {
  paymentId: string | null;
  method: string | null;
  status: string | null;
  transactionId: string | null;
  /** Money we actually hold for this order. */
  capturedPaise: number;
  /** Already sent back. */
  refundedPaise: number;
  /** Promised in a refund that is still being paid out. */
  openPaise: number;
  /** What can still be refunded. */
  availablePaise: number;
  hasOpenRefund: boolean;
}

/** The order's payment, locked, with what has gone back and what is left. */
export async function paymentState(tx: Pick<Transaction, 'execute'>, orderId: string, lock = true): Promise<PaymentState> {
  const { rows: [p] } = await tx.execute<{ id: string; method: string; status: string; amount: string; transaction_id: string | null }>(sql`
    SELECT id, method, status, amount, transaction_id FROM payments WHERE order_id = ${orderId} ORDER BY created_at DESC LIMIT 1 ${lock ? sql`FOR UPDATE` : sql``}`);
  const { rows: [r] } = await tx.execute<{ done: string | null; open: string | null; open_count: number }>(sql`
    SELECT sum(amount) FILTER (WHERE status = 'completed') AS done, sum(amount) FILTER (WHERE status = 'processing') AS open,
           count(*) FILTER (WHERE status = 'processing')::int AS open_count
    FROM refunds WHERE order_id = ${orderId}`);
  const captured = p && (p.status === 'captured' || p.status === 'refunded') ? paise(p.amount) : 0;
  const refunded = paise(r!.done);
  const open = paise(r!.open);
  return {
    paymentId: p?.id ?? null, method: p?.method ?? null, status: p?.status ?? null, transactionId: p?.transaction_id ?? null,
    capturedPaise: captured, refundedPaise: refunded, openPaise: open, availablePaise: Math.max(0, captured - refunded - open), hasOpenRefund: r!.open_count > 0,
  };
}

/** Marks the payment refunded once every rupee is back. Returns true when it is. */
export async function settleIfFullyRefunded(tx: Transaction, orderId: string): Promise<boolean> {
  const state = await paymentState(tx, orderId, false);
  if (!state.paymentId || state.capturedPaise === 0 || state.refundedPaise < state.capturedPaise) return false;
  await tx.execute(sql`UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = ${state.paymentId} AND status <> 'refunded'`);
  return true;
}

/** A UPI id or bank account shown only partly: as***@okaxis, ••••1234. The full value is never stored. */
export function maskDestination(raw: string): string {
  const v = raw.trim().replace(/\s+/g, '');
  if (v.includes('@')) {
    const [name, bank] = v.split('@') as [string, string];
    return `${name.slice(0, 2)}***@${bank}`.slice(0, 100);
  }
  const digits = v.replace(/\D/g, '');
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : '••••';
}

export interface NewRefund {
  orderId: string;
  amountPaise: number;
  reason: string;
  method: RefundMethod;
  /** UPI id or bank account for a cash-on-delivery payout; masked before storing. */
  destination?: string;
  /** One per staff intent: a retried click returns the same refund. */
  idempotencyKey: string;
  actorId: string;
}

/**
 * One refund, inside the caller's order transaction. Prepaid money goes back
 * to its source through the gateway at once. Cash on delivery is paid out by
 * staff over UPI or bank transfer: the refund stays 'processing' until the
 * UTR is recorded. Never more than what is left, never two open at once.
 */
export async function createRefund(tx: Transaction, gateway: PaymentGateway, input: NewRefund): Promise<{ refundId: string; status: 'completed' | 'processing'; replayed: boolean }> {
  const { rows: [earlier] } = await tx.execute<{ id: string; status: 'completed' | 'processing' | 'rejected'; amount: string }>(sql`
    SELECT id, status, amount FROM refunds WHERE order_id = ${input.orderId} AND idempotency_key = ${input.idempotencyKey}`);
  if (earlier) {
    if (paise(earlier.amount) !== input.amountPaise) throw new AppError('IDEMPOTENCY_KEY_REUSED', 'This refund was already submitted with a different amount. Reload and try again.');
    return { refundId: earlier.id, status: earlier.status === 'completed' ? 'completed' : 'processing', replayed: true };
  }
  const state = await paymentState(tx, input.orderId);
  const field = (name: string, message: string, code: 'VALIDATION_FAILED' | 'RULE_VIOLATION' | 'CONFLICT' = 'RULE_VIOLATION') => new AppError(code, message, [{ field: name, message }]);
  if (!state.paymentId) throw field('order', 'This order has no payment to refund.');
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) throw field('amount', 'Enter an amount above zero.', 'VALIDATION_FAILED');
  if (state.hasOpenRefund) throw field('order', 'A refund for this order is still being paid out. Finish or reject it first.', 'CONFLICT');
  if (state.capturedPaise === 0) {
    throw field('order', state.method === 'cod' ? 'Cash on delivery has not been collected for this order yet, so there is nothing to refund.' : 'No money was taken for this order.');
  }
  if (input.amountPaise > state.availablePaise) throw field('amount', `At most ₹${(state.availablePaise / 100).toFixed(2)} can still be refunded.`);
  const cod = state.method === 'cod';
  if (cod && input.method === 'source') throw field('method', 'Cash on delivery has no payment to reverse. Pay it out by UPI or bank transfer.');
  if (!cod && input.method !== 'source') throw field('method', 'Prepaid money goes back to the original payment.');
  if (cod && !input.destination?.trim()) throw field('destination', 'Enter the UPI id or bank account the money goes to.', 'VALIDATION_FAILED');

  const id = uuidv7();
  const amount = toRupees(input.amountPaise);
  const reason = input.reason.trim().slice(0, 255);
  if (!cod) {
    const result = state.transactionId
      ? await gateway.refund({ providerRef: state.transactionId, amountPaise: input.amountPaise, reference: id })
      : { providerRef: `zero-${id}`, status: 'refunded' as const };
    await tx.execute(sql`INSERT INTO refunds (id, order_id, payment_id, amount, reason, method, payout_reference, idempotency_key, status, actor)
      VALUES (${id}, ${input.orderId}, ${state.paymentId}, ${amount}, ${reason}, 'source', ${result.providerRef}, ${input.idempotencyKey}, 'completed', ${input.actorId})`);
    return { refundId: id, status: 'completed', replayed: false };
  }
  await tx.execute(sql`INSERT INTO refunds (id, order_id, payment_id, amount, reason, method, payout_destination_masked, idempotency_key, status, actor)
    VALUES (${id}, ${input.orderId}, ${state.paymentId}, ${amount}, ${reason}, ${input.method}, ${maskDestination(input.destination!)}, ${input.idempotencyKey}, 'processing', ${input.actorId})`);
  return { refundId: id, status: 'processing', replayed: false };
}

/** The bank UTR (or UPI reference) proves the payout. One reference, one refund. */
export async function completeRefund(tx: Transaction, refundId: string, payoutReference: string): Promise<{ orderId: string }> {
  const ref = payoutReference.trim().toUpperCase();
  if (!/^[A-Z0-9]{6,30}$/.test(ref)) throw new AppError('VALIDATION_FAILED', 'Enter the 6–30 character UTR or UPI reference.', [{ field: 'payoutReference', message: 'Check the reference.' }]);
  const { rows: [r] } = await tx.execute<{ order_id: string; status: string }>(sql`SELECT order_id, status FROM refunds WHERE id = ${refundId} FOR UPDATE`);
  if (!r) throw new AppError('NOT_FOUND', 'That refund does not exist.');
  if (r.status !== 'processing') throw new AppError('RULE_VIOLATION', `This refund is already ${r.status}.`);
  try {
    await tx.execute(sql`UPDATE refunds SET status = 'completed', payout_reference = ${ref}, updated_at = now() WHERE id = ${refundId}`);
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === '23505') throw new AppError('CONFLICT', 'That reference is already recorded against another refund.', [{ field: 'payoutReference', message: 'Already used.' }]);
    throw error;
  }
  return { orderId: r.order_id };
}

/** A payout that will not happen. The money stays available to refund another way. */
export async function rejectRefund(tx: Transaction, refundId: string): Promise<{ orderId: string }> {
  const { rows: [r] } = await tx.execute<{ order_id: string; status: string }>(sql`SELECT order_id, status FROM refunds WHERE id = ${refundId} FOR UPDATE`);
  if (!r) throw new AppError('NOT_FOUND', 'That refund does not exist.');
  if (r.status !== 'processing') throw new AppError('RULE_VIOLATION', `This refund is already ${r.status}.`);
  await tx.execute(sql`UPDATE refunds SET status = 'rejected', updated_at = now() WHERE id = ${refundId}`);
  return { orderId: r.order_id };
}

/** Cash on delivery collected by the courier: the money is now ours (and refundable). */
export async function recordCodCollected(tx: Transaction, orderId: string): Promise<void> {
  const { rows: [p] } = await tx.execute<{ id: string; method: string; status: string }>(sql`SELECT id, method, status FROM payments WHERE order_id = ${orderId} ORDER BY created_at DESC LIMIT 1 FOR UPDATE`);
  if (!p) throw new AppError('NOT_FOUND', 'This order has no payment record.');
  if (p.method !== 'cod') throw new AppError('RULE_VIOLATION', 'Only cash-on-delivery payments are collected by hand.');
  if (p.status !== 'pending') throw new AppError('RULE_VIOLATION', `This payment is already ${p.status}.`);
  await tx.execute(sql`UPDATE payments SET status = 'captured', paid_at = now(), updated_at = now() WHERE id = ${p.id}`);
}

/**
 * Money back for a cancelled order: whatever is still held goes back to its
 * source. Cash on delivery took nothing, so there is nothing to refund.
 * Keyed per order, so it can never run twice.
 */
export async function refundCancelledOrder(tx: Transaction, gateway: PaymentGateway, input: { orderId: string; actorId: string; reason?: string }): Promise<{ refunded: boolean }> {
  const state = await paymentState(tx, input.orderId);
  if (!state.paymentId || state.method === 'cod' || state.status !== 'captured') return { refunded: false };
  if (state.availablePaise > 0) {
    const result = state.transactionId
      ? await gateway.refund({ providerRef: state.transactionId, amountPaise: state.availablePaise, reference: `cancel-${input.orderId}` })
      : { providerRef: `zero-${input.orderId}`, status: 'refunded' as const };
    await tx.execute(sql`INSERT INTO refunds (id, order_id, payment_id, amount, reason, method, payout_reference, idempotency_key, status, actor)
      VALUES (${uuidv7()}, ${input.orderId}, ${state.paymentId}, ${toRupees(state.availablePaise)}, ${(input.reason ?? 'Cancelled by the customer inside the free-cancel window').slice(0, 255)}, 'source', ${result.providerRef}, ${`cancel:${input.orderId}`}, 'completed', ${input.actorId})`);
  }
  await tx.execute(sql`UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = ${state.paymentId}`);
  return { refunded: true };
}
