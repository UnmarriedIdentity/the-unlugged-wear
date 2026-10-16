# API Contracts — Monolith Routes

> Status: Filling | Last Updated: 2026-10-15
> One API serving one first-party client — **no `/v1` segment** (versioning
> retro-added only on a second client or breaking change). Handlers are
> thin delegators to `server/<domain>` (file 01 §4); this file describes
> HTTP, never logic. Validation: zod in `server/validation`.

## Base rules

- **Envelope (errors):** `{ error: { code, message, details[] }, requestId,
  timestamp }`. No bare 500s, no stack leaks.
- **Pagination:** storefront cursor (`?cursor=base64(ts|id)&limit=24` →
  `{data, nextCursor}`); admin offset (`?page=&perPage=25` →
  `{data, page, perPage, total}`).
- **Idempotency:** `x-idempotency-key` required on checkout + cart
  mutations (24h server map; replay returns stored response).
- **Rate limits (per IP):** login/refresh 10/s · checkout 5/s ·
  beacon ingest 30/s · reads 30/s per route.
- **Identity:** `Authorization: Bearer` (15m JWT) or session cookie for
  guests (`x-session-id` on cart). Auth marks: `–` public, `C` customer,
  `A` admin.

## Auth `/api/auth`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | – | `{email, password, firstName, lastName}` → 201 user + tokens |
| POST | `/login` | – | credentials → tokens; 401 on bad |
| POST | `/logout` | C | revoke family → 204 |
| POST | `/refresh` | – | rotate by hash → new pair; reuse revokes family |
| GET / PATCH | `/me` | C | profile read / partial update |
| PATCH | `/me/password` | C | revokes all sessions |
| GET/POST | `/me/addresses` | C | book / add (default logic in service) |
| PATCH/DELETE | `/me/addresses/:id` | C | edit / remove |
| GET | `/users` | A | `?page=&status=` admin list |
| PATCH | `/users/:id/status` | A | disable/enable |
| GET/POST | `/roles` | A | list / create with permission slugs |
| PATCH | `/users/:id/roles` | A | assign role slugs |

## Catalog `/api/catalog`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/products` | – | cursor + `category/brand/minPrice/maxPrice/tag/q/sort` |
| GET | `/products/:slug` | – | PDP: product + images + options/values + variants + active discount + attributes |
| POST / PATCH / DELETE | `/products` (+`/:id`) | A | create / partial / soft-delete |
| POST / PATCH / DELETE | `/products/:id/variants`, `/variants/:id` | A | variant CRUD |
| POST / PATCH | `/products/:id/options`, `/options/:id` | A | option + values write |
| POST / PATCH / DELETE | `/products/:id/images`, `/images/:id` | A | gallery write (R2 URLs) |
| POST | `/products/:id/stock` | A | `{delta, reason: 'admin_adjustment'}` → movement row |
| GET | `/products/:id/stock-movements` | A | ledger timeline (TL-UI-STOCKHIST reads this) |
| POST / PATCH / DELETE | `/products/:id/discounts`, `/discounts/:id` | A | scheduled discounts |
| GET | `/attributes` | – | compare-attribute defs |
| GET / POST / PATCH | `/reviews…` | –/C/A | list / write / approve (ships with PDP stars) |
| GET | `/categories`, `/brands` | – | trees and brand pages (brands UI later) |
| GET | `/collections/:slug` | – | collection page (junction read) |

## Cart `/api/cart` (auth or `x-session-id`)

`GET /cart` · `POST /cart/items` · `PATCH /cart/items/:id` (qty) ·
`DELETE /cart/items/:id` · `DELETE /cart/items` (`{ids[]}` batch) ·
`DELETE /cart` (clear) · `POST /cart/merge` (guest→user on login) ·
wishlist `GET / POST / DELETE` trio. Side effects fire-and-forget.

## Order `/api/order`

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/checkout` | C + idempotency key | full TX scope (file 06); 409 on stock, 422 on coupon |
| GET | `/orders/:id` | C owner / A | order + items + payments |
| GET | `/me/orders` | C | cursor history |
| GET | `/orders` | A | `?page=&status=&from=&to=&q=` |
| PATCH | `/orders/:id/status` | A | status + history row |
| POST | `/orders/:id/refund` | A | refund TX scope |
| POST / GET / PATCH / DELETE | `/discount-codes…` | C-validate / A-manage | validate + future manager UI |

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
  `GET /search` (ranked, tsvector now, dedicated index later).

## Error codes (shared)

`VALIDATION_FAILED` 400 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 ·
`*_NOT_FOUND` 404 · `DUPLICATE_SKU` / `STOCK_INSUFFICIENT` /
`IDEMPOTENCY_CONFLICT` 409 · `COUPON_EXPIRED` / `COUPON_USED` 422 ·
`RATE_LIMITED` 429 · `INTERNAL_ERROR` 500.
