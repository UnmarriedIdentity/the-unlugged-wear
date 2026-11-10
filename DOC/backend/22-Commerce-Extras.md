# Commerce Extras — Newsletter, FAQs, Gift Cards, Stock Alerts

> Status: Draft | Last Updated: 2026-11-10
> DDL: `db/migrate/008-commerce-extras.sql` (5 tables). Conventions:
> `01-Conventions.md`. Money is DECIMAL(12,2) INR.

## Decisions in one place

| Need | Where it lives | Why |
|---|---|---|
| Newsletter sign-up | `newsletter_subscribers` table | Guests subscribe without an account; double opt-in and unsubscribe history must outlive accounts; one row per email, linked to `users` when that person signs up |
| FAQ page + product FAQs | `faqs` table | One table, `scope` = general / product / category |
| Contact form | `support_tickets` with `source = 'contact_form'` (014) | Contact messages are support threads; one staff inbox |
| Gift cards | `gift_cards` + `gift_card_transactions`; sold as a `products.product_kind = 'gift_card'` product | Bought on the storefront; separate from discount codes; balance + append-only ledger; redeemable at checkout; never sent to a fulfilment provider |
| Back-in-stock alerts | `stock_alert_subscriptions` | Guests or customers ask to be emailed when a product/variant returns |
| Low / out-of-stock alerts for staff | `notifications` (kind `inventory`) + `products.low_stock_threshold` + `store_settings.inventory.low_stock_threshold` | No new table: the existing bell + dedupe key covers it |
| Free-shipping threshold | `store_settings.shipping.free_threshold` (₹3,000 seed) | Editable in admin settings, no deploy needed |
| Exchange window | `store_settings.exchange.window_days` (7 seed) | Rule lives in data; enforcement in the order service (file 06) |
| Guest checkout | `orders.guest_email` / `guest_name` / `guest_phone` (004) | File 06 |
| Store credit, loyalty, cart-level promotions | — | Not part of the product |

## newsletter_subscribers

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | |
| email | varchar(255) | NOT NULL; unique on `lower(email)` | One row per address |
| user_id | uuid | NULL, FK → users ON DELETE SET NULL | Linked when the subscriber has / creates an account |
| status | varchar(20) | `pending` / `subscribed` / `unsubscribed` / `bounced` | `subscribed` requires `confirmed_at` (CHECK) |
| source | varchar(20) | `footer` / `checkout` / `account` / `admin` / `import` | Where consent was given |
| confirm_token_hash | varchar(64) | NULL, UNIQUE | SHA-256 of the confirm/unsubscribe token |
| confirmed_at / unsubscribed_at | timestamptz | NULL | Consent evidence |

Re-subscribing reuses the same row (status back to `pending`).

## faqs

| Column | Type | Constraints | Reason |
|---|---|---|---|
| scope | varchar(10) | `general` / `product` / `category` | CHECK ties scope to exactly one target |
| product_id / category_id | uuid | NULL, FK ON DELETE CASCADE | Product-page or category FAQ |
| group_label | varchar(100) | NULL | `/faq` section heading (e.g. "Shipping & Tracking") |
| question / answer | varchar(500) / text | NOT NULL | |
| sort_order, is_published | integer, boolean | | Draft FAQs stay hidden |

## gift_cards + gift_card_transactions

- The code is shown once and stored only as a SHA-256 hash (`code_hash`)
  plus `code_last4` for staff search.
- `balance` is cached on the card and always written in the same
  transaction as a `gift_card_transactions` row (`issue`, `redeem`,
  `reversal`, `adjust`), so the ledger explains every rupee.
- Checkout: `orders.gift_card_amount` records the part of `grand_total`
  the card paid; `payments` cover the rest. A redeem is unique per
  (card, order), so a retried checkout cannot spend twice.
- Cancel/refund of an order that used a card writes a `reversal` that
  restores the balance.
- Cards are bought on the storefront: a `product_kind = 'gift_card'`
  product line; payment success issues the card, links it to that
  `order_items` row and emails the code to the recipient. A staff-issued
  card (goodwill) records `issued_by`.
- Gift cards are a separate system from `discount_codes`, **and both can
  be used on one order**: the discount code reduces the total first, then
  the gift card pays down what remains (`orders.discount`, then
  `orders.gift_card_amount`; payments cover the rest).
- **Expiry: 6 months from issue** (`store_settings.gift_card.validity_months`
  = 6 → `gift_cards.expires_at`). The expiry date is shown at purchase, in
  the gift email and on the balance check. A daily job flips expired cards
  to `status = 'expired'`; the remaining balance is not refundable.

## stock_alert_subscriptions

- One open (`waiting`) request per email per product/variant.
- When stock goes from 0 to > 0, the restock job emails every `waiting`
  row for that product/variant via `email_logs`, then marks them
  `notified` (kept for demand reporting).

## Staff low-stock / out-of-stock alerts

When a stock write leaves a product or variant at or below its threshold
(`products.low_stock_threshold`, else the store-wide setting) or at 0, the
service inserts a `notifications` row for staff with kind `inventory` and a
`dedupe_key` such as `inventory.low:<variant_id>:<date>` so the same alert
cannot ring twice.

## Open questions (to confirm with the owner)

See the task tracker entry `TL-DB-COMMERCE-EXTRAS` for the questions on
gift-card purchase flow, expiry and exchange price differences.
