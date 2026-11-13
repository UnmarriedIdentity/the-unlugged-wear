'use server';

import * as cart from '@tuw/heart/modules/cart';
import * as orders from '@tuw/heart/modules/orders';
import { orderSchemas as s } from '@tuw/heart/modules/orders';
import { z } from 'zod';
import { hitRateLimit } from '@tuw/heart/platform/ratelimit';
import { guards, session } from './session';

// Checkout and the shopper's orders (TL-BE-08). Prices, stock and totals are
// decided on the server from the bag; the form only says where and how to pay.
// Per-person data, so nothing here is cached.

export const placeOrderAction = guards.action({ access: 'guestOrCustomer', input: s.placeOrder }, async ({ input, ctx }) => {
  const buyer: orders.Buyer = ctx.user ? { userId: ctx.user.id, email: '' } : { sessionId: ctx.guestSessionId! };
  const placed = await orders.placeOrder(buyer, input);
  return { orderNumber: placed.orderNumber, receipt: placed.receipt, totals: placed.totals, cancellableUntil: placed.cancellableUntil };
});

/** "Apply" on a discount code: checked against the bag on the server; nothing is reserved. */
export const previewDiscountAction = guards.action({ access: 'public', input: s.discountPreview }, async ({ input, ctx }) => {
  const owner: cart.CartOwner | null = ctx.user ? { userId: ctx.user.id } : ctx.guestSessionId ? { sessionId: ctx.guestSessionId } : null;
  const bag = owner ? await cart.getCart(owner) : { lines: [] };
  const subtotal = bag.lines.reduce((n, l) => n + l.unitPaise * l.qty, 0);
  return orders.previewDiscount(input.code, subtotal);
});

export const getOrderAction = guards.action({ access: 'public', input: s.receiptRef }, async ({ input, ctx }) =>
  orders.getOrderForViewer(input.orderNumber, { userId: ctx.user?.id ?? null, receipt: input.receipt }));

export const myOrdersAction = guards.action({ access: 'customer', input: z.object({}) }, async ({ ctx }) => orders.listMyOrders(ctx.user!.id));

export const cancelOrderAction = guards.action({ access: 'customer', input: s.orderRef }, async ({ input, ctx }) => {
  const result = await orders.cancelOrder(ctx.user!.id, input.orderNumber);
  return { ...result, order: await orders.getOrderForViewer(input.orderNumber, { userId: ctx.user!.id }) };
});

/**
 * Guest tracking: order number + email. Limited per visitor and per order
 * number, so the form cannot be used to guess either.
 */
export const trackOrderAction = guards.action({ access: 'public', input: s.trackOrder }, async ({ input }) => {
  const { ip } = await session.requestMeta();
  await hitRateLimit('orders.track', [
    { key: ip ?? '', max: 20, windowSeconds: 600 },
    { key: input.orderNumber.toUpperCase(), max: 10, windowSeconds: 600 },
  ]);
  return orders.trackOrder(input.orderNumber, input.email);
});

export const claimStatusAction = guards.action({ access: 'customer', input: z.object({}) }, async ({ ctx }) => orders.claimableGuestOrders(ctx.user!.id));

export const claimOrdersAction = guards.action({ access: 'customer', input: z.object({}) }, async ({ ctx }) => orders.claimGuestOrders(ctx.user!.id));

