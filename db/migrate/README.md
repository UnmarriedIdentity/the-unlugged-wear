# Migrations — Apply Order & Status

> No PostgreSQL instance exists yet. These files are edited in place until
> the first provisioned database; afterward use forward migrations.
> **99 tables across 14 files, all specified tables now written as DDL.**
> Location: repo-root `db/` — shared by both deployments (`tuw-admin`,
> `tuw-website`), which connect to the same Neon Postgres database.

## Apply order

| File | Tables | Status | Depends on |
|---|---:|---|---|
| `001-auth.sql` | 13 | written | — |
| `002-catalog.sql` | 12 | written | `001` (users for reviews) |
| `003-cart.sql` | 4 | written | `001` (users, profiles), `002` (products, variants) |
| `004-orders.sql` | 11 | written | `001`, `002`, `003` |
| `005-platform.sql` | 5 | written | `001` (users) |
| `006-cms.sql` | 10 | written | `001` (users) |
| `007-cms-pages.sql` | 5 | written | `001` (users) |
| `008-commerce-extras.sql` | 5 | written | `001`, `002`, `004` (orders, order_items) |
| `009-fulfillment.sql` | 7 | written | `002`, `004`, `005` (adds provider FKs to products, payments, webhook_events and shipments.fulfillment_order_id) |
| `010-attr-library.sql` | 5 | written | `002` (products) |
| `011-household.sql` | 5 | written | `001` (profiles), `002` (categories), `010` (attribute_values), `004` (orders, ALTER at end) |
| `012-styling.sql` | 7 | written, ships last | `002` + `010` |
| `013-analytics.sql` | 7 | written | `001`, `002`, `003` (carts) |
| `014-operations.sql` | 3 | written | `001` (users), `004` (orders) |
| **Total** | **99** | | |

Every `REFERENCES` target is created by an earlier file in this list, so a
single ordered pass applies cleanly. There are no forward references and no
external dependencies left.

## Every column lives in its own CREATE TABLE

No database exists yet, so there is no `ALTER TABLE … ADD COLUMN` anywhere:
each column is written directly in its table's `CREATE TABLE`. The only
`ALTER TABLE` statements left attach **foreign keys that point to a table
created in a later file** — Postgres cannot reference a table that does not
exist yet. Each is constraint-only and sits in the file that creates the
target table:

| Column (declared in) | FK attached in | Target |
|---|---|---|
| `stock_movements.order_id` (002) | 004 | `orders` |
| `orders.for_household_id` + `for_profile_id` (004) | 011 | `household_members (household_id, profile_id)` |
| `shipments.fulfillment_order_id` (004) | 009 | `fulfillment_orders` |
| `products.partner_provider` (002), `payments.provider` (004), `webhook_events.provider` (005) | 009 | `integration_providers (slug)` |

Verified 2026-11-10: all 14 files + the seed (twice) apply cleanly, in
order, on PostgreSQL 17 (PGlite) — 99 tables, 17 partitions.

## Idempotency is a schema concern

Duplicate-proofing is enforced by constraints, not by handler code:

- `005-platform.sql` — `idempotency_keys` (`UNIQUE (scope, key)`) for HTTP
  retries and `webhook_events` (`UNIQUE (provider, provider_event_id)`) for
  provider replays.
- `004-orders.sql` — `orders.idempotency_key` + the partial unique
  `one_order_per_idempotency_key`, so a retried checkout returns the stored
  order even after `idempotency_keys` rows expire.
- Natural keys on the business tables: `reviews`, `email_logs`,
  `notifications`, `shipment_events`, `support_messages`, `carts` +
  `cart_items`, and every event table (PK = client-generated UUIDv7 + `ts`).

See `DOC/backend/21-Idempotency.md`.

## Seed

`db/seed/001-seed-core.sql` is a separate, re-runnable file
(roles, permissions, role grants, attribute library, styling slots + the
30-row complement matrix, single-row settings, `store_settings` keys,
coupon codes). It contains no credentials and no fabricated business data,
and it is **not** part of the apply order above — run it after the last
migration, and again on every deploy.

## Notes on the recent column additions

- `001` — `password_hash` is nullable and `status` gains `pending` (admin
  created a customer who never set a password); `password_reset_tokens` and
  `email_verification_tokens`; `login_attempts` + `users.locked_until` for
  the lockout policy.
- `002` — `collections.cover_image_url`, `tagline`, `published_at`;
  `products.partner_provider`, `partner_availability`; one review per
  customer per product.
- `006` — `media.filename`, `media.size_bytes`, `usage` gains `design`;
  new `design_assets` library.
- `010` — `attribute_definitions.is_active` next to the `show_on_*` flags.
- `004` — `returns` is a request pipeline now (`rma_number`, requester,
  `type`, `status` + `resolution`, decision fields, `refund_id` 1:1);
  `return_items` carries a per-line `reason_code`, `exchange_variant_id` and
  `refund_amount`; `order_items.returned_qty` + `CHECK (returned_qty <= qty)`
  stops an over-return; `return_status_history` is new.
- `011` — `household_members.left_at` (soft leave) + one-active-per-profile
  unique instead of `UNIQUE (profile_id)`; `profile_size_preferences` gains
  `size_definition_id` and a composite FK to `attribute_values
  (definition_id, id)`; `addresses` is profile-private (`household_id`
  removed, `profile_id NOT NULL`, one default per person); `orders` gains
  `for_household_id` + the composite membership FK at the end of the file.
  `addresses.recipient_name` and `addresses.phone` are unchanged.
- `013` — the analytics session table is `analytics_sessions` (never plain
  `sessions`), and the four raw event tables are RANGE-partitioned on `ts`
  with a `_default` partition each.

## After the first database exists

Stop editing these files. Add `015-...` forward migrations only, one
concern per file, and update `tests/schema-integrity.test.mjs` in the same
commit so the inventory guard stays honest.
