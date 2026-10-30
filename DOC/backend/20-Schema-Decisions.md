# Schema Decisions — Retired Systems & Controlled Duplication

> Status: Active | Last Updated: 2026-10-30
> Companion to `02-Data-Tables.md`. These decisions bind the SQL in
> `tuw-admin/src/server/db/migrate/` and the docs in this folder.

## 1. Edit-in-place policy

No PostgreSQL instance exists yet. Until the first provisioned database,
the `CREATE TABLE` files are the source of truth and are edited directly.
No `ALTER TABLE` migrations are written for these decisions. Once a
database exists, every change below becomes a normal forward migration.

**One deliberate exception:** `004-orders.sql` ends with
`ALTER TABLE stock_movements ADD COLUMN order_id …`, because
`002-catalog.sql` (which owns the ledger) is applied before `004` (which
owns `orders`). This is a from-scratch column arriving in the correct file
order, not a forward migration of a live schema — the `CREATE TABLE` for
`stock_movements` is unchanged in `002`.

## 2. Retired systems

| System | Removed from | Superseded by | Why |
|---|---|---|---|
| `product_options` trio | `002-catalog.sql` (earlier wave) | `attribute_definitions` / `attribute_values` / link tables | Per-product copies duplicated the library; nothing was built on them. |
| `product_attributes` + `product_attribute_values` (compare engine) | `002-catalog.sql` (2026-10-21) | Attribute library + typed product/Clothing Specs columns | No UI, import, or API consumer; two definitions of "attribute". |
| `products.attributes` JSONB | `002-catalog.sql` (2026-10-21) | `product_attribute_links` + values; `photo_settings`; Clothing Specs columns | No writer/reader; the admin `ProductItem.attributes` field maps to library links, not this column. |

The attribute library is the single attribute system. If a PDP compare
feature is ever scoped, build it on `attribute_definitions` (add typed spec
columns only then); never reintroduce a second definition table.

### Semantic variant labels (2026-10-22)

`attribute_definitions` is the semantic type registry. The canonical types
are `Size`, `Model`, `Dimensions`, `Capacity`, `Shape`, and `Style`; the
workbook's single `sizes` column is classified per product group at import,
not treated as apparel size everywhere. The definition name is the type
(`Model`); `product_attribute_links.axis_label` is the per-product display
label (`Phone model`); values such as `13 Pro Max` live once in
`attribute_values` under that definition. `attribute_definitions.slug` is
the stable filter/URL key, and `product_attribute_links.display_position`
orders non-axis specs on the PDP.

Adding a future type is one definition row plus value rows — never a table
per type, a per-size column, or a JSON array of values. Search/facets join
through the definition, so a spelling under two types is two values and
cannot cross-match. Measured impact of splitting the workbook's mixed
dictionary: +5 definition rows and +2 value rows; product-link and variant
row counts are unchanged.

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
| `orders.idempotency_key` / `idempotency_keys` | The generic table expires in 24h; the order's own key never does, so a retry a week later still cannot fork the order. |
| `media.filename` / `size_bytes` / R2 object | The library list must render without a HEAD request per row; R2 stays the byte authority. |
| `store_settings` / env | Operational config in rows, secrets in env — the boundary is a rule, not a comment (`09-CMS-Media.md`). |

## 4. Blog schema (2026-10-26)

The blog slice is the final model, not a temporary v1:

- **Status stays `varchar + CHECK`** (`draft | scheduled | published |
  archived`). There is deliberately **no `blog_statuses` lookup table**:
  status is a finite scalar state, not an entity. A lookup would force a
  join on every read and require seed rows without adding integrity over
  the CHECK. Labels, colors and legal transitions belong to the service
  layer.
- **`blogs.content` is the single editable source.** It is a
  ProseMirror/Tiptap-compatible JSON document. **No `content_html` column
  exists**: sanitized HTML for RSS/email is generated on demand, never
  stored as a second editable source.
- **Derived caches are owned by the save transaction.** `content_text`
  and `reading_time_minutes` are extracted from the validated document;
  `search_vector` is a generated column. They are never independently
  editable.
- **One primary category + many tags.** `blogs.category_id` is a single
  FK; tags are the `blog_post_tags` junction. No `blog_post_categories`
  table is created.
- **One primary author + future co-author path.** `blogs.author_id`
  points at `blog_authors`; co-authoring later adds a junction, it does
  not retrofit this column.
- **Cover/OG are direct FKs on `blogs`.** `blog_post_media` is the FK
  ledger for **inline media inside JSON only**, not a second document and
  not a cover store.
- **`blog_slug_history` is required**, not optional. Published slug
  changes insert the retired slug and resolve to a `301` redirect.
- **Revisions are immutable snapshots** in `blog_revisions.snapshot`;
  restore copies a snapshot into a draft rather than mutating a published
  row.
- **No `views` column on `blogs`.** Views come from the analytics
  `page_views` domain; a blog counter would be unauditable fabricated
  data.

## 5. Vocabulary decisions (resolved, no longer gaps)

- DB `products.status` uses `draft | active | archived`; the admin UI uses
  `draft | published | archived`. The API seam maps `published` → `active`;
  do not add a second status column.
- **Fulfillment status is the spec's eight values**, exactly:
  `pending, confirmed, processing, shipped, delivered, cancelled, failed,
  refunded`. The admin screens' extra words are UI labels, not new states.
  `shipments.status` is a separate, wider carrier projection (§8).
- **`sessions` is `analytics_sessions`.** The spec's visit-session table is
  implemented as `analytics_sessions` (`013-analytics.sql`) — `sessions`
  collides with every session middleware and with auth's `refresh_tokens`.
- **`payments.method` is not `payments.provider`.** `provider` = who
  processed it (`mock | razorpay | stripe`); `method` = how the customer
  paid (`upi | card | netbanking | wallet | cod`). `cod` is a real method,
  not a missing provider.
- **Staff roles are four seeded slugs:** `admin`, `support`, `warehouse`,
  `customer`. The admin sidebar's personas (Owner/Operations/Content/
  Read-only) map onto them in `03-Auth-RBAC.md` §4 — they are labels, never
  role rows, and the invented `manager` slug is retired.
- **Guest cart, never guest order.** `carts.session_id` stays (anonymous
  add-to-cart is real), but `orders.placed_by_user_id` is `NOT NULL`: the
  login gate sits at checkout. See `05-Cart-Wishlist.md`.
- **`media.usage` is the only category vocabulary.** The admin library's
  chips map onto it (`photoshoot` → `section`, `brand` → `section`,
  `banner` → `section`, `design` → `design`); there is no parallel
  `media.category` column to drift.
- **`collections.published_at` exists** and is required when
  `visibility = 'scheduled'` (CHECK). One timestamp, one date, chosen in
  the project's own calendar component.
- `01-Conventions.md`'s "created/updated pair on every table" applies to
  mutable entity tables. Immutable/join rows (`product_images`,
  `product_source_rows`, `stock_movements`, junction tables) carry only the
  timestamps they need.

## 6. Implementation status

| Status | Tables | Where |
|---|---:|---|
| Implemented DDL | 88 | all 13 files, `001`–`014` minus `008` |
| Specified, migration pending | 0 | — |
| Planned total | 88 | |

`009-partner.sql` forward-references `orders` and now applies cleanly
because `004-orders.sql` precedes it in the apply order. No file is
blocked; see `tuw-admin/src/server/db/migrate/README.md`.

## 7. Derived, never stored

Values that look like columns and are deliberately computed at read time:

| Value | Derived from | Why no column |
|---|---|---|
| `soldCount` | `SUM(order_items.qty)` over `orders.status NOT IN ('cancelled','failed')` | A cancellation corrects the number by existing; a stored counter drifts the moment a refund lands |
| `rating` / `reviewCount` | `AVG(reviews.rating)` / `COUNT(*)` where `is_approved` | Rejecting a review must retract its stars immediately |
| customer tier | order count + lifetime value | A tier column is a cache with no owner; the rule can change without a backfill |
| blog views | `page_views` rows | A counter on `blogs` would be fabricated, unauditable data (`09-CMS-Media.md`) |

Rule: if a number can be recomputed from rows that already exist and the
recompute is cheap enough at read time (one indexed aggregate per page),
it is not a column. Materialize only when a measured read cost forces it,
and then record that decision here.

## 8. Shipment timeline is a child table

`shipment_events` exists because the tracking timeline is a **list of
scans with their own times**, not three mutable fields on `shipments`.
Storing it as `jsonb` on the shipment row would make "append a scan"
a read-modify-write, and two concurrent carrier syncs would lose one.

- `UNIQUE (shipment_id, occurred_at, status)` makes a repeated sync a
  no-op instead of a duplicate line.
- `occurred_at` is the carrier's time; `created_at` is ours. They differ
  by exactly the sync lag — worth keeping separate.
- `shipments.status` is the current projection; `shipment_events` is the
  history that explains it. `orders.status` is coarser still (8 values)
  and is never derived from the carrier.

## 9. Idempotency is a schema concern

Duplicate prevention is **not** only application logic. Three layers live
in the DDL (`21-Idempotency.md`):

1. `idempotency_keys` — `UNIQUE (scope, key)` plus a stored response and
   an in-flight lease. A retried HTTP request replays; a concurrent one
   gets `409`.
2. `webhook_events` — `UNIQUE (provider, provider_event_id)`. Providers
   retry until they get a 2xx and replay after outages; deduping on
   **their** event id makes a double-applied payment structurally
   impossible.
3. Natural keys on the business tables (`orders.idempotency_key`,
   `reviews`, `email_logs.dedupe_key`, `notifications.dedupe_key`,
   `shipment_events`, `support_messages`, event-table `(id, ts)` PKs) —
   these outlive the TTL sweep in layer 1.

Consequences that bind future work: every mutating route needs a scope
name, every event id and its `ts` are stamped once client-side, and a new
"producer" table needs a dedupe key **before** its job is written.
