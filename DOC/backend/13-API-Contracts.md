# API Contracts — Storefront API + Admin API

> Status: Filling | Last Updated: 2026-10-30
> One API serving one first-party client — **no `/v1` segment** (versioning
> retro-added only on a second client or breaking change). Handlers are
> thin delegators to `server/<domain>` (file 01 §4); this file describes
> HTTP, never logic. Validation: zod in `server/validation`.
> Retry semantics (what the `Idempotency-Key` header actually guarantees)
> are in `21-Idempotency.md`.

## Base rules

- **Envelope (errors):** `{ error: { code, message, details[] }, requestId,
  timestamp }`. No bare 500s, no stack leaks.
- **Pagination:** storefront cursor (`?cursor=base64(ts|id)&limit=24` →
  `{data, nextCursor}`); admin offset (`?page=&perPage=25` →
  `{data, page, perPage, total}`).
- **Idempotency:** every mutating `POST`/`PATCH` carries an
  `Idempotency-Key` header (a client-generated UUIDv7), stored in
  `idempotency_keys` under a route scope (`checkout`, `payment.capture`,
  `refund.create`, `return.create`, `cart.merge`, `import.apply`,
  `support.create`, `household.invite`, `auth.signup`, `auth.invite`,
  `auth.reset`, `cms.publish`). Replay returns the **stored** status +
  body; a concurrent duplicate gets `409 REQUEST_IN_PROGRESS`; the same key
  with a different body gets `422 IDEMPOTENCY_KEY_REUSED`. Missing key is
  `400` on `/api/order/*`, `/api/payment/*`, `/api/refund/*`,
  `/api/returns/*`, `/api/import/*`, `/api/household/invite`. Detail: `21-Idempotency.md`.
- **Rate limits (per IP):** login/refresh 10/s · checkout 5/s ·
  beacon ingest 30/s · reads 30/s per route.
- **Identity:** `Authorization: Bearer` (15m JWT) or session cookie for
  guests (`x-session-id` on cart). Guest carts **and guest checkout** are
  allowed (orders carry `guest_email` + `guest_name`, file 06). Auth
  marks: `–` public, `G` guest or customer, `C` customer, `A` admin
  (staff role).
- **Which deployment serves a route:** `C`, `G` and `–` routes are served by
  the **storefront API** (`tuw-website`, `/api/*`); `A` routes are served by
  the **admin API** (`tuw-admin`, `/api/*`). Both talk to the same Neon
  database. Where one table below lists both, the storefront route is the
  customer view and the admin route is the staff view. Detail:
  `12-Two-App-Deploy.md`.

## Auth `/api/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | – | `{email, password, firstName, lastName}` → 201 user + profile + solo household + tokens. Scope `auth.signup` |
| GET | `/verify` | – | `?token=` → confirms the address (`email_verification_tokens`), single use |
| POST | `/reset/request` | – | `{email}` → always 204 (never reveals existence); writes a `password_reset_tokens` row. Scope `auth.reset` |
| POST | `/reset/confirm` | – | `{token, password}` → sets `password_hash`, activates a `pending` user, revokes sessions |
| POST | `/invite` | A | `{email, roleSlug, firstName, lastName}` → `users(status='pending', password_hash=NULL)` + a reset token used as the "set your password" link. Scope `auth.invite` |
| POST | `/login` | – | credentials → tokens; 401 on bad, 423 while `locked_until` is in the future |
| POST | `/logout` | C | revoke family → 204 |
| POST | `/refresh` | – | rotate by hash → new pair; reuse revokes family |
| GET / PATCH | `/me` | C | my profile read / partial update (name/phone/DOB) |
| PATCH | `/me/password` | C | revokes all sessions |
| GET/POST | `/me/addresses` | C | **my own book only** (`WHERE profile_id = me` — never household-scoped) / add; one default per type per person, enforced by partial uniques |
| PATCH/DELETE | `/me/addresses/:id` | C | edit / remove |
| GET | `/users` | A | `?page=&status=` admin list |
| PATCH | `/users/:id/status` | A | disable/enable |
| GET/POST | `/roles` | A | list / create with permission slugs |
| PATCH | `/users/:id/roles` | A | assign role slugs |

Login writes a `login_attempts` row on **every** attempt (success included)
and sets `users.locked_until` when the failure window trips — the endpoint
reads that column rather than recounting on each request.

## Household `/api/household`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/members` | C | "Order for" dropdown: profiles + `canLogIn` + saved sizes |
| POST | `/members` | C manager | add managed member `{firstName, lastName, dateOfBirth?}` — no email, no invite |
| PATCH | `/members/:profileId` | C self/manager | profile fields — the checkout "Edit member" panel calls this |
| PUT | `/members/:profileId/sizes` | C self/manager | upsert size map `{categoryId: sizeValueId, …}` (full desired map) |
| DELETE | `/members/:profileId` | C manager | managed member: delete (409 when order history exists); login member: **soft leave** (`left_at`) + fresh solo household |
| POST / GET / DELETE | `/invitations` (+`/:id`) | C manager | join (email) / claim (`profileId`) links, 7-day expiry |

Line-level size edits are cart-local and never call these routes
(`17-Household-Accounts.md` §6).

**The family payload never carries addresses.** `/members` returns profiles and
saved sizes only; each person reads their own book through `/me/addresses`.
A manager may see members' sizes, never their address rows — that is the
privacy rule the schema enforces by removing `addresses.household_id`.

## Catalog `/api/catalog`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/products` | – | cursor + `category/brand/minPrice/maxPrice/tag/q/sort` |
| GET | `/products/:slug` | – | PDP: product + images + attribute links/values + variants + active discount |
| POST / PATCH / DELETE | `/products` (+`/:id`) | A | create / partial / soft-delete |
| POST / PATCH / DELETE | `/products/:id/variants`, `/variants/:id` | A | variant CRUD |
| POST / PATCH / DELETE | `/products/:id/attribute-links`, `/attribute-links/:id` | A | attribute link + chosen values write (library is the single source) |
| POST / PATCH / DELETE | `/products/:id/images`, `/images/:id` | A | gallery write (R2 URLs) |
| POST | `/products/:id/stock` | A | `{delta, reason: 'admin_adjustment'}` → movement row |
| GET | `/products/:id/stock-movements` | A | ledger timeline (TL-UI-STOCKHIST reads this) |
| POST / PATCH / DELETE | `/products/:id/discounts`, `/discounts/:id` | A | scheduled discounts |
| GET | `/attributes` | – | attribute library definitions (facets; PDP compare only if scoped later) |
| GET / POST / PATCH | `/reviews…` | –/C/A | list / write / approve (ships with PDP stars) |
| GET | `/categories`, `/brands` | – | trees and brand pages (brands UI later) |
| GET | `/collections/:slug` | – | collection page (junction read) |

## Styling `/api/styling` (module — ships last; file 19)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/complete-the-look` | – | ranked complements (`?product=<slug>&limit=`); empty `data[]` when disabled or stock-dry — never an error |
| POST | `/events` | – | impression/click/atc ingest, fire-and-forget (beacon class → 30/s) |

Never writes cart/profile state; availability re-checked at serve time
(file 19 §5). Cacheable while non-personalized (refinement stage 4
switches it to per-session re-ranking).

## Cart `/api/cart` (auth or `x-session-id`)

`GET /cart` · `POST /cart/items` · `PATCH /cart/items/:id` (qty) ·
`DELETE /cart/items/:id` · `DELETE /cart/items` (`{ids[]}` batch) ·
`PATCH /cart/recipient` (`{profileId|null}` — "Order for") ·
`DELETE /cart` (clear) · `POST /cart/merge` (guest→user on login) ·
wishlist `GET / POST / DELETE` trio. Side effects fire-and-forget.

Cart writes are naturally idempotent — a re-add lands on the
`(cart_id, product_id, variant_id) NULLS NOT DISTINCT` unique and bumps
qty instead of duplicating a line, and `POST /cart/merge` carries an
`Idempotency-Key` (scope `cart.merge`) so a double-triggered login merge
cannot merge twice.

## Order `/api/order`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/checkout` | G + `Idempotency-Key` | full TX scope (file 06). Guest body adds `{guestEmail, guestName, guestPhone?}` and skips the household fields; account checkout: copies `for_profile_id` **and** `for_household_id` from the cart — the composite FK then rejects a recipient who is not an active member of that household; the delivery address is the buyer's own (`addresses.profile_id = me`), and a per-line size override is stored on the order line only, never written to `profile_size_preferences`. 409 on stock, 422 on coupon. The key lands in `orders.idempotency_key` as well, so a retry after the 24h map expires still returns the same order |
| GET | `/orders/:id` | C: placed-by or for-me / A | order + items + payments |
| GET | `/me/orders` | C | cursor history (placed by me ∪ for me) |
| POST | `/me/orders/claim` | C (verified email) | attaches the caller's guest orders (`guest_email` = their verified email) to their account |
| POST | `/track` | – | guest track-order: `{orderNumber, email}` → status + shipment timeline (rate-limited; never reveals whether an email exists) |
| POST | `/orders/:id/cancel` | G: placed-by or guest email match | allowed only while `status = 'pending'`; 409 otherwise |
| GET | `/orders` | A | `?page=&status=&from=&to=&q=` |
| PATCH | `/orders/:id/status` | A | status + history row |
| POST | `/orders/:id/refund` | A | refund TX scope |
| POST / GET / PATCH / DELETE | `/discount-codes…` | C-validate / A-manage | validate + future manager UI |

## Returns `/api/returns`

The table is the contract: `status` is the pipeline, `resolution` is the
outcome, the reason is per line (file 06).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/` | C: placed-by or for-me (account required — guests sign up and claim the order first) | `type` = `exchange` or `replacement` (no money-back returns). Exchange rules (file 06): order `delivered`, within 7 days of delivery, exchange variant of the same product — 409 otherwise; response carries `priceDifference` (> 0 → pay on the replacement order, < 0 → refund). Replacement requires evidence media ids (unboxing video) within the partner claim window. `{orderId, type, items:[{orderItemId, qty, reasonCode, exchangeVariantId?}], note?}` → `returns` (`status='requested'`) + `return_items` + `return_status_history`, all one TX. 409 when `qty` would push `order_items.returned_qty` past `qty`; 422 when the exchange variant is missing for an exchange line |
| GET | `/me/returns` | C | my requests (as requester), with lines |
| GET | `/:id` | C: requester or for-me / A | header + lines + timeline |
| GET | `/` | A | `?status=&from=&to=&q=` — the admin board, same rows |
| PATCH | `/:id/status` | A | `{status, note?}` → `returns.status` + history row; `rejected` requires a `rejection_reason` |
| PATCH | `/:id/items/:itemId` | A | `{disposition, exchangeVariantId?, refundAmount?}` — restock writes `stock_movements` and bumps `returned_qty` |
| POST | `/:id/refund` | A | creates the `refunds` row and sets `returns.refund_id` in one TX (UNIQUE = 1:1). COD orders: `method` `upi` / `bank_transfer` + `payoutReference` (UTR) + masked destination |

## Fulfilment `/api/fulfillment` (admin API; file 16)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET / PATCH | `/providers`, `/providers/:slug` | A | list registry rows; toggle active, sandbox/live, non-secret settings |
| GET / PUT | `/mappings?variantId=` | A | provider SKU + payload per variant |
| POST | `/orders/:orderId/submit` | A | create `fulfillment_orders` + call the adapter (idempotent per `external_ref`) |
| POST | `/fulfillment-orders/:id/sync` | A | "Sync now": poll the provider once |
| POST | `/fulfillment-orders/:id/cancel` | A | adapter cancel + wallet `cancel_credit` |
| POST | `/fulfillment-orders/:id/reship` | A | re-ship an RTO parcel (new row, `reason = 'reship'`) |
| GET / POST / PATCH | `/claims…` | A | defect claims with evidence + outcome |
| GET / POST | `/wallet/:slug` | A | ledger + manual recharge / adjustment entry |
| GET / POST | `/cod-remittances` | A | record and reconcile COD payouts |

## CMS `/api/cms`

Sections (`GET ?pageKey`, POST/PUT/DELETE by key, reorder) · global
settings GET/PUT (version bump) · navigation GET/PUT · pages CRUD by slug ·
blogs CRUD + categories · media upload/list/delete (R2 presign).
Section writes validate `ctas[] ≤ 3` (400 otherwise).

## Analytics `/api/analytics`

`POST /events/page-view` (beacon forward) · `GET /admin/dashboard`,
`/admin/funnel`, `/admin/exits`, `/admin/abandoned-carts` (all A, `?from=&to=`).
Pre-tracking: empty states, never fabricated numbers (file 10 honesty rule).

## Import `/api/import` · Notify `/api/notify` · Search `/api/search`

- Import (A): `POST /import` (multipart CSV → 202 `{jobId}`) ·
  `GET /jobs`, `GET /jobs/:id` (counters + row errors).
- Notify (A): `GET /admin/emails`, `POST /admin/test-email`,
  templates GET/PUT (optional table).
- Search (–): `GET /suggest?q=` (debounced typeahead) ·
  `GET /search` (ranked). One query over two `tsvector` + GIN indexes:
  `products.search_vector` (name + short_description + description) and
  `categories.search_vector` (name + description), merged and ranked in SQL.
  There is no `search_documents` table — the per-entity vectors cover
  products **and** categories, and a dedicated cross-entity index is a
  later decision, not a missing table.

## Derived read models (computed in SQL, never stored)

Two dashboard/PDP values look like columns and deliberately are not
(`20-Schema-Decisions.md` §7):

| Value | Query shape | Why never stored |
|---|---|---|
| `soldCount` | `SUM(order_items.qty)` over `orders.status NOT IN ('cancelled','failed')`, grouped per product | A cancellation or refund corrects the number by existing; a column would need a reconciliation job and could drift |
| `rating` / `reviewCount` | `AVG(reviews.rating)` / `COUNT(*)` where `is_approved` | A rejected review must retract its stars immediately |

Product lists fetch both with one `LATERAL` aggregate per product (or a
single grouped join), so N products stay one round trip; PDP fetches them
once. No cache table, no trigger, no nightly recompute.

## Error codes (shared)

`VALIDATION_FAILED` 400 · `AUTH_LOCKED` 423 · `UNAUTHENTICATED` 401 ·
`FORBIDDEN` 403 · `*_NOT_FOUND` 404 · `DUPLICATE_SKU` /
`STOCK_INSUFFICIENT` / `IDEMPOTENCY_CONFLICT` / `REQUEST_IN_PROGRESS` 409 ·
`COUPON_EXPIRED` / `COUPON_USED` / `IDEMPOTENCY_KEY_REUSED` 422 ·
`RATE_LIMITED` 429 · `INTERNAL_ERROR` 500.
