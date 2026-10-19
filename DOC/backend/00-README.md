# The Unplugged Wear — Backend Project Overview

> Status: Draft | Last Updated: 2026-10-17
> Single-URL monolith: one Next.js app, one PostgreSQL, R2 for bytes.

## 1. What this is

The Unplugged Wear is a single-URL deployment serving **both the storefront
and the admin panel from one Next.js application**. Access is role-based:

- Users with the `admin` role reach the admin workspace **and** the storefront.
- Users with the `customer` role (default) reach **only** the storefront
  and its features (browse, cart, checkout, account, wishlist).

There are no separate admin/storefront deployments, no service mesh, no
cross-service calls on the hot path. One app, one database, one object store.

## 2. Architecture in one paragraph

Next.js Route Handlers expose the API; `middleware.ts` enforces the role
gate on route groups (`(admin)` vs `(storefront)`); decorator-style handler
wrappers (`withRole('admin')`, validated-input wrappers) carry auth and
validation so handlers stay thin. PostgreSQL is the single source of truth
with **real foreign keys everywhere** — cross-domain references are true
constraints, not application-code promises — and one migration history. Primary keys are **UUIDv7** (time-ordered, unguessable,
merge-safe). Depth: `12-UI-Merge-Single-Deploy.md`, `13-API-Contracts.md`,
`14-Single-URL-Gating.md`.

## 3. Data at a glance (75 tables, one Postgres)

| Domain | Tables | Notes |
|---|---|---|
| Auth & RBAC | users, profiles, roles, permissions, role_permissions, user_roles, refresh_tokens, customer_notes, staff_invitations, audit_logs | Two-row identity (credential + person); normalized roles; the gate reads `users → user_roles → roles.slug` |
| Household & family | households, household_members, profile_size_preferences, household_invitations, addresses | Family profiles (dependents need no email); proxy ordering + per-order size edits (file 17) |
| Catalog | categories, brands*, products, product_variants, product_images, product_attributes, product_attribute_values, stock_movements, product_discounts, reviews, collections, collection_products, size_charts, attribute_definitions, attribute_values, product_attribute_links, product_attribute_link_values | *brands defined but unbuilt |
| Cart & wishlist | carts, cart_items, wishlists, wishlist_items | Snapshot display fields; one-active-cart partial unique |
| Orders & money | orders, order_items, order_status_history, payments, refunds, returns, return_items, discount_codes, shipments | Dual status axes; immutable snapshots; DECIMAL(12,2) |
| Platform | import_jobs, email_logs, notification_templates | CSV pipeline reports; delivery states |
| CMS (jsonb, no Mongo) | cms_sections, cms_settings, navigation_settings, pages, blogs, blog_categories, media, store_settings | Whole-document reads; app-layer Zod validation |
| Analytics (partitioned) | page_views, sessions, cart_events, abandoned_carts, daily_stats, product_views, search_terms | Monthly partitions; raw events drop >30d, rollups kept |
| Operations | support_tickets, support_messages, notifications | Threads + staff replies; in-app bell (email stays in logs) |
| Partner seam | partner_orders, partner_wallet_ledger | Qikink sync + wallet trail (file 16) |
| Styling — Complete the Look | styling_slots, styling_category_slots, styling_slot_rules, styling_value_affinity, styling_overrides, styling_co_purchase, styling_events | Module-owned (file 19); **ships last — after the core store** |

Search has **no table** in v1 — `tsvector` + GIN on products/categories
covers it. Full inventory: `02-Data-Tables.md`.

## 4. Conventions (one line each, detail in `01-Conventions.md`)

UUIDv7 PKs · `timestamptz` created/updated pair · money `DECIMAL(12,2)` +
`CHECK >= 0` · statuses as `varchar` + `CHECK IN (...)` · soft deletes on
catalog entities only · explicit index on every FK · snake_case, plural names.

## 5. Import story

The `Final Listing` workbook (Style, sizes, Colors, Weight, Base Price,
Placements, Dimensions, Tax Rate) is re-saved as CSV and imported into
**draft** products: scalars map to product columns, multi-valued columns
become `attributes[]` entries with PDP/checkout/admin visibility, swatch
colors persist per value. The `.xls` binary itself is never parsed
(no dependency for it — honest limitation). Detail: `07-Import-Jobs.md`.

## 6. Free-tier operating box

One free Postgres + R2's free tier (10 GB, zero egress) carry v1. The only
quota risk is unbounded analytics writes: raw events drop after 30 days,
`daily_stats` rollups live forever, alert at 70% of DB quota. CMS is
kilobytes — never the risk. Detail: `10-Analytics.md`, `11-Storage.md`.

## 7. Open decisions (dated, resolved here — never in chat)

| Date | Decision | Status |
|---|---|---|
| 2026-10-19 | Currency: single-currency store — INR (₹) only across admin + storefront; USD/GBP/EUR controls removed; shipping demo defaults ₹3,000 / ₹150; existing demo amounts not re-based | RESOLVED (UI wave; DB money columns store integer paise at the boundary) |
| 2026-10-14 | Analytics event collection start (which release lights up tracking) | OPEN |
| 2026-10-14 | Brands launch scope (table ready, UI unbuilt) | OPEN, non-blocking |
| 2026-10-17 | Household accounts: one household per profile, manager/member roles, any member orders for any — resolved into `17-Household-Accounts.md` | RESOLVED (file 17) |
| 2026-10-17 | Complete the Look: hybrid slot-based styling module (rules + overrides at launch, data refinement after) — the project's final feature | RESOLVED (file 19) |
| 2026-10-18 | Variant pricing ladder: base anchor + additive per-value adjustments; explicit cell overrides pinned; listed price = materialized min ("From") | RESOLVED (04-Catalog.md; admin build VPRICE-1/2) |

## 8. Doc map & status

| File | Covers | Status |
|---|---|---|
| 00-README.md | This overview | Filling |
| 01-Conventions.md | PKs, money, enums, indexes | Draft |
| 02-Data-Tables.md | Full table inventory | Draft |
| 03-Auth-RBAC.md | Gate columns | Draft |
| 04-Catalog.md | Product/variant/option columns | Draft |
| 05-Cart-Wishlist.md | Cart + wishlist columns | Draft |
| 06-Orders-Payments.md | Orders, refunds, payouts | Draft |
| 07-Import-Jobs.md | CSV pipeline + row errors | Draft |
| 08-Notify.md | Email logs, templates | Draft |
| 09-CMS-Media.md | Content tables + R2 wiring | Draft |
| 10-Analytics.md | Event tables, partitions, retention | Draft |
| 11-Storage.md | R2 decision record | Draft |
| 12-UI-Merge-Single-Deploy.md | Storefront-into-admin merge plan | Draft |
| 13-API-Contracts.md | Monolith route contracts | Draft |
| 14-Single-URL-Gating.md | Middleware + wrapper guards | Draft |
| 15-Operations.md | Support threads, notifications | Filling |
| 16-Partner-Qikink.md | POD partner seam + wallet | Draft |
| 17-Household-Accounts.md | Family groups, profiles, proxy ordering | Filling |
| 19-Styling-Recommendations.md | Complete the Look: slots, rules, refinement roadmap | Draft |
