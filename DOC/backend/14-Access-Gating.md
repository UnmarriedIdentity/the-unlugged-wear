# Access Gating — Per-App Guards, Wrappers, Deny Behavior

> Status: Active | Last Updated: 2026-11-10
> Replaces the single-URL gate. Each deployment gates its own routes; both
> resolve roles from the same tables (`users → user_roles → roles.slug`,
> file 03 §5). Topology: `12-Two-App-Deploy.md`.

## Storefront (`tuw-website`)

| Path pattern | Rule |
|---|---|
| `/`, `/products/*`, `/collections/*`, `/journal/*`, `/faq`, public `/api/*` reads | public |
| `/api/cart/*`, `/api/order/checkout`, `/api/order/track`, `/api/newsletter/*`, `/api/stock-alerts`, `/api/contact` | guest (signed `x-session-id` cookie) **or** customer |
| `/account/*`, `/api/me/*`, `/api/household/*` | customer session required |
| `/_next/*`, static assets, `/favicon.ico` | excluded from the matcher |

Staff accounts may shop on the storefront like any customer; staff roles
grant nothing extra here.

## Admin (`tuw-admin`)

| Path pattern | Rule |
|---|---|
| `/login`, `/forgot-password`, `/reset-password`, `/accept-invite`, `/verify` | public |
| every other page and every `/api/*` route | staff session with a role other than `customer` |
| individual actions | permission slug (`withPermission('order.refund', …)`) |

A customer-only account that signs in to the admin is refused.

## As built (TL-BE-02)

- `tuw-website/src/proxy.ts` protects `/account/*`; `tuw-admin/src/proxy.ts`
  protects everything except `/login`, `/forgot-password`,
  `/reset-password`, `/accept-invite`, `/signup`, `/verify` and `/api/*`
  (API routes guard themselves).
- Expired access + refresh cookie → `GET /api/auth/refresh?next=…` (rotates,
  returns); no cookies → login with `?next=`.
- Admin pages call `session.requireStaff(permission)`; missing permission →
  `/access-denied?need=<slug>`. Every action re-checks with
  `action({ permission })`.
- Admin sign-up is invitation only (`/signup` explains it; `/verify` redirects
  to `/login`).

## Sessions

Both apps use the same token design (file 03 §7): 15-minute access token,
30-day rotating refresh token stored hashed in `refresh_tokens`. Each app
sets its **own** cookie on its own domain — a storefront login does not
log anyone into the admin, and vice versa. The signing secret may differ
per app (recommended).

## Role resolution

Session → `user_id` → role slugs via the file-03 gate queries, cached for
5 minutes. Middleware reads only the signed session payload + cache and
never opens a database connection. Staleness is bounded (15m access TTL +
5m role cache).

## Deny behavior (truthful, never masquerading)

- Unauthenticated on a gated path → that app's `/login?next=<original>`.
- Storefront: guest on `/account/*` → `/login`. Admin: authenticated
  non-staff → admin login page with "Staff access required".
- API denials use the envelope: `UNAUTHENTICATED` 401 / `FORBIDDEN` 403
  with `requestId` (file 13 codes).

## `withRole` / `withPermission` wrappers (handler decorators)

```ts
withRole('admin', handler)          // slug gate
withPermission('order.refund', h)   // fine-grained gate
withGuestOrCustomer(handler)        // storefront: session cookie or user
```

Resolve session → check → short-circuit 401/403 → inject `ctx.user` (or
`ctx.guestSessionId`). Guards never inline in handlers.

## Guest path (storefront only)

`x-session-id` carts, guest checkout and guest track-order bypass role
checks. Guest access to an order is proven by order number + guest email,
never by order id alone. On login the guest cart merges (file 05) and the
session upgrades to customer.

## Operational notes

- First admin is env-seeded (file 03 §4); a missing role set is treated as
  no access (fail closed).
- Every deny logs `{app, path, user_id?, reason}` at info level.
- Gate overhead target: <2ms p99 on a cache hit.
