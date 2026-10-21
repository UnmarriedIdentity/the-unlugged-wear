# Backend Conventions — Laws, Not Maps

> Status: Filling | Last Updated: 2026-10-21
> Everything here is a **rule**. For *where code lives* see `00-README.md`;
> for *migration order* see the domain files. If a rule needs an exception,
> the exception is recorded here with its reason — never silently.

## 1. Identity & time

- **Primary keys are UUIDv7**, generated in app code (`crypto.randomUUID`
  only as fallback). Time-ordered (index-friendly inserts), unguessable,
  merge-safe for future Shopify/external syncs. Never sequential integers,
  never slugs, as PKs.
- **Every mutable entity table carries `created_at` + `updated_at`**,
  `timestamptz NOT NULL DEFAULT now()`. Immutable and junction rows carry
  only the timestamps they need. UTC everywhere; no timezone-naive columns.
- Junction tables use **composite PKs** (`role_permissions(role_id,
  permission_id)`) — the PK *is* the dedupe constraint.

## 2. Money, enums, statuses

- **Money is `DECIMAL(12,2)` + `CHECK (col >= 0)`.** No floats, no
  minor-unit integers in the schema (the admin UI's paise convention stays
  a *presentation* concern until the currency decision in `00-README.md`
  §7 resolves). Percent fields add `CHECK (value <= 100)`.
- **Enums are `varchar` + `CHECK (col IN (...))`.** Adding a value alters a
  constraint — never a native ENUM type migration.
- **Workflow status is a `status` varchar + CHECK** (`draft/active/archived`,
  `pending/paid/failed…`) — lifecycle is separate from deletion.
- **Soft deletes (`deleted_at`) exist on catalog entities only**
  (products, categories, brands). Carts are ephemeral, orders/payments are
  audit-immutable — they are never soft-deleted.

## 3. Naming & indexing

- `snake_case`, plural table names, `idx_{table}_{columns}` indexes.
- **Explicit index on every FK column** — Postgres does not auto-index
  FKs; an unindexed FK turns child lookups into seq scans.
- Uniqueness that matters gets named unique constraints/indexes:
  login email, all slugs, SKUs, token hashes, one-default-address
  (partial unique), one-primary-image (partial unique), one-active-cart
  (partial unique), composite junction PKs.
- **Index the access path, not the column.** Uniqueness, FK cascades, and
  proven-hot lookups get indexes on day one; speculative filters (status
  sweeps on hundred-row tables) wait for measured need (~100k rows).
- **No speculative states.** Every status/enum value ships with the flow
  that reads it (`pending` returns with verification + token table).
- Hot filtered reads get **partial indexes** (`WHERE status='active'`,
  navbar flags) — narrow, fast, documented per table in the domain files.

## 4. Handler & service discipline

- **Route handlers are thin: parse → guard → service → shape.** Any
  handler over ~30 lines is a service-extraction signal, not a style.
- Auth/entitlement checks live in wrappers (`withRole('admin')`), never
  inline in handlers. Validation lives in `server/validation/` (zod) —
  handlers never hand-roll field checks.
- `server/` is UI-free: no JSX, no component imports, enforced by
  `server-only` once added. UI never imports `server/`.
- Errors follow the envelope in `13-API-Contracts.md`
  (`code/message/details/requestId`) — no bare 500s, no stack leaks.

## 5. Migration rules (structure lives in code at `server/db/migrate/`)

- **Numbered, single history:** `NNN-domain.sql` (`001-auth.sql`,
  `002-catalog.sql`…), strictly forward-only. No down migrations in v1 —
  forward fixes only, each one reviewed.
- One migration touches **one domain**. Cross-domain changes ship as two
  numbered files in dependency order, never one mixed file.
- Seeds are separate from schema (`seed/` beside `migrate/`): roles +
  permissions, default CMS doc, demo catalog for dev. Seeds are
  idempotent (`ON CONFLICT DO NOTHING`) — re-runnable safely.
- Every migration ends green on: `typecheck`, `test`, production `build`.

## 6. Data-integrity rules

- **Real FKs everywhere.** `ON DELETE CASCADE` for owned children
  (variants, images, options, order items); `RESTRICT`-by-default
  elsewhere — deletes that would orphan must fail loudly, not cascade
  silently.
- Snapshots over joins for money history: order/cart lines freeze
  name/price/slug at write time (deliberate denormalization — an order
  must survive catalog edits).
- Idempotency keys on checkout/cart mutations (24h server map); replayed
  keys return the stored response, never double-apply.
- No raw tokens in the DB (hashes only), no secrets in logs, no PII in
  analytics payloads beyond the documented columns.
