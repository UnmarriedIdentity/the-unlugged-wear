# Migrations — Apply Order & Status

> No PostgreSQL instance exists yet. These files are edited in place until
> the first provisioned database; afterward use forward migrations.
> **88 tables across 13 files, all specified tables now written as DDL.**

## Apply order

| File | Tables | Status | Depends on |
|---|---:|---|---|
| `001-auth.sql` | 13 | written | — |
| `002-catalog.sql` | 12 | written | `001` (users for reviews) |
| `003-cart.sql` | 4 | written | `001` (users, profiles), `002` (products, variants) |
| `004-orders.sql` | 10 | written | `001`, `002`, `003` |
| `005-platform.sql` | 5 | written | `001` (users) |
| `006-cms.sql` | 10 | written | `001` (users) |
| `007-cms-pages.sql` | 5 | written | `001` (users) |
| `009-partner.sql` | 2 | written | `001`, `004` (orders) |
| `010-attr-library.sql` | 5 | written | `002` (products) |
| `011-household.sql` | 5 | written | `001` (profiles), `002` (categories), `010` (attribute_values) |
| `012-styling.sql` | 7 | written, ships last | `002` + `010` |
| `013-analytics.sql` | 7 | written | `001`, `002`, `003` (carts) |
| `014-operations.sql` | 3 | written | `001` (users) |
| **Total** | **88** | | |

Every `REFERENCES` target is created by an earlier file in this list, so a
single ordered pass applies cleanly. There are no forward references and no
external dependencies left.

## One deferred FK, resolved locally

`002-catalog.sql` cannot declare `stock_movements.order_id` — `orders` does
not exist yet at that point. `004-orders.sql` ends with the `ALTER TABLE`
that adds the column and its index. This is a from-scratch build (no
database exists), not a migration of a live schema, so the column is
declared in the file that can satisfy it rather than left dangling.

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

`src/server/db/seed/001-seed-core.sql` is a separate, re-runnable file
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
- `011` — `addresses.recipient_name`, `addresses.phone`.
- `013` — the analytics session table is `analytics_sessions` (never plain
  `sessions`), and the four raw event tables are RANGE-partitioned on `ts`
  with a `_default` partition each.

## After the first database exists

Stop editing these files. Add `015-...` forward migrations only, one
concern per file, and update `tests/schema-integrity.test.mjs` in the same
commit so the inventory guard stays honest.
