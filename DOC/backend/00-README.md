# The Unplugged Wear — Backend Project Overview

> Status: Draft | Last Updated: 2026-11-10
> Two deployments (storefront + admin), one shared Neon PostgreSQL, R2 for bytes.

## 1. What this is

The Unplugged Wear runs as **two separately deployed Next.js apps** that
share **one PostgreSQL database** (Neon):

- `tuw-website` — the customer storefront and its **storefront API**
  (browse, cart, guest or account checkout, account, wishlist, track order).
- `tuw-admin` — the operations workspace and its **admin API** (catalog,
  orders, fulfilment, customers, content, settings). Staff roles only.

Each app has its own domain, build, env vars and sessions. Neither imports
the other's code or calls the other on the request path; they cooperate
through the shared database. Detail: `12-Two-App-Deploy.md`.

## 2. Architecture in one paragraph

Each app's Next.js Route Handlers expose its API; each app's
`middleware.ts` enforces its own gate (`14-Access-Gating.md`);
decorator-style wrappers (`withRole('admin')`, validated-input wrappers)
carry auth and validation so handlers stay thin. PostgreSQL is the single
source of truth with **real foreign keys everywhere** and one migration
history in the repo-root `db/` folder, which belongs to neither app. Shared
rules live in SQL constraints so both codebases inherit them. Auth is
custom and in-app with **bcrypt** password hashes — no third-party auth
provider. Primary keys are **UUIDv7**. Depth: `12-Two-App-Deploy.md`,
`13-API-Contracts.md`, `14-Access-Gating.md`.

## 3. Data at a glance (99 tables, all implemented in DDL)

| Domain | Tables | Notes |
|---|---|---|
| Auth & RBAC | users, profiles, roles, permissions, role_permissions, user_roles, refresh_tokens, password_reset_tokens, email_verification_tokens, login_attempts, customer_notes, staff_invitations, audit_logs | Two-row identity (credential + person); normalized roles; the gate reads `users → user_roles → roles.slug`; custom in-app auth, bcrypt password hashes |
| Household & family | households, household_members, profile_size_preferences, household_invitations, addresses | Family profiles (dependents need no email); proxy ordering is enforced by a composite FK on orders; sizes are shared, addresses are private per person (file 17) |
| Catalog | categories, brands*, products, product_source_rows, product_variants, product_images, stock_movements, product_discounts, reviews, collections, collection_products, size_charts, attribute_definitions, attribute_values, product_attribute_links, product_attribute_link_values, product_variant_attribute_values | *brands: table created, seed/UI built in the backend phase; the attribute library is the single attribute system; `products.low_stock_threshold` drives staff stock alerts |
| Cart & wishlist | carts, cart_items, wishlists, wishlist_items | Snapshot display fields; one-active-cart partial unique |
| Orders & money | orders, order_items, order_status_history, payments, refunds, returns, return_items, return_status_history, discount_codes, shipments, shipment_events | Dual status axes; immutable snapshots; DECIMAL(12,2); **guest checkout** (`guest_email`/`guest_name`); returns are a request pipeline with a separate resolution axis; exchanges (customer pays/gets back the price difference) and defect replacements create a linked follow-up order; no money-back returns; no store credit; COD refunds by UPI/bank transfer; the tracking timeline is a child table |
| Platform | import_jobs, email_logs, notification_templates, idempotency_keys, webhook_events | CSV pipeline reports; delivery states; HTTP-retry and provider-replay dedupe (file 21) |
| CMS (jsonb, no Mongo) | media, blog_categories, blog_authors, blog_tags, blogs, blog_post_tags, blog_revisions, blog_slug_history, blog_post_media, design_assets, cms_sections, cms_settings, navigation_settings, pages, store_settings | No `content_html`, no `blog_statuses`, no `views` column; `design_assets` is the print-artwork library |
| Analytics (partitioned) | page_views, analytics_sessions, cart_events, abandoned_carts, daily_stats, product_views, search_terms | Monthly partitions; raw events drop >30d, rollups kept; never plain `sessions` |
| Operations | support_tickets, support_messages, notifications | Threads + staff replies (contact form = `source 'contact_form'`); in-app bell (email stays in logs) |
| Commerce extras | newsletter_subscribers, faqs, gift_cards, gift_card_transactions, stock_alert_subscriptions | Newsletter opt-in, FAQ content, gift-card balance + ledger, back-in-stock requests (file 22) |
| Integrations & fulfilment | integration_providers, provider_product_mappings, provider_cod_remittances, fulfillment_orders, fulfillment_order_items, provider_wallet_ledger, fulfillment_claims | Provider registry (payments, fulfilment, couriers) + Qikink-ready, provider-agnostic order sync, wallet, COD remittances and defect claims (file 16) |
| Styling — Complete the Look | styling_slots, styling_category_slots, styling_slot_rules, styling_value_affinity, styling_overrides, styling_co_purchase, styling_events | Module-owned (file 19); **ships last — after the core store** |

Search has **no table** in v1 — `tsvector` + GIN on products/categories
covers it (one ranked query, two entity types). Full inventory:
`02-Data-Tables.md`.

## 4. Conventions (one line each, detail in `01-Conventions.md`)

UUIDv7 PKs · `timestamptz` created/updated pair on mutable entity tables · money `DECIMAL(12,2)` +
`CHECK >= 0` · statuses as `varchar` + `CHECK IN (...)` · soft deletes on
catalog entities only · explicit index on every FK · snake_case, plural names.

## 5. Import story

The `Final Listing` workbook (ID, S.No, Gender, Style, sizes, Colors, Weight,
Shipping Weight, Base Price, Placements, Dimensions, Tax Rate, HSN) is
re-saved as CSV and imported into **draft** products. Rows group by style code
(or style name + gender when no code exists) into one product with variants;
the internal S.No is preserved per source row. Scalars map to product or
variant overrides, multi-valued columns become linked attribute values, and
Color plus the group's semantic option axis (Size, Model, Dimensions,
Capacity, Shape, or Style) are marked as variant axes. HSN is product-level;
conflicting HSN rows split the group. A new option type is a data row in the
attribute library, not a schema change. The `.xls` binary itself is never
parsed (no dependency for it — honest limitation). Detail:
`07-Import-Jobs.md`.

## 6. Free-tier operating box

One Neon Postgres (free tier to start; branches for preview/dev databases) + R2's free tier (10 GB, zero egress) carry v1. The only
quota risk is unbounded analytics writes: raw events drop after 30 days,
`daily_stats` rollups live forever, alert at 70% of DB quota. CMS is
kilobytes — never the risk. Detail: `10-Analytics.md`, `11-Storage.md`.

## 7. Open decisions (dated, resolved here — never in chat)

| Date | Decision | Status |
|---|---|---|
| 2026-10-19 | Currency: single-currency store — INR (₹) only across admin + storefront; USD/GBP/EUR controls removed; shipping demo defaults ₹3,000 / ₹150; existing demo amounts not re-based | RESOLVED (DB money columns are DECIMAL(12,2) rupees; app code may compute in paise and converts at the API boundary — 2026-11-10) |
| 2026-10-14 | Analytics event collection start (which release lights up tracking) | OPEN |
| 2026-10-14 | Brands launch scope | RESOLVED 2026-11-10: table created and part of v1; seed/UI built in the backend phase |
| 2026-10-17 | Household accounts: one household per profile, manager/member roles, any member orders for any — resolved into `17-Household-Accounts.md` | RESOLVED (file 17) |
| 2026-10-17 | Complete the Look: hybrid slot-based styling module (rules + overrides at launch, data refinement after) — the project's final feature | RESOLVED (file 19) |
| 2026-11-10 | Deployment: two separate apps (storefront + admin), one shared database; schema moved to repo-root `db/` | RESOLVED (files 12, 14) |
| 2026-11-10 | Database host: Neon Postgres; no RLS (server-only access) | RESOLVED (file 12) |
| 2026-11-10 | Auth: custom in-app, bcrypt (cost 12) instead of Argon2id | RESOLVED (file 03 §7) |
| 2026-11-10 | Guest checkout allowed (`orders.guest_*`); order statuses use the SQL vocabulary | RESOLVED (files 05, 06) |
| 2026-11-10 | No store credit; exchanges = same-product variant swap, delivered orders only, 7-day window; cancel only while `pending` | RESOLVED (file 06) |
| 2026-11-10 | New tables: newsletter, FAQs, gift cards, back-in-stock alerts; free-shipping threshold stays in `store_settings` | RESOLVED (file 22, `008-commerce-extras.sql`) |
| 2026-11-10 | Exchange price difference charged or refunded; exchanges/replacements need an account (guests claim orders after sign-up); COD refunds via UPI/bank transfer | RESOLVED (file 06) |
| 2026-11-10 | No money-back returns (Qikink offers none); fulfilment is provider-agnostic: Qikink = one `integration_providers` row + adapter | RESOLVED (file 16, `009-fulfillment.sql`) |
| 2026-11-10 | Gift cards sold on the storefront (`products.product_kind = 'gift_card'`), separate from discount codes | RESOLVED (file 22) |
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
| 12-Two-App-Deploy.md | Two deployments, one database, release order | Active |
| 13-API-Contracts.md | Storefront API + admin API route contracts | Draft |
| 14-Access-Gating.md | Per-app middleware + wrapper guards | Active |
| 15-Operations.md | Support threads, notifications | Filling |
| 16-Fulfillment-Providers.md | Provider registry, Qikink adapter, fulfilment sync, wallet, claims | Draft |
| 17-Household-Accounts.md | Family groups, profiles, proxy ordering | Filling |
| 19-Styling-Recommendations.md | Complete the Look: slots, rules, refinement roadmap | Draft |
| 20-Schema-Decisions.md | Retired systems, controlled duplication, vocabulary | Active |
| 21-Idempotency.md | Duplicate-proofing: idempotency keys, webhooks, natural keys | Active |
| 22-Commerce-Extras.md | Newsletter, FAQs, gift cards, stock alerts, settings-held rules | Draft |

### Root overview documents

- **`3.Database-Schema.md`** and **`4.API-Design.md`** (repo root) were
  rewritten on 2026-11-10: the old microservices / MongoDB / Redis design
  is retired. They are now short overviews of the schema-by-module map and
  the modular two-backend design; this folder holds the detail.
- The SQL files in `db/migrate/` are the schema source
  of truth. A doc that disagrees with them is the bug.
