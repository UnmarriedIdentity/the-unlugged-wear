'use server';

import * as auth from '@tuw/heart/modules/auth';
import { mergeGuestCart } from '@tuw/heart/modules/cart';
import { authSchemas } from '@tuw/heart/modules/auth';
import { safeNext } from '@tuw/heart/next/session';
import { guards, session } from './session';

// Storefront auth actions. Each is declared with a guard (server-actions
// skill); the result is an ActionResult the form renders — typed values are
// kept by the client form on failure.

/** The guest's bag joins the account's. A failed merge never fails the sign-in. */
async function adoptGuestBag(guestSessionId: string | null, userId: string): Promise<void> {
  if (!guestSessionId) return;
  try {
    await mergeGuestCart(guestSessionId, userId);
    await session.clearGuest();
  } catch (error) {
    console.warn('[cart] guest bag merge failed', error);
  }
}

export const loginAction = guards.action({ access: 'public', input: authSchemas.login }, async ({ input, ctx }) => {
  const tokens = await auth.login({ email: input.email, password: input.password, app: 'storefront' }, await session.requestMeta());
  await session.setSession(tokens, input.remember ?? false);
  await adoptGuestBag(ctx.guestSessionId, tokens.claims.sub);
  return { next: safeNext(input.next, '/account'), name: tokens.claims.name };
});

export const registerAction = guards.action({ access: 'public', input: authSchemas.register }, async ({ input, ctx }) => {
  const tokens = await auth.register(input, await session.requestMeta());
  await session.setSession(tokens, true);
  await adoptGuestBag(ctx.guestSessionId, tokens.claims.sub);
  return { next: safeNext(input.next, '/account'), verifyLink: tokens.verifyLink ?? null };
});

export const forgotPasswordAction = guards.action({ access: 'public', input: authSchemas.forgot }, async ({ input }) => {
  const { devLink } = await auth.requestPasswordReset(input.email, await session.requestMeta(), 'storefront');
  return { devLink: devLink ?? null };
});

export const resetPasswordAction = guards.action({ access: 'public', input: authSchemas.reset }, async ({ input }) => {
  await auth.resetPassword(input.token, input.password);
  await session.clearSession();
  return { done: true };
});

export const verifyEmailAction = guards.action({ access: 'public', input: authSchemas.verify }, async ({ input }) => {
  await auth.verifyEmail(input.token);
  return { done: true };
});

export const logoutAction = guards.action({ access: 'public', input: authSchemas.forgot.partial() }, async () => {
  const { cookies } = await import('next/headers');
  await auth.logout((await cookies()).get(session.names.refresh)?.value);
  await session.clearSession();
  return { done: true };
});
