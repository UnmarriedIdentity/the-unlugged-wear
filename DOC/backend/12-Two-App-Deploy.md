# Two-App Deploy — Storefront API, Admin API, One Database

> Status: Active | Last Updated: 2026-11-10
> Replaces the earlier single-URL merge plan (decided 2026-11-10: the
> storefront and the admin panel stay two separately deployed apps).
> Access rules per app: `14-Access-Gating.md`. Routes: `13-API-Contracts.md`.

## Topology

```
                ┌──────────────────────────┐      ┌──────────────────────────┐
 shoppers ───▶  │ tuw-website (Next.js)    │      │ tuw-admin (Next.js)      │ ◀─── staff
                │  storefront UI           │      │  admin UI                │
                │  /api/* storefront API   │      │  /api/* admin API        │
                └────────────┬─────────────┘      └────────────┬─────────────┘
                             │   pooled connections (DATABASE_URL)   │
                             └──────────────┐   ┌────────────────────┘
                                            ▼   ▼
                                  ┌──────────────────────┐        ┌──────────┐
                                  │ Neon Postgres (one)  │        │ R2 bytes │
                                  │ schema: db/migrate   │        └──────────┘
                                  └──────────────────────┘
```

- **Two deployments, two domains**, each with its own build, env vars and
  release cadence. Neither app imports source from the other (`AGENTS.md`
  §4) and neither calls the other over HTTP on the request path.
- **One database.** Both apps connect to the same Neon Postgres. The schema
  lives once, at the repo root in `db/migrate` + `db/seed`, and is applied
  by a migration step that belongs to neither app.
- **Each app owns its API.** The storefront API serves public, guest and
  customer routes; the admin API serves staff routes. Shared business rules
  (prices, stock decrement, order status changes) are enforced by database
  constraints first, so the two codebases cannot drift into inconsistent
  data even though their service code is separate.

## Where code lives (target layout)

```
db/                      ← shared: migrations, seed, migration runner
tuw-website/src/server/  ← storefront services + DB access (server-only)
tuw-website/src/app/api/ ← thin storefront route handlers
tuw-admin/src/server/    ← admin services + DB access (server-only)
tuw-admin/src/app/api/   ← thin admin route handlers
```

`server/` is UI-free and UI never imports it (`server-only`). Route
handlers stay thin: parse → guard → service → shape (file 01 §4).

## Database access rules for two apps

- **Connection:** each app reads `DATABASE_URL` (Neon pooled connection
  string). Serverless functions use the pooled endpoint; the migration
  runner uses the direct (unpooled) endpoint.
- **Pool:** `pg.Pool` per app instance, `DATABASE_POOL_MAX` (default 5),
  idle connections kept `DATABASE_POOL_IDLE_MS` (default 5 min) with TCP
  keep-alive. A new TLS connection costs ~10 round trips (measured 3.6 s
  from India to US East, warm query 350 ms), so short idle timeouts make
  every pause pay the handshake. Deploy the functions in the database's
  region (Vercel `iad1`/`cle1` for Neon `us-east-2`) — round trips there are
  a few ms.
- **Least privilege (recommended):** two Postgres roles —
  `tuw_storefront` (no access to staff-only tables such as `audit_logs`,
  `staff_invitations`, `import_jobs`) and `tuw_admin` (full DML). Neither
  role can run DDL; only the migration role can.
- **No row-level security in v1.** RLS exists for databases exposed directly
  to browsers (the Supabase model). Here only server code connects, so
  access is enforced in each API's guards and by the role grants above.
- **Shared invariants stay in SQL** (CHECKs, FKs, partial uniques,
  idempotency keys) so both apps get them for free.

## Cross-app effects without cross-app calls

When one app's write must become visible to the other (a storefront order
appearing in the admin, an admin status change appearing on the customer's
order page), both simply read the same rows. Side effects that need a
worker (emails, Qikink submission, back-in-stock mails) are queued as rows
(`email_logs`, `fulfillment_orders`, `notifications`) and processed by the app
that owns them — no message broker in v1.

## Release order

1. Apply migrations (`db/migrate`, in file order) to Neon, then the seed.
2. Deploy the admin API (staff can prepare the catalog).
3. Deploy the storefront API.

A migration must stay backward compatible with the currently deployed
version of **both** apps (add columns before using them; remove only after
neither app reads them).
