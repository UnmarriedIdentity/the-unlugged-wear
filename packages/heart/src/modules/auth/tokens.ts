// Access tokens + opaque secrets. No database and no server-only import, so
// each app's proxy.ts can verify an access token cheaply (auth-guards skill:
// the proxy only does optimistic checks — the guards re-verify).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type AuthApp = 'storefront' | 'admin';

export interface AccessClaims {
  sub: string; // user id
  app: AuthApp;
  name: string;
  email: string;
  roles: string[];
  perms: string[];
  iat: number; // seconds
  exp: number; // seconds
}

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

export const COOKIE_NAMES: Record<AuthApp, { access: string; refresh: string }> = {
  storefront: { access: 'tuw_sf_at', refresh: 'tuw_sf_rt' },
  admin: { access: 'tuw_admin_at', refresh: 'tuw_admin_rt' },
};
export const GUEST_COOKIE = 'tuw_sid';
export const GUEST_TTL_SECONDS = 30 * 24 * 60 * 60;

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');

function secretFor(app: AuthApp, env: NodeJS.ProcessEnv = process.env): Buffer {
  const secret = env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be set (at least 32 characters).');
  // Domain-separate the two apps even if they share a secret.
  return createHmac('sha256', secret).update(`tuw:${app}`).digest();
}

/** Proof that whoever holds it placed this order: lets a guest see their own receipt. */
export const signReceipt = (orderId: string): string => b64url(createHmac('sha256', secretFor('storefront')).update(`receipt:${orderId}`).digest()).slice(0, 32);

export function verifyReceipt(orderId: string, token: string | undefined | null): boolean {
  if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) return false;
  const expected = Buffer.from(signReceipt(orderId));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** A new guest session: random id plus its signature, so a cookie cannot be guessed or forged. */
export function newGuestCookie(): { id: string; value: string } {
  const id = randomBytes(16).toString('hex');
  return { id, value: `${id}.${guestSignature(id)}` };
}

const guestSignature = (id: string) => b64url(createHmac('sha256', secretFor('storefront')).update(`guest:${id}`).digest()).slice(0, 32);

/** The guest id inside a cookie, or null when it is missing, malformed or not ours. */
export function verifyGuestCookie(value: string | undefined | null): string | null {
  const match = /^([0-9a-f]{32})\.([A-Za-z0-9_-]{32})$/.exec(value ?? '');
  if (!match) return null;
  const expected = Buffer.from(guestSignature(match[1]!));
  const given = Buffer.from(match[2]!);
  return given.length === expected.length && timingSafeEqual(given, expected) ? match[1]! : null;
}

export function signAccessToken(claims: Omit<AccessClaims, 'iat' | 'exp'>, nowSeconds = Math.floor(Date.now() / 1000)): { token: string; exp: number } {
  const full: AccessClaims = { ...claims, iat: nowSeconds, exp: nowSeconds + ACCESS_TTL_SECONDS };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'TUW1' }));
  const body = b64url(JSON.stringify(full));
  const sig = b64url(createHmac('sha256', secretFor(claims.app)).update(`${header}.${body}`).digest());
  return { token: `${header}.${body}.${sig}`, exp: full.exp };
}

export type VerifyResult =
  | { ok: true; claims: AccessClaims }
  | { ok: false; reason: 'missing' | 'malformed' | 'signature' | 'expired' | 'wrong_app' };

export function verifyAccessToken(token: string | undefined | null, app: AuthApp, nowSeconds = Math.floor(Date.now() / 1000)): VerifyResult {
  if (!token) return { ok: false, reason: 'missing' };
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) return { ok: false, reason: 'malformed' };
  const [header, body, sig] = parts as [string, string, string];
  const expected = createHmac('sha256', secretFor(app)).update(`${header}.${body}`).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: 'signature' };
  let claims: AccessClaims;
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AccessClaims;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (claims.app !== app) return { ok: false, reason: 'wrong_app' };
  if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return { ok: false, reason: 'expired' };
  return { ok: true, claims };
}

/** 256-bit random secret, URL-safe (refresh tokens, reset/verify/invite links, guest ids). */
export const randomSecret = (bytes = 32): string => randomBytes(bytes).toString('base64url');

/** Only the SHA-256 of a secret is ever stored. */
export const hashSecret = (secret: string): string => createHash('sha256').update(secret).digest('hex');
