import 'server-only';

// Admin → storefront cache refresh (route-handlers skill). The storefront is a
// separate deployment, so after a write that changes what shoppers see the
// admin asks it to expire those cache tags. A failed call never fails the
// save: the storefront's own cache lifetime (hours) still picks it up.

export type StorefrontRefresh = { ok: true } | { ok: false; reason: string };

export async function refreshStorefront(tags: string[]): Promise<StorefrontRefresh> {
  const base = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return { ok: false, reason: 'Storefront refresh is not configured (STOREFRONT_URL / REVALIDATE_SECRET).' };
  try {
    const res = await fetch(new URL('/api/revalidate', base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    return res.ok ? { ok: true } : { ok: false, reason: `Storefront answered ${res.status}.` };
  } catch (error) {
    console.warn('[storefront-cache] refresh failed', (error as Error).message);
    return { ok: false, reason: 'The storefront could not be reached.' };
  }
}
