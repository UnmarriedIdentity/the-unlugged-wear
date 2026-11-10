-- 008-commerce-extras.sql — Newsletter, FAQs, gift cards, stock alerts (5 tables)
-- Source of truth: DOC/backend/22-Commerce-Extras.md.
-- Fills the 008 slot that was previously unused. Depends on 001 (users),
-- 002 (products, product_variants, categories) and 004 (orders, order_items).
-- Money is DECIMAL(12,2) INR, same as 004.
--
-- What is deliberately NOT a table here:
--   * Free-shipping threshold: store_settings 'shipping.free_threshold'.
--   * Exchange window (7 days): store_settings 'exchange.window_days'.
--   * Low-stock level: store_settings 'inventory.low_stock_threshold' with a
--     per-product override in products.low_stock_threshold. Admin low-stock /
--     out-of-stock alerts are notifications rows (kind 'inventory') with a
--     dedupe_key, so they need no table of their own.
--   * Contact form: support_tickets with source = 'contact_form' (014).

-- -------------------------------------------------- newsletter_subscribers
-- A table, not a users column: guests subscribe from the footer without an
-- account, the same person may later sign up (user_id is linked then), and
-- opt-in / opt-out history must survive account deletion for consent proof.
-- One row per email address (case-insensitive).
CREATE TABLE newsletter_subscribers (
  id                 uuid         PRIMARY KEY,
  email              varchar(255) NOT NULL,
  user_id            uuid         REFERENCES users (id) ON DELETE SET NULL,
  status             varchar(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','subscribed','unsubscribed','bounced')),
  source             varchar(20)  NOT NULL DEFAULT 'footer'
    CHECK (source IN ('footer','checkout','account','admin','import')),
  -- Double opt-in: SHA-256 of the confirm/unsubscribe token, never the raw value.
  confirm_token_hash varchar(64)  UNIQUE,
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  updated_at         timestamptz  NOT NULL DEFAULT now(),
  CHECK (status <> 'subscribed' OR confirmed_at IS NOT NULL)
);
CREATE UNIQUE INDEX one_subscriber_per_email ON newsletter_subscribers (lower(email));
CREATE INDEX idx_newsletter_subscribers_user_id ON newsletter_subscribers (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers (status);

-- -------------------------------------------------------------------- faqs
-- One table for the /faq page and product-page FAQ accordions.
-- scope 'general' = /faq (grouped by group_label, e.g. 'Shipping & Tracking');
-- 'product' and 'category' attach the question to one catalog row.
CREATE TABLE faqs (
  id           uuid         PRIMARY KEY,
  scope        varchar(10)  NOT NULL DEFAULT 'general'
    CHECK (scope IN ('general','product','category')),
  product_id   uuid         REFERENCES products (id) ON DELETE CASCADE,
  category_id  uuid         REFERENCES categories (id) ON DELETE CASCADE,
  group_label  varchar(100),
  question     varchar(500) NOT NULL,
  answer       text         NOT NULL,
  sort_order   integer      NOT NULL DEFAULT 0,
  is_published boolean      NOT NULL DEFAULT false,
  created_by   uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CHECK (
    (scope = 'general'  AND product_id IS NULL AND category_id IS NULL) OR
    (scope = 'product'  AND product_id IS NOT NULL AND category_id IS NULL) OR
    (scope = 'category' AND category_id IS NOT NULL AND product_id IS NULL)
  )
);
CREATE INDEX idx_faqs_general ON faqs (group_label, sort_order)
  WHERE scope = 'general' AND is_published;
CREATE INDEX idx_faqs_product_id ON faqs (product_id, sort_order) WHERE product_id IS NOT NULL;
CREATE INDEX idx_faqs_category_id ON faqs (category_id, sort_order) WHERE category_id IS NOT NULL;
CREATE INDEX idx_faqs_created_by ON faqs (created_by);

-- -------------------------------------------------------------- gift_cards
-- Prepaid value redeemable at checkout. Not store credit: a gift card is
-- bought or issued as a code, never created from a refund. It can be
-- combined with a discount code on the same order (discount first, then
-- the gift card pays down the remaining total).
-- balance is a cached figure; gift_card_transactions is the ledger that
-- explains it, and both are written in the same transaction.
CREATE TABLE gift_cards (
  id                      uuid          PRIMARY KEY,
  -- Only the SHA-256 of the code is stored; last4 is for display/search.
  code_hash               varchar(64)   NOT NULL UNIQUE,
  code_last4              char(4)       NOT NULL,
  initial_value           DECIMAL(12,2) NOT NULL CHECK (initial_value > 0),
  balance                 DECIMAL(12,2) NOT NULL CHECK (balance >= 0),
  currency                char(3)       NOT NULL DEFAULT 'INR',
  status                  varchar(20)   NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','disabled','expired','depleted')),
  -- Set at issue: issue time + store_settings 'gift_card.validity_months' (6).
  expires_at              timestamptz,
  recipient_name          varchar(150),
  recipient_email         varchar(255),
  message                 varchar(500),
  -- Bought on the storefront (the order line that paid for it) or issued by
  -- staff (issued_by). Either may be NULL for imported cards.
  purchased_order_item_id uuid          UNIQUE REFERENCES order_items (id) ON DELETE RESTRICT,
  issued_by               uuid          REFERENCES users (id) ON DELETE SET NULL,
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now(),
  CHECK (balance <= initial_value)
);
CREATE INDEX idx_gift_cards_status ON gift_cards (status);
CREATE INDEX idx_gift_cards_recipient_email ON gift_cards (lower(recipient_email))
  WHERE recipient_email IS NOT NULL;
CREATE INDEX idx_gift_cards_issued_by ON gift_cards (issued_by);

-- -------------------------------------------------- gift_card_transactions
-- Append-only ledger. amount is always positive; type says the direction:
-- issue (+), redeem (−), reversal (+, order cancelled/refunded), adjust (±
-- by staff, sign carried in balance_after).
CREATE TABLE gift_card_transactions (
  id            uuid          PRIMARY KEY,
  gift_card_id  uuid          NOT NULL REFERENCES gift_cards (id) ON DELETE RESTRICT,
  type          varchar(20)   NOT NULL
    CHECK (type IN ('issue','redeem','reversal','adjust')),
  amount        DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(12,2) NOT NULL CHECK (balance_after >= 0),
  order_id      uuid          REFERENCES orders (id) ON DELETE RESTRICT,
  actor         varchar(50)   NOT NULL,                  -- user id or 'system'
  note          varchar(255),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  CHECK (type NOT IN ('redeem','reversal') OR order_id IS NOT NULL)
);
CREATE INDEX idx_gct_gift_card_id ON gift_card_transactions (gift_card_id, created_at);
CREATE INDEX idx_gct_order_id ON gift_card_transactions (order_id) WHERE order_id IS NOT NULL;
-- A retried checkout cannot redeem the same card twice for one order.
CREATE UNIQUE INDEX one_gift_card_redeem_per_order
  ON gift_card_transactions (gift_card_id, order_id) WHERE type = 'redeem';

-- orders.gift_card_amount (004) records how much of the total a gift card
-- covered; grand_total stays the full order value.

-- ----------------------------------------------- stock_alert_subscriptions
-- "Notify me when back in stock". Works for guests (email only) and
-- customers (user_id). variant_id NULL = any variant of the product.
-- Rows are kept after notifying (status 'notified') for demand reporting.
CREATE TABLE stock_alert_subscriptions (
  id          uuid         PRIMARY KEY,
  product_id  uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id  uuid         REFERENCES product_variants (id) ON DELETE CASCADE,
  user_id     uuid         REFERENCES users (id) ON DELETE SET NULL,
  email       varchar(255) NOT NULL,
  status      varchar(20)  NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','notified','cancelled')),
  notified_at timestamptz,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CHECK (status <> 'notified' OR notified_at IS NOT NULL)
);
-- One open request per person per product/variant.
CREATE UNIQUE INDEX one_waiting_stock_alert
  ON stock_alert_subscriptions
     (lower(email), product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'waiting';
-- The restock job: "who is waiting for this product?"
CREATE INDEX idx_stock_alerts_waiting ON stock_alert_subscriptions (product_id, variant_id)
  WHERE status = 'waiting';
CREATE INDEX idx_stock_alerts_user_id ON stock_alert_subscriptions (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_stock_alerts_variant_id ON stock_alert_subscriptions (variant_id);
