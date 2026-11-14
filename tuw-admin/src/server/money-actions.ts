'use server';

import * as orders from '@tuw/heart/modules/orders';
import { orderSchemas as s } from '@tuw/heart/modules/orders';
import { toPaise } from '@tuw/heart/platform/money';
import { guards } from './session';

// Payments and refunds (TL-BE-09). Reading needs order.view; anything that
// moves money needs order.refund, checked here and inside the service's
// transaction rules (amount ≤ what is left, one open payout, one key = one refund).

export const listPaymentsAction = guards.action({ permission: 'order.view', input: s.moneyList }, async ({ input }) => orders.listPayments(input));

export const listRefundsAction = guards.action({ permission: 'order.view', input: s.moneyList }, async ({ input }) => orders.listRefunds(input));

export const refundableOrderAction = guards.action({ permission: 'order.view', input: s.orderRef }, async ({ input }) => orders.refundableOrder(input.orderNumber));

export const issueRefundAction = guards.action({ permission: 'order.refund', input: s.refundIssue }, async ({ input, ctx }) => {
  const { amount, refundKey, ...rest } = input;
  return orders.issueRefund({ ...rest, idempotencyKey: refundKey, amountPaise: toPaise(amount.toFixed(2)) }, ctx.user!.id);
});

export const markRefundPaidAction = guards.action({ permission: 'order.refund', input: s.refundComplete }, async ({ input, ctx }) => {
  await orders.markRefundPaid(input.refundId, input.payoutReference, ctx.user!.id);
  return { ok: true };
});

export const rejectRefundAction = guards.action({ permission: 'order.refund', input: s.refundReject }, async ({ input, ctx }) => {
  await orders.markRefundRejected(input.refundId, input.note, ctx.user!.id);
  return { ok: true };
});

export const markCodCollectedAction = guards.action({ permission: 'order.refund', input: s.orderRef }, async ({ input, ctx }) => {
  await orders.markCodCollected(input.orderNumber, ctx.user!.id);
  return { ok: true };
});
