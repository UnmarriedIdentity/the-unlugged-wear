# Schema Decisions — Retired Systems & Controlled Duplication

> Status: Active | Last Updated: 2026-10-21
> Companion to `02-Data-Tables.md`. These decisions bind the SQL in
> `tuw-admin/src/server/db/migrate/` and the docs in this folder.

## 1. Edit-in-place policy

No PostgreSQL instance exists yet. Until the first provisioned database,
the `CREATE TABLE` files are the source of truth and are edited directly.
No `ALTER TABLE` migrations are written for these decisions. Once a
database exists, every change below becomes a normal forward migration.

## 2. Retired systems

| System | Removed from | Superseded by | Why |
|---|---|---|---|
| `product_options` trio | `002-catalog.sql` (earlier wave) | `attribute_definitions` / `attribute_values` / link tables | Per-product copies duplicated the library; nothing was built on them. |
| `product_attributes` + `product_attribute_values` (compare engine) | `002-catalog.sql` (2026-10-21) | Attribute library + typed product/Clothing Specs columns | No UI, import, or API consumer; two definitions of "attribute". |
| `products.attributes` JSONB | `002-catalog.sql` (2026-10-21) | `product_attribute_links` + values; `photo_settings`; Clothing Specs columns | No writer/reader; the admin `ProductItem.attributes` field maps to library links, not this column. |

The attribute library is the single attribute system. If a PDP compare
feature is ever scoped, build it on `attribute_definitions` (add typed spec
columns only then); never reintroduce a second definition table.

## 3. Controlled duplication (keep, do not "normalize" away)

| Pair | Why both exist |
|---|---|
| `products.stock` / `stock_movements` | Balance for fast reads; ledger for audit. |
| `products.price` / `product_variants.price` | Materialized "From" price; exact variant price. |
| `products.internal_serial_no` / `product_source_rows.source_serial_no` | Display reference; import lineage (a product may span rows). |
| `partner_orders.awb` / `shipments.tracking_number` | Raw Qikink sync seam; customer-facing shipment projection. |
| `products.tags[]` / `collections` | Facets/search; curated merchandising pages. |
| `size_charts.rows` / `product_variants` | Display measurements; sellable combinations. |
| `photo_settings` JSONB | Whole-document gallery presentation, not relational state. |
| `order_items` snapshots | Immutable purchase record, not live catalog data. |

## 4. Vocabulary and known gaps

- DB `products.status` uses `draft | active | archived`; the admin UI uses
  `draft | published | archived`. The API seam maps `published` → `active`;
  do not add a second status column.
- `collections.visibility` allows `scheduled` but no date column exists yet.
  The UI has no date input. Add `published_at` when the scheduled-release UI
  is built; until then `scheduled` is a label, not a scheduler.
- Analytics `sessions` (specified, not yet in SQL) is a visit session; auth
  uses `refresh_tokens`. Rename to `analytics_sessions` when
  `013-analytics.sql` is written to avoid the collision.
- `01-Conventions.md`'s "created/updated pair on every table" applies to
  mutable entity tables. Immutable/join rows (`product_images`,
  `product_source_rows`, `stock_movements`, junction tables) carry only the
  timestamps they need.

## 5. Implementation status

| Status | Tables | Where |
|---|---:|---|
| Implemented DDL | 41 | `001`, `002`, `009`, `010`, `011`, `012` |
| Specified, migration pending | 34 | Cart 4, Orders 9, Platform 3, CMS 8, Analytics 7, Operations 3 |
| Planned total | 75 | |

`009-partner.sql` forward-references `orders` from the pending Orders
domain. It is correct DDL but cannot be applied until `004-orders.sql`
exists. See `tuw-admin/src/server/db/migrate/README.md`.
