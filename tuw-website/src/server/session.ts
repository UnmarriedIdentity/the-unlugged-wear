import 'server-only';
import { createAppSession } from '@tuw/heart/next/session';
import { createGuards } from '@tuw/heart/platform/guards';

// Storefront session + guards (auth-guards skill). Actions import `guards`;
// Server Components use `session.requireUser()` / `getSessionSummary()`.
export const session = createAppSession('storefront');
export const guards = createGuards({ resolveContext: session.resolveContext });

export interface SessionSummary {
  name: string;
  email: string;
}

/** What the client needs to know about the shopper (no ids, no roles). */
export async function getSessionSummary(): Promise<SessionSummary | null> {
  const claims = await session.currentClaims();
  return claims ? { name: claims.name, email: claims.email } : null;
}
