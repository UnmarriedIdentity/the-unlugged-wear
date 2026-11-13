import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAMES, verifyAccessToken, type AuthApp } from '../modules/auth/tokens.ts';

// Optimistic gate for proxy.ts (auth-guards skill): verifies the signed
// access cookie only — no database, never the real permission check.
// Expired + refresh cookie → /api/auth/refresh?next=…; nothing → login.

export interface AuthProxyOptions {
  app: AuthApp;
  /** true when the path needs a signed-in user */
  isProtected: (pathname: string) => boolean;
  loginPath?: string;
}

export function createAuthProxy({ app, isProtected, loginPath = '/login' }: AuthProxyOptions) {
  const names = COOKIE_NAMES[app];
  return function proxy(request: NextRequest): NextResponse {
    const { pathname, search } = request.nextUrl;
    if (!isProtected(pathname)) return NextResponse.next();
    const next = `${pathname}${search}`;
    if (verifyAccessToken(request.cookies.get(names.access)?.value, app).ok) return NextResponse.next();
    const target = request.cookies.get(names.refresh)?.value
      ? `/api/auth/refresh?next=${encodeURIComponent(next)}`
      : `${loginPath}?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(new URL(target, request.url));
  };
}
