'use server';

import { z } from 'zod';
import * as catalog from '@tuw/heart/modules/catalog';
import { catalogSchemas as s } from '@tuw/heart/modules/catalog';
import { guards } from './session';
import { cachedReviews, cachedSearch } from './catalog';

// Storefront catalog actions. Search suggestions and reading reviews are
// public; writing a review needs a signed-in customer (and, in the service,
// a delivered order).

export const suggestAction = guards.action({ access: 'public', input: s.searchQuery }, async ({ input }) => {
  const term = catalog.normalizeTerm(input.q);
  return term.length < 2 ? [] : (await cachedSearch(term)).ids.slice(0, 6);
});

export const getReviewsAction = guards.action({ access: 'public', input: z.object({ productId: z.string().uuid() }) }, async ({ input, ctx }) => ({
  summary: await cachedReviews(input.productId),
  signedIn: Boolean(ctx.user),
  // Per-person state is never cached.
  ...(ctx.user ? await catalog.myReviewState(ctx.user.id, input.productId) : { canReview: false, mine: null }),
}));

export const submitReviewAction = guards.action({ access: 'customer', input: s.reviewSubmit }, async ({ input, ctx }) => {
  await catalog.submitReview(ctx.user!.id, input);
  return { ok: true };
});
