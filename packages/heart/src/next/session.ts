import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import * as auth from '../modules/auth/index.ts';
import { COOKIE_NAMES, GUEST_COOKIE, REFRESH_TTL_SECONDS, verifyAccessToken, type AccessClaims, type AuthApp } from '../modules/auth/tokens.ts';
import type { RequestContext } from '../platform/guards/index.ts';

// Next.js session adapter shared by both apps (auth-guards skill). Cookies
// are per app (tuw_sf_* / tuw_admin_*). Server Components only READ the
// access token; proxy.ts sends expired sessions through /api/auth/refresh;
// server actions and route handlers may refresh in place.

const isProd = () => process.env.NODE_ENV === 'production';

export function createAppSession(app: AuthApp, opts: { loginPath?: string } = {}) {
  const names = COOKIE_NAMES[app];
  const loginPath = opts.loginPath ?? '/login';

  async function currentClaims(): Promise<AccessClaims | null> {
    const store = await cookies();
    const result = verifyAccessToken(store.get(names.access)?.value, app);
    return result.ok ? result.claims : null;
  }

  async function setSession(tokens: auth.SessionTokens, remember = true): Promise<void> {
    const store = await cookies();
    const base = { httpOnly: true, secure: isProd(), sameSite: 'lax' as const, path: '/' };
    store.set(names.access, tokens.access.token, { ...base, maxAge: tokens.access.exp - Math.floor(Date.now() / 1000) });
    store.set(names.refresh, tokens.refresh.token, remember ? { ...base, maxAge: REFRESH_TTL_SECONDS } : base);
  }

  async function clearSession(): Promise<void> {
    const store = await cookies();
    store.delete(names.access);
    store.delete(names.refresh);
  }

  /** In actions / route handlers: refresh an expired access token in place. */
  async function claimsOrRefresh(): Promise<AccessClaims | null> {
    const claims = await currentClaims();
    if (claims) return claims;
    const store = await cookies();
    const refreshToken = store.get(names.refresh)?.value;
    if (!refreshToken) return null;
    try {
      const tokens = await auth.refresh(refreshToken, app, { userAgent: (await headers()).get('user-agent') });
      await setSession(tokens);
      return tokens.claims;
    } catch {
      try { await clearSession(); } catch { /* read-only context (Server Component) */ }
      return null;
    }
  }

  /** Guard resolver: createGuards({ resolveContext }). */
  async function resolveContext(): Promise<Omit<RequestContext, 'requestId'>> {
    const claims = await claimsOrRefresh();
    const guest = app === 'storefront' ? (await cookies()).get(GUEST_COOKIE)?.value ?? null : null;
    return {
      user: claims ? { id: claims.sub, roles: claims.roles, permissions: claims.perms } : null,
      guestSessionId: guest,
    };
  }

  /** Request metadata for auth service calls (IP is best-effort). */
  async function requestMeta(): Promise<auth.RequestMeta> {
    const h = await headers();
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || h.get('x-real-ip') || null;
    const origin = process.env.APP_URL ?? (h.get('origin') || `http${isProd() ? 's' : ''}://${h.get('host')}`);
    return { ip: ip && /^[0-9a-fA-F.:]{3,45}$/.test(ip) ? ip : null, userAgent: h.get('user-agent'), origin };
  }

  /** Server Components / DAL: signed-in user or redirect to login. */
  async function requireUser(next = '/'): Promise<AccessClaims> {
    const claims = await currentClaims();
    if (!claims) redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
    return claims;
  }

  /** Admin DAL: staff with an optional permission; otherwise login / access-denied. */
  async function requireStaff(permission?: string, next = '/dashboard'): Promise<AccessClaims> {
    const claims = await requireUser(next);
    if (!claims.roles.some((r) => r !== 'customer')) redirect(`${loginPath}?denied=staff`);
    if (permission && !claims.perms.includes(permission)) {
      redirect(`/access-denied?need=${encodeURIComponent(permission)}&from=${encodeURIComponent(next)}`);
    }
    return claims;
  }

  /** GET /api/auth/refresh?next=… — rotate, set cookies, go back. */
  async function refreshRoute(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const rawNext = url.searchParams.get('next') ?? '/';
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/api/auth/refresh') ? rawNext : '/';
    const store = await cookies();
    const token = store.get(names.refresh)?.value;
    if (token) {
      try {
        await setSession(await auth.refresh(token, app, { userAgent: request.headers.get('user-agent') }));
        return Response.redirect(new URL(next, url), 303);
      } catch {
        await clearSession();
      }
    }
    return Response.redirect(new URL(`${loginPath}?next=${encodeURIComponent(next)}`, url), 303);
  }

  return { app, names, currentClaims, claimsOrRefresh, setSession, clearSession, resolveContext, requestMeta, requireUser, requireStaff, refreshRoute };
}

/** Safe same-site redirect target from user input. */
export function safeNext(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : fallback;
}
