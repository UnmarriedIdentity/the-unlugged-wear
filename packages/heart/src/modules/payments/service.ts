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

/**
 * Money back for a cancelled order: the captured payment is reversed to its
 * source. Cash on delivery took nothing, so there is nothing to refund.
 * Keyed per order, so it can never run twice.
 */
export async function refundCancelledOrder(tx: Transaction, gateway: PaymentGateway, input: { orderId: string; actorId: string; reason?: string }): Promise<{ refunded: boolean }> {
  const { rows } = await tx.execute<{ id: string; amount: string; transaction_id: string | null; method: string }>(sql`
    SELECT id, amount, transaction_id, method FROM payments WHERE order_id = ${input.orderId} AND status = 'captured' FOR UPDATE`);
  const payment = rows[0];
  if (!payment || Number(payment.amount) === 0) return { refunded: false };
  const amountPaise = Math.round(Number(payment.amount) * 100);
  const result = payment.transaction_id
    ? await gateway.refund({ providerRef: payment.transaction_id, amountPaise, reference: `cancel-${input.orderId}` })
    : { providerRef: `zero-${input.orderId}`, status: 'refunded' as const };
  await tx.execute(sql`INSERT INTO refunds (id, order_id, payment_id, amount, reason, method, payout_reference, idempotency_key, status, actor)
    VALUES (${uuidv7()}, ${input.orderId}, ${payment.id}, ${payment.amount}, ${(input.reason ?? 'Cancelled by the customer inside the free-cancel window').slice(0, 255)}, 'source', ${result.providerRef}, ${`cancel:${input.orderId}`}, 'completed', ${input.actorId})`);
  await tx.execute(sql`UPDATE payments SET status = 'refunded', updated_at = now() WHERE id = ${payment.id}`);
  return { refunded: true };
}
