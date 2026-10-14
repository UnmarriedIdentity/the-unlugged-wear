# Data Tables — Full Inventory (single PostgreSQL)

> Status: Filling | Last Updated: 2026-10-14
> 35 tables + 2 deferred footnotes. Column detail lives in files 03–10;
> this file is the index. Conventions (UUIDv7, money, indexes): `01-Conventions.md`.

## Monolith adaptations (apply to every table below)

1. **One database, real FKs everywhere.** The microservice docs' "logical
   refs, no cross-schema FK" rule is void — every arrow below is a true
   foreign key (`ON DELETE CASCADE` for owned children, restrictive
   otherwise). Single migration history under `server/db/migrate/`.
2. **UUIDv7 PKs, `timestamptz` created/updated pair** on every table.
3. Money `DECIMAL(12,2)` + `CHECK >= 0`; statuses `varchar` + `CHECK IN`.

## Auth & RBAC (7) → detail: `03-Auth-RBAC.md`

| Table | Purpose | Key links |
|---|---|---|
| users | Accounts (admins + customers), status lifecycle | — |
| roles | `admin` / `customer` (+ future) referenced by `slug` | — |
| permissions | Granular grants (`product.create`, `order.refund`) | — |
| role_permissions | Grant map, composite PK (role, permission) | roles, permissions |
| user_roles | Multi-role map, composite PK (user, role) | users, roles |
| addresses | Shipping/billing book, one-default partial unique | users |
| refresh_tokens | Hashed rotation tokens, revocation, expiry cleanup | users |

The single-URL gate reads `users → user_roles → roles.slug`
(see `14-Single-URL-Gating.md`).

## Catalog (13) → detail: `04-Catalog.md`

| Table | Purpose | Key links |
|---|---|---|
| categories | Tree (`parent_id` self-FK), nav flags, slug, tsvector | self |
| brands | **Defined but unbuilt in v1** — no seed, no UI (see footnote) | — |
| products | Core row: sku/slug unique, price/compare, stock balance, status, tags, `attributes` jsonb, `photo_settings` jsonb, source/external import ids, soft-delete, tsvector | categories, brands (nullable) |
| product_variants | SKU-unique rows, price/stock override, active flag | products (cascade) |
| product_images | Gallery order, one-primary partial unique, optional variant scope | products, variants |
| product_options | Per-product definitions incl. `display_type` + `visible_on` (pill/swatch/radio; pdp/checkout/admin) | products |
| product_option_values | Values stored once, unique per option | options |
| product_variant_option_values | Junction, composite PK (variant, option) | variants, options, values |
| product_attributes | Compare/spec definitions (name/slug/type/unit) | — |
| product_attribute_values | One value per (product, attribute), unique pair | products, attributes |
| stock_movements | Ledger: signed delta, reason, balance snapshot | products, variants |
| product_discounts | Scheduled percent/fixed, active-range index | products |
| reviews | Optional; approval queue | products, users |

Footnote — brands: table ships in the DDL from day one with
`products.brand_id` nullable, but v1 builds no seed, no UI, no queries.
Launch = seed + UI only, zero migration.

## Cart & wishlist (4) → detail: `05-Cart-Wishlist.md`

| Table | Purpose | Key links |
|---|---|---|
| carts | Guest (`session_id`) or user cart; one-active-per-user partial unique; ownership CHECK | users (nullable) |
| cart_items | Lines with price/display snapshots; unique (cart, product, variant) NULLS NOT DISTINCT | carts (cascade) |
| wishlists | One per user (unique) | users |
| wishlist_items | Unique (wishlist, product) | wishlists |

## Orders & money (6) → detail: `06-Orders-Payments.md`

| Table | Purpose | Key links |
|---|---|---|
| orders | Number-unique, dual status axes, stored totals, address snapshots | users, discount_codes |
| order_items | Immutable snapshots (name/sku/price/line, options jsonb) | orders (cascade) |
| order_status_history | Status timeline + actor | orders |
| payments | Provider lifecycle, unique transaction ref | orders |
| discount_codes | Code-unique coupons, caps, expiry | — |
| shipments | Optional carrier/tracking/status | orders |

## Platform (3) → detail: `07-Import-Jobs.md`, `08-Notify.md`

| Table | Purpose | Key links |
|---|---|---|
| import_jobs | CSV pipeline: source/status/counters/row-errors | users (created_by) |
| email_logs | Delivery states, retry scans | — |
| notification_templates | Optional keyed `{{variable}}` bodies | — |

## CMS in PG, jsonb (7, no Mongo) → detail: `09-CMS-Media.md`

cms_sections · cms_settings · navigation_settings · pages · blogs ·
blog_categories · media (R2 URLs — provider-agnostic, see `11-Storage.md`).
Whole-document reads; app-layer Zod validation.

## Analytics, partitioned (5) → detail: `10-Analytics.md`

page_views · sessions · cart_events · abandoned_carts · daily_stats.
Monthly partitions; raw events drop >30d, rollups kept forever.
Recommended addition: `search_terms` (zero-result search → import guidance).

## Deferred, not dropped

- `search_documents` — `tsvector` + GIN on products/categories covers v1;
  revisit only if ranked cross-entity search outgrows it.
- `brands` UI/seed — schema ready (above), build deferred.
