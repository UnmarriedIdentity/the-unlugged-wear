import { createAuthProxy } from '@tuw/heart/next/proxy';

// Optimistic gate only (auth-guards skill): account pages need a session.
// Every action and data read re-checks through the guards / DAL.
export const proxy = createAuthProxy({
  app: 'storefront',
  isProtected: (pathname) => pathname === '/account' || pathname.startsWith('/account/'),
});

export const config = { matcher: ['/account', '/account/:path*'] };
