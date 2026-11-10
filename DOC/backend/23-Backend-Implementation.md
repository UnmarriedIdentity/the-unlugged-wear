# Backend Implementation Plan — How the Code Is Built

> Status: Active | Last Updated: 2026-11-10
> Decisions agreed with the owner on 2026-11-10. Topology: file 12.
> Module rules: `4.API-Design.md`. Rendering rules: the
> `nextjs-rendering` skill in `state-for-agents/{admin,storefront}/skills/`.

## 1. No extra deployments

The backend runs **inside the two apps that are already deployed**:

- `tuw-website` serves the storefront API from its own route handlers and
  server actions.
- `tuw-admin` serves the admin API the same way.
- Shared backend code lives in a **workspace package** (`packages/core`,
  added to `pnpm-workspace.yaml`). Each app imports it and Next.js bundles
  it into that app's own build (`transpilePackages: ['@tuw/core']`), so the
  package is **never deployed on its own**. The "apps never import each
  other" rule still holds: the package belongs to neither app.

```
packages/core/src/
  platform/      db client, errors, auth/session, guards, idempotency, jobs, events
  modules/       cart, catalog, orders, returns, … (index.ts = public API)
  integrations/  payments/, fulfillment/, email/, storage/ (registry + adapters)
tuw-website/src/app/…   pages, server actions, route handlers (thin)
tuw-admin/src/app/…     pages, server actions, route handlers (thin)
```

A change to cart rules is made once in `modules/cart` and applies to both
apps on their next deploy.

## 2. Database access: Drizzle, portable to any Postgres

- **Drizzle ORM** for type-safe queries; `sql\`…\`` templates for the few
  queries an ORM writes badly (reports, ranked search, atomic stock
  decrement). Both are parameterised — no string-built SQL.
- **Driver: `pg` (node-postgres)** — speaks the standard Postgres
  protocol, so the same code runs on Neon, a local Postgres, RDS, Supabase
  or a self-hosted server. Switching host = changing `DATABASE_URL`. The
  Neon-only HTTP driver is not used, so nothing ties us to Neon.
- **Schema source of truth stays `db/migrate/*.sql`.** Drizzle table
  definitions are generated from the live database (`drizzle-kit pull`)
  after migrations run, and a test fails if they drift from the SQL.
- Pooling: serverless functions use Neon's pooled URL (`DATABASE_URL`);
  migrations and tests use the direct URL (`DATABASE_URL_UNPOOLED`).

**Why not raw SQL everywhere?** It is just as portable but gives no
compile-time checks — a renamed column breaks at runtime in production.
**Why not a heavy ORM (Prisma)?** It owns the schema and its own migration
format, which fights our hand-written SQL files. Drizzle sits in between:
types from our schema, SQL-shaped queries, no lock-in.

## 3. Role-based access, declared once

Next.js has no class decorators for route handlers or server actions, so
guards are **higher-order functions** — the same idea as a NestJS
`@Roles()` decorator, declared at the top of each entry point:

```ts
// server action (storefront or admin)
export const refundOrder = action({ permission: 'order.refund', input: RefundInput },
  async ({ input, ctx }) => payments.refund(ctx, input));

// route handler
export const POST = route({ role: 'admin', input: ImportInput }, handler);
```

`action()` / `route()` (in `platform/guards`) verify the session, check
the role or permission, validate input with zod, apply the idempotency key
and map errors to the API envelope. Server Components call the Data Access
Layer (`requireUser()`, `requireRole('admin')`) before reading data.
`proxy.ts` only does fast redirects for signed-out users — it is never the
security check (Next.js 16 guidance). Each check lives in one place.

## 4. Background jobs: Vercel Cron now, portable later

- Every job is a plain function in its module (`fulfillment.submitDue`,
  `fulfillment.syncOpen`, `notifications.sendQueued`,
  `inventory.notifyRestocked`, `giftCards.expireDue`) registered in
  `platform/jobs`.
- **Now:** Vercel Cron calls `/api/cron/[job]` in the admin app, protected
  by `CRON_SECRET`; the route just calls `runJob(name)`.
- **Later:** a Node worker on our own server calls the same `runJob(name)`
  on a timer — no job code changes.
- Jobs read their work from rows (`orders.cancellable_until`,
  `fulfillment_orders.status`, `email_logs.status`) and claim them with
  `SELECT … FOR UPDATE SKIP LOCKED`, so two runners never take the same
  row, and every job is safe to retry.

## 5. Next.js features (both apps)

Cache Components with Partial Prerendering, Server Components by default,
small Client Components only where interaction needs them, Server Actions
for mutations, tag-based cache invalidation after writes. The rules for
when to use each are in the `nextjs-rendering` skill.

## 6. Environments and testing

| Where | Database |
|---|---|
| Owner's machine | Neon **development** branch (`.env.local`, gitignored) |
| Teammates | Their own local Postgres or their own Neon branch — same code, different `DATABASE_URL` |
| Vercel preview | Neon preview branch |
| Production | Neon main branch |

- `pnpm db:migrate` applies `db/migrate/*.sql` in order and records them in
  `schema_migrations`; `pnpm db:seed` runs the seed. Both work on any
  Postgres.
- Integration tests create a throwaway schema per run on whatever database
  `DATABASE_URL` points to, apply the migrations there, and drop it
  afterwards. They never touch production.
- Unit tests (`node --test`) need no database.

## 7. Settings that change without a deploy

Shipping fees are not final. They are already rows in `store_settings`
(`shipping.standard_fee`, `shipping.free_threshold`, `shipping.cod_fee`),
read by the checkout module through one function, and edited in admin
Settings. Changing a fee is one edit in the admin — no code change, no
migration. The same applies to the cancel window, exchange window, gift
card validity and low-stock threshold.

## 8. Phases

1. **Core modules (now):** platform, auth, catalog, cart, checkout and
   orders (with mock payments), returns and exchanges, gift cards,
   newsletter, FAQs, support, settings, notifications (in-app), analytics.
   Each one replaces the demo data on its screens as it goes live.
2. **Integrations (last):** Razorpay, email provider, R2 uploads, Qikink
   live API, GST invoice PDFs/emails — see the `TL-INT-*` backlog in
   `state-for-agents/admin/tasks.json`.
3. Styling (Complete the Look) ships after the core store (file 19).
