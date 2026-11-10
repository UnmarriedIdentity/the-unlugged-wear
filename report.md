# Database Feature Report — the-unplugged-wear

> Scope: `db/migrate/` (13 files, 88 tables) audited against
> `DOC/backend/` (01–21). Generated 2026-10-31. No schema changes made.

## 1. Cart — fully covered (`003-cart.sql`)

| Feature | Status | Where |
|---|---|---|
| Guest cart (no login) | ✅ | `carts.session_id` (signed cookie); CHECK guarantees cart ownership |
| One active cart per logged-in user | ✅ | partial unique `one_active_cart_per_user` |
| Guest→user cart merge on login | ✅ | rule: guest lines fold in, guest cart flips to `converted` (never deleted) |
| Line items with qty | ✅ | `cart_items` (qty > 0; duplicate product+variant lines merge via unique index) |
| Variant selection (size/color) | ✅ | `cart_items.variant_id` → `product_variants` + `010-attr-library.sql` |
| Price/name/image snapshot at add time | ✅ | frozen on the line; refresh only on explicit re-add |
| Shop-for-profile (family/household) | ✅ | `carts.for_profile_id` → `profiles` |
| Abandoned-cart detection + reminder | ✅ | `carts.status` + `idx_carts_abandoned`; `013` `abandoned_carts` (exactly-once `reminded_at`) |
| Cart analytics events | ✅ | `013` `cart_events` (item_added / item_removed / qty_changed / cart_viewed) |
| Wishlist | ✅ | `wishlists` + `wishlist_items` (one list per user, one entry per product) |

## 2. Orders — fully covered (`004-orders.sql`)

| Feature | Status | Where |
|---|---|---|
| Order header, order number, stored totals | ✅ | `orders` (DECIMAL(12,2), INR; totals stored, never derived) |
| Fulfillment status machine | ✅ | `pending → confirmed → processing → shipped → delivered / cancelled / failed / refunded` |
| Status timeline (audit) | ✅ | `order_status_history` (same TX as status write) |
| Immutable order lines with snapshots | ✅ | `order_items` (name, SKU, unit price, options JSONB frozen) |
| Discount coupons | ✅ | `discount_codes` (percent/fixed, min amount, usage cap, validity window) |
| Payments | ✅ | `payments` (mock/razorpay/stripe; upi/card/netbanking/wallet/COD; idempotent capture via unique `transaction_id`) |
| Refunds (partial, audit) | ✅ | `refunds` (method source/store_credit; one open refund per order guard) |
| Shipping + tracking timeline | ✅ | `shipments` + `shipment_events` (carrier, AWB, ETA; scan dedupe) |
| Checkout idempotency | ✅ | `orders.idempotency_key` + `one_order_per_idempotency_key` |
| Address snapshots | ✅ | `shipping_address` / `billing_address` JSONB |
| Stock ledger linked to orders | ✅ | `stock_movements` (reason incl. `return`, `cancel`; `order_id` FK appended in 004) |
| Partner fulfillment (Qikink) | ✅ | `009-partner.sql`: `partner_orders`, `partner_wallet_ledger` |
| Order history per user / profile | ✅ | indexes on `placed_by_user_id`, `for_profile_id` |

## 3. Returns (RMA) — present (`004-orders.sql`)

| Feature | Status | Where |
|---|---|---|
| RMA header per order | ✅ | `returns` (order_id RESTRICT, reason, carrier, tracking_number) |
| Stage machine | ✅ | `in_transit → inspected → restocked / disputed` |
| Per-line returns | ✅ | `return_items` (→ `order_items` RESTRICT, qty) |
| Disposition restock / scrap / exchange | ✅ | `return_items.disposition`; restock writes `stock_movements.reason='return'` |
| Refund linkage | ✅ | `refunds` on same order; `orders.status='refunded'` |

Caveats (see §7): no exchange-fulfillment table; no return-policy-window table.

## 4. Basic e-commerce checklist

| Feature | Status | Table(s) |
|---|---|---|
| Product catalog (SKU, price, compare-at, stock, status, tags) | ✅ | `products`, `product_variants`, `product_images` |
| Categories (nested) & attribute filtering | ✅ | `categories`, `010` attribute library |
| Full-text search + zero-result intelligence | ✅ | `search_vector` GIN indexes; `013` `search_terms` |
| Collections / lookbooks (scheduled publish) | ✅ | `collections`, `collection_products` |
| Size charts | ✅ | `size_charts` |
| Monogram / personalization upsell | ✅ | `products.monogram_*` |
| Reviews & ratings (approval, one per user/product) | ✅ | `reviews` |
| Discounts (product-level + codes) | ✅ | `product_discounts`, `discount_codes` |
| Accounts, RBAC, staff invitations, lockout, audit | ✅ | `001-auth.sql` (13 tables) |
| Household, address book, family profiles, size prefs | ✅ | `011-household.sql` |
| Email logs + notification templates + in-app notifications | ✅ | `005`, `014` |
| CSV import jobs + per-row source audit | ✅ | `005` `import_jobs`, `002` `product_source_rows` |
| Analytics (page/product views, sessions, daily stats, funnels) | ✅ | `013-analytics.sql` (partitioned event tables) |
| Support tickets + messages | ✅ | `014-operations.sql` |
| Styling / recommendations engine | ✅ | `012-styling.sql` (slots, complement matrix, affinity, overrides, co-purchase) |
| Webhook + HTTP idempotency infra | ✅ | `005` `webhook_events`, `idempotency_keys` |
| CMS, media, blog, pages, settings | ✅ | `006`, `007` (see §6) |

**Not present anywhere (new tables required; also not in backend docs):**
gift cards · loyalty/rewards · multi-warehouse inventory (single `stock` int) ·
back-in-stock request queue · product Q&A · shipping-rate-rule table
(rates can live as JSONB in `store_settings`) · cart-level auto promo rules
(BOGO, free-shipping thresholds).
Guest checkout is intentionally unsupported (checkout requires login).

## 5. Megamenu — 3-depth navigation is possible today, zero new tables

- **Depth**: `categories.parent_id` is a self-referencing FK with no depth limit;
  parent → child → grandchild is native. Enforcing the max-3 rule is an
  application convention (optionally a DB trigger).
- **Per-node switches**: `show_in_navbar`, `show_in_megamenu`,
  `megamenu_show_images`, plus `sort_order`, `image_url`, `description`,
  and `settings` JSONB for per-category layout overrides.
- **Navbar fetch is indexed**: partial index `idx_categories_navbar`.
- **Global config**: `navigation_settings.navbar` JSONB —
  `{categoryIds[], megamenuEnabled, megamenuShowImages, megamenuColumns}`
  (single-row document, read whole; `DOC/backend/09-CMS-Media.md`).
- Note: `cms_sections` has no `megamenu` block type by design — the menu lives
  in `navigation_settings` + category flags, not in page sections.

## 6. CMS section coverage (`006-cms.sql` + `007-cms-pages.sql`, 15 tables)

**Assets & blog (006):**
- `media` — R2 asset library (usage: product/section/blog/design; filename,
  size, dimensions, alt; provider-agnostic).
- `blogs` — JSON-document content (`content` jsonb + `content_text` +
  reading time + weighted `search_vector`), draft/scheduled/published/archived,
  SEO fields, version, scheduled-publish index.
- `blog_categories`, `blog_authors` (staff-linked or standalone bylines),
  `blog_tags` + `blog_post_tags`.
- `blog_revisions` — immutable snapshots; restore copies into draft.
- `blog_slug_history` — 301 redirects for retired slugs.
- `blog_post_media` — inline-media FK ledger (deletion of in-use asset is
  FK-blocked).
- `design_assets` — /designs library (print artwork, embroidery, typography,
  label specs) with approval status and 25 MB cap mirror.

**Pages & settings (007):**
- `cms_sections` — ordered page sections: hero, banner, featured_products,
  blog_teaser, brands, testimonial (content JSONB → new types need no migration).
- `cms_settings` — single-row theme document with `version` cache-buster.
- `navigation_settings` — navbar/megamenu document (see §5).
- `pages` — static pages (about, shipping, **returns policy**) as block
  documents + SEO.
- `store_settings` — operational key/value config (7 admin settings tabs);
  secrets never land here (env only).

## 7. Documented features that cannot be built without new tables

1. **Store-credit wallet** — `refunds.method='store_credit'` exists, but no
   balance/ledger table; spendable credit needs e.g. `store_credit_entries`.
2. **Exchange fulfillment** — `disposition='exchange'` is recorded, but nothing
   tracks the replacement shipment; needs an exchange table or an
   `orders.is_exchange` seam.
3. **Return-policy window** — no table; can be held in `store_settings` JSONB
   without schema change, but eligibility is not DB-enforced.
4. **Brands** — DDL present but explicitly "unbuilt in v1" (seed/UI/queries
   deferred, not a schema gap).
5. Everything else documented in `DOC/backend` has DDL (migrate README:
   88/88 specified tables written).

## Bottom line

Cart, orders, and returns/RMA are complete at the schema level. All basic
e-commerce primitives (catalog, search, reviews, discounts, payments incl.
COD, shipping/tracking, accounts, analytics, support) are present. The
megamenu at exactly 3 depths works today without new tables. The only true
table-level gaps are store-credit wallet, exchange fulfillment, and optional
return-window enforcement.
