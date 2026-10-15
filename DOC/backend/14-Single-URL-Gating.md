# Single-URL Gating — Middleware, Wrappers, Deny Behavior

> Status: Filling | Last Updated: 2026-10-15
> One domain serves both experiences; paths decide access, roles decide
> identity. Route groups (`(admin)`/`(storefront)`) are URL-transparent —
> the gate keys off **paths**, never groups. Role source: file 03 §5.

## Matcher map (`middleware.ts`)

| Path pattern | Rule |
|---|---|
| `/dashboard/*`, `/api/admin/*` | `admin` role required |
| `/api/cart`, `/api/order`, `/api/me/*` | session required (customer or guest-with-`x-session-id` where applicable) |
| `/`, `/products/*`, `/collections/*`, `/journal/*`, public `/api/*` reads | public |
| `/_next/*`, static assets, `/favicon.ico` | excluded from matcher (never gated, never session-touched) |

## Role resolution (edge-light)

Session cookie → `user_id` → role slugs via the file-03 gate queries,
cached 5 minutes. Middleware never opens a pg connection: it reads the
signed session payload + cache only. Staleness is bounded (15m access TTL
+ 5m role cache), never manually invalidated — rotation and revocation
propagate within those windows by construction.

## Deny behavior (truthful, never masquerading)

- Unauthenticated on gated paths → `/login?next=<original>` (post-login
  return, no dead ends).
- Authenticated non-admin on admin paths → storefront home + truthful
  toast ("Admin access required") — never a fake 404.
- API denials use the envelope: `UNAUTHENTICATED` 401 / `FORBIDDEN` 403
  with `requestId` (file 13 codes).

## `withRole` wrapper contract (handler decorator)

```ts
withRole('admin', handler)          // slug gate
withPermission('order.refund', h)   // fine-grained gate
```

Resolves session → checks slug/permission → short-circuits 401/403 →
injects `ctx.user` (id + roles). Handlers stay thin (file 01 §4):
parse → `withRole` → service → shape. Guards never inline in handlers.

## Guest path (no role, no admin)

`x-session-id` carts and guest checkout-adjacent reads bypass role checks
but can never match an admin path (matcher runs first). Login merges
guest state per the file-05 rule, then the session upgrades to customer.

## Operational notes

- First admin is env-seeded (file 03 §4); middleware treats a missing
  role set as non-admin (fail closed).
- Every deny logs `{path, user_id?, reason}` at info level — the audit
  trail for gate decisions (separate from `audit_logs`, which records
  admin actions, not gate checks).
- Load test target: gate overhead <2ms p99 (cache hit) — matcher runs
  before any render or query.
