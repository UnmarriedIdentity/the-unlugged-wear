'use server';

import * as cart from '@tuw/heart/modules/cart';
import { cartSchemas as s, type CartOwner } from '@tuw/heart/modules/cart';
import type { RequestContext } from '@tuw/heart/platform/guards';
import { z } from 'zod';
import { guards, session } from './session';

// Bag and wishlist (TL-BE-07). The bag is per person, so nothing here is
// cached. A guest gets a signed session cookie on their first add; signing
// in merges that bag into the account's (auth-actions).

const ownerOf = (ctx: Omit<RequestContext, 'requestId'>): CartOwner | null =>
  ctx.user ? { userId: ctx.user.id } : ctx.guestSessionId ? { sessionId: ctx.guestSessionId } : null;

/** Everything the store needs on load, in one round trip. */
export const getBagAction = guards.action({ access: 'public', input: z.object({}) }, async ({ ctx }) => {
  const owner = ownerOf(ctx);
  const [bag, wishlist] = await Promise.all([
    owner ? cart.getCart(owner) : Promise.resolve({ id: null, lines: [] } as cart.CartView),
    ctx.user ? cart.listWishlist(ctx.user.id) : Promise.resolve([] as string[]),
  ]);
  return { lines: bag.lines, wishlist, signedIn: Boolean(ctx.user) };
});

export const addToBagAction = guards.action({ access: 'public', input: s.addLine }, async ({ input, ctx }) => {
  const owner: CartOwner = ctx.user ? { userId: ctx.user.id } : { sessionId: await session.ensureGuestId() };
  const { productId, ...rest } = input;
  return (await cart.addLine(owner, { productRef: productId, ...rest })).lines;
});

export const setBagQtyAction = guards.action({ access: 'guestOrCustomer', input: s.setQty }, async ({ input, ctx }) =>
  (await cart.setLineQty(ownerOf(ctx)!, input.lineId, input.qty)).lines);

export const changeBagVariantAction = guards.action({ access: 'guestOrCustomer', input: s.changeVariant }, async ({ input, ctx }) =>
  (await cart.changeLineVariant(ownerOf(ctx)!, input.lineId, { color: input.color, size: input.size })).lines);

export const removeFromBagAction = guards.action({ access: 'guestOrCustomer', input: s.removeLines }, async ({ input, ctx }) =>
  (await cart.removeLines(ownerOf(ctx)!, input.lineIds)).lines);

export const clearBagAction = guards.action({ access: 'guestOrCustomer', input: z.object({}) }, async ({ ctx }) =>
  (await cart.clearCart(ownerOf(ctx)!)).lines);

/** Customers only: a guest's heart asks them to sign in. */
export const setWishlistAction = guards.action({ access: 'customer', input: s.wishlistToggle }, async ({ input, ctx }) =>
  cart.setWishlisted(ctx.user!.id, input.productId, input.saved));
