-- 004-orders.sql — Orders & money (11 tables)
-- Source of truth: DOC/backend/06-Orders-Payments.md (transcribed 1:1).
-- Money is DECIMAL(12,2); totals are stored, never derived — a financial
-- record must be immutable, not recomputed. Currency: INR (single currency).
-- Order inside the file: discount_codes first (orders references it), then
-- orders and every owned child. 009-fulfillment.sql applies after this file.
-- Idempotency: orders.idempotency_key + one_order_per_idempotency_key make a
-- retried checkout return the stored order instead of creating a second one.

-- --------------------------------------------------------- discount_codes
CREATE TABLE discount_codes (
  id               uuid          PRIMARY KEY,
  code             varchar(50)   NOT NULL UNIQUE,
  discount_type    varchar(10)   NOT NULL CHECK (discount_type IN ('percent','fixed')),
  value            DECIMAL(12,2) NOT NULL CHECK (value >= 0),
  min_order_amount DECIMAL(12,2) CHECK (min_order_amount >= 0),
  max_uses         integer       CHECK (max_uses > 0),
  uses_count       integer       NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  starts_at        timestamptz,
  ends_at          timestamptz,
  is_active        boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  CHECK ((discount_type = 'percent' AND value <= 100) OR discount_type = 'fixed')
);
-- Expiry-aware checkout validation, narrow by construction.
CREATE INDEX idx_discount_codes_active ON discount_codes (is_active, ends_at)
  WHERE is_active;

-- ------------------------------------------------------------------ orders
-- Two kinds of buyer, enforced by orders_buyer_identity:
--   * Account order: placed_by_user_id (payer of record) + for_profile_id
--     (recipient) are both set. 011-household.sql adds for_household_id and
--     the composite FK that proves the recipient belongs to that household.
--   * Guest order: no user/profile/household; guest_email + guest_name are the
--     contact of record. Order tracking for guests is order_number + email.
-- RESTRICT keeps financial history even if an account is disabled.
-- order_type marks follow-up orders created from a returns row
-- (returns.replacement_order_id): 'exchange' = size/variant swap (grand_total
-- = the price difference the customer pays, 0 when the new variant costs the
-- same or less), 'replacement' = free reprint of a defective/damaged item.
-- Revenue reports count only the money actually charged.
CREATE TABLE orders (
  id                uuid          PRIMARY KEY,
  placed_by_user_id uuid          REFERENCES users (id) ON DELETE RESTRICT,
  for_profile_id    uuid          REFERENCES profiles (id) ON DELETE RESTRICT,
  -- Household the recipient belongs to. The composite FK to
  -- household_members (household_id, profile_id) is attached in
  -- 011-household.sql, where that table exists. NULL only for guest orders.
  for_household_id  uuid,
  guest_email       varchar(255),
  guest_name        varchar(150),
  guest_phone       varchar(20),
  order_number      varchar(30)   NOT NULL UNIQUE,
  order_type        varchar(20)   NOT NULL DEFAULT 'standard'
    CHECK (order_type IN ('standard','exchange','replacement')),
  -- Fulfillment axis (independent from payment). Spec vocabulary only.
  status            varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped',
                      'delivered','cancelled','failed','refunded')),
  subtotal          DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  tax               DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  -- Part of grand_total paid by gift card (008); payments cover the rest.
  gift_card_amount  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (gift_card_amount >= 0),
  grand_total       DECIMAL(12,2) NOT NULL CHECK (grand_total >= 0),
  currency          char(3)       NOT NULL DEFAULT 'INR',
  payment_status    varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  -- Snapshots: the order survives address-book edits.
  shipping_address  jsonb         NOT NULL,
  billing_address   jsonb         NOT NULL,
  discount_code_id  uuid          REFERENCES discount_codes (id) ON DELETE SET NULL,
  -- Retry guard (client `Idempotency-Key`). Survives the idempotency_keys
  -- table's TTL cleanup, so a replayed request can never fork an order.
  idempotency_key   varchar(255),
  -- Free-cancel window: paid orders stay 'pending' (not sent to the
  -- fulfilment partner) until this moment = payment time + store_settings
  -- 'orders.cancel_window_minutes'. The customer may cancel only while
  -- status = 'pending' AND now() < cancellable_until; the submit worker picks
  -- orders whose window has passed, then the order becomes 'confirmed'.
  cancellable_until timestamptz,
  notes             text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT orders_buyer_identity CHECK (
    (placed_by_user_id IS NOT NULL AND for_profile_id IS NOT NULL
       AND guest_email IS NULL)
    OR (placed_by_user_id IS NULL AND for_profile_id IS NULL
       AND guest_email IS NOT NULL AND guest_name IS NOT NULL)
  ),
  CONSTRAINT orders_household_matches_buyer
    CHECK ((placed_by_user_id IS NULL) = (for_household_id IS NULL))
);
CREATE INDEX idx_orders_placed_by ON orders (placed_by_user_id, created_at DESC);
CREATE INDEX idx_orders_for_profile ON orders (for_profile_id, created_at DESC);
CREATE INDEX idx_orders_for_household_id ON orders (for_household_id);
CREATE INDEX idx_orders_discount_code_id ON orders (discount_code_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
-- The submit worker: still pending, window over (prepaid orders must also
-- be paid; COD orders are submitted unpaid by design).
CREATE INDEX idx_orders_ready_to_submit ON orders (cancellable_until)
  WHERE status = 'pending';
-- Guest order lookup (track-order: order_number + email).
CREATE INDEX idx_orders_guest_email ON orders (lower(guest_email))
  WHERE guest_email IS NOT NULL;
CREATE INDEX idx_orders_order_type ON orders (order_type)
  WHERE order_type <> 'standard';
-- Retry guard scoped per buyer: the user for account orders, the lowered
-- email for guest orders.
CREATE UNIQUE INDEX one_order_per_idempotency_key
  ON orders ((COALESCE(placed_by_user_id::text, 'guest:' || lower(guest_email))),
             idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ------------------------------------------------------------- order_items
-- Immutable purchase record: snapshots beat live catalog data on purpose.
-- returned_qty is the one mutable column — the restock TX increments it, and
-- the CHECK makes "more returned than bought" impossible to store.
CREATE TABLE order_items (
  id           uuid          PRIMARY KEY,
  order_id     uuid          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  variant_id   uuid          REFERENCES product_variants (id) ON DELETE RESTRICT,
  product_name varchar(255)  NOT NULL,
  sku          varchar(64)   NOT NULL,
  unit_price   DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  qty          integer       NOT NULL CHECK (qty > 0),
  returned_qty integer       NOT NULL DEFAULT 0 CHECK (returned_qty >= 0),
  line_total   DECIMAL(12,2) NOT NULL CHECK (line_total >= 0),
  -- {"Size":"M","Color":"Onyx"} — frozen variant combination.
  options      jsonb,
  -- Snapshot of the exchange rule at purchase time (products.exchange_policy).
  exchange_policy varchar(20) NOT NULL DEFAULT 'defects_only'
    CHECK (exchange_policy IN ('defects_only','exchangeable','none')),
  -- Personalised line: copied from the cart. The approved preview is what the
  -- fulfilment partner prints; the CHECK forbids an unapproved custom print.
  personalization     jsonb,
  preview_image_url   varchar(2048),
  preview_approved_at timestamptz,
  created_at   timestamptz   NOT NULL DEFAULT now(),
  CHECK (returned_qty <= qty),
  CHECK (personalization IS NULL
         OR (preview_image_url IS NOT NULL AND preview_approved_at IS NOT NULL))
);
CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
CREATE INDEX idx_order_items_variant_id ON order_items (variant_id);

-- ------------------------------------------------------ order_status_history
-- Written in the same TX as orders.status, so the timeline can never skip.
CREATE TABLE order_status_history (
  id          uuid         PRIMARY KEY,
  order_id    uuid         NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  from_status varchar(20),                                    -- NULL on creation
  to_status   varchar(20)  NOT NULL,
  note        varchar(500),
  actor       varchar(50)  NOT NULL,                          -- user id or 'system'
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_osh_order_id ON order_status_history (order_id, created_at);

-- ---------------------------------------------------------------- payments
-- provider = who processed it; method = how the customer paid (admin/UI axis).
CREATE TABLE payments (
  id             uuid          PRIMARY KEY,
  order_id       uuid          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  -- Provider slug; FK to integration_providers (slug) added in 009.
  provider       varchar(30)   NOT NULL DEFAULT 'mock',
  method         varchar(20)   NOT NULL DEFAULT 'upi'
    CHECK (method IN ('upi','card','netbanking','wallet','cod')),
  amount         DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  status         varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','authorized','captured','failed','refunded')),
  -- Provider reference: UNIQUE makes capture idempotent.
  transaction_id varchar(100)  UNIQUE,
  paid_at        timestamptz,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_order_id ON payments (order_id);
-- Never charge twice: at most one successful payment per order (failed and
-- pending attempts may pile up; a captured one cannot be joined by another).
CREATE UNIQUE INDEX one_captured_payment_per_order
  ON payments (order_id) WHERE status IN ('captured','refunded');
CREATE INDEX idx_payments_status ON payments (status);

-- ----------------------------------------------------------------- refunds
-- Refund history is audit: RESTRICT, never cascade.
CREATE TABLE refunds (
  id         uuid          PRIMARY KEY,
  order_id   uuid          NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  payment_id uuid          REFERENCES payments (id) ON DELETE SET NULL,
  -- Partial refunds allowed; the ceiling (<= orders.grand_total) is enforced
  -- in the application, the floor in the DB.
  amount     DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  reason     varchar(255)  NOT NULL,
  -- How the money goes back (never store credit):
  --   source        = reversal through the original gateway (prepaid orders)
  --   upi           = manual UPI payout (COD orders, which have no gateway)
  --   bank_transfer = manual NEFT/IMPS payout (COD fallback)
  method     varchar(30)   NOT NULL DEFAULT 'source'
    CHECK (method IN ('source','upi','bank_transfer')),
  -- Gateway refund id or bank UTR — proof the money left.
  payout_reference          varchar(100),
  -- Masked destination only ('name@okaxis', 'HDFC ••••1234'). Full account
  -- numbers are never stored; staff collect them at payout time.
  payout_destination_masked varchar(100),
  -- Client Idempotency-Key of the staff action that created it: a retried
  -- "refund ₹500" returns this row instead of refunding again.
  idempotency_key           varchar(255),
  status     varchar(20)   NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','completed','rejected')),
  actor      uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now(),
  -- A completed manual payout must carry its proof.
  CHECK (status <> 'completed' OR method = 'source' OR payout_reference IS NOT NULL)
);
CREATE INDEX idx_refunds_order_id ON refunds (order_id);
CREATE INDEX idx_refunds_payment_id ON refunds (payment_id);
CREATE INDEX idx_refunds_actor ON refunds (actor);
CREATE INDEX idx_refunds_status ON refunds (status);
-- Concurrency guard: no double-processing the same order.
CREATE UNIQUE INDEX one_open_refund ON refunds (order_id)
  WHERE status = 'processing';
CREATE UNIQUE INDEX one_refund_per_idempotency_key
  ON refunds (order_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
-- A gateway refund id or bank UTR is proof of one payout — never two rows.
CREATE UNIQUE INDEX one_refund_per_payout_reference
  ON refunds (method, payout_reference) WHERE payout_reference IS NOT NULL;

-- ----------------------------------------------------------------- returns
-- Two independent axes: `status` is the customer/RMA pipeline, `resolution` is
-- what the customer gets back. A request can exist before anything ships
-- ('requested'), which the old stage machine could not express. Restock writes
-- stock_movements with reason 'return'; the refund is linked 1:1 instead of
-- duplicating refund rows.
-- Two request types (there are no money-back returns — the fulfilment
-- partner does not take garments back):
--   exchange    = another size/variant of the same product. Delivered orders
--                 only, within store_settings 'exchange.window_days' (7) of
--                 delivery. price_difference > 0 is charged on the
--                 replacement order; < 0 is refunded (refund_id).
--   replacement = defective / misprinted / damaged / wrong item, reported
--                 within the partner claim window with unboxing evidence;
--                 a fulfillment_claims row (009) goes to the partner.
-- Both require an account: a guest must sign up (and claim the order) first.
-- The replacement ships as its own order (replacement_order_id), so it
-- reuses shipments + fulfillment_orders unchanged.
CREATE TABLE returns (
  id                      uuid          PRIMARY KEY,
  rma_number              varchar(30)   NOT NULL UNIQUE,   -- 'RMA-2026-000123'
  order_id                uuid          NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  -- Who asked. A staff-logged request keeps the profile but has no user.
  requested_by_profile_id uuid          NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  requested_by_user_id    uuid          REFERENCES users (id) ON DELETE SET NULL,
  type                    varchar(12)   NOT NULL DEFAULT 'exchange'
    CHECK (type IN ('exchange','replacement')),
  status                  varchar(20)   NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','rejected','pickup_scheduled',
                      'in_transit','received','inspected','completed',
                      'cancelled','disputed')),
  resolution              varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (resolution IN ('pending','exchange','replacement','refund','none')),
  -- Exchange only: new variant total − original line total (signed).
  -- > 0 customer pays on the replacement order; < 0 refunded; 0 free swap.
  price_difference        DECIMAL(12,2),
  customer_note           varchar(500),
  -- Abuse limit: every request needs at least one photo (media ids, 006).
  -- Defect replacements also need the unboxing video the partner demands.
  evidence_media_ids      uuid[]        NOT NULL DEFAULT '{}',
  rejection_reason        varchar(255),
  carrier                 varchar(50),
  tracking_number         varchar(100),
  -- Snapshot of the pickup address: the address book may change before pickup.
  pickup_address          jsonb,
  pickup_scheduled_at     timestamptz,
  received_at             timestamptz,
  decided_by              uuid          REFERENCES users (id) ON DELETE SET NULL,
  decided_at              timestamptz,
  -- UNIQUE = one refund per return, and it indexes the FK for free.
  refund_id               uuid          UNIQUE REFERENCES refunds (id) ON DELETE RESTRICT,
  -- Client Idempotency-Key of the request: a double-submitted form returns
  -- the same request instead of opening a second one.
  idempotency_key         varchar(255),
  -- The replacement order an approved exchange creates (UNIQUE = one each).
  replacement_order_id    uuid          UNIQUE REFERENCES orders (id) ON DELETE RESTRICT,
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now(),
  CHECK (price_difference IS NULL OR type = 'exchange'),
  CHECK (cardinality(evidence_media_ids) >= 1)
);
CREATE INDEX idx_returns_order_id ON returns (order_id);
CREATE INDEX idx_returns_status ON returns (status);
CREATE INDEX idx_returns_requested_by_profile_id
  ON returns (requested_by_profile_id, created_at DESC);
CREATE INDEX idx_returns_tracking_number ON returns (tracking_number)
  WHERE tracking_number IS NOT NULL;
CREATE INDEX idx_returns_decided_by ON returns (decided_by);
CREATE UNIQUE INDEX one_return_per_idempotency_key
  ON returns (requested_by_profile_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ------------------------------------------------------------ return_items
-- One row per garment: the reason is per item, and an exchange names its
-- replacement variant, so "send the M back, ship me the L" is a single row.
-- Abuse limits enforced here:
--   * request_type copies returns.type so the reason rules below can be
--     CHECKs: exchanges accept only size/variant reasons, replacements only
--     defect reasons.
--   * one exchange per order line, ever (one_exchange_per_order_item) — a
--     rejected or cancelled request still uses the line's one attempt.
--   * the service also refuses lines whose order_items.exchange_policy is not
--     'exchangeable', and replacement orders' lines are written with
--     exchange_policy 'none', so an exchanged item cannot be exchanged again.
CREATE TABLE return_items (
  id                  uuid          PRIMARY KEY,
  return_id           uuid          NOT NULL REFERENCES returns (id) ON DELETE CASCADE,
  order_item_id       uuid          NOT NULL REFERENCES order_items (id) ON DELETE RESTRICT,
  request_type        varchar(12)   NOT NULL
    CHECK (request_type IN ('exchange','replacement')),
  qty                 integer       NOT NULL CHECK (qty > 0),
  reason_code         varchar(30)   NOT NULL
    CHECK (reason_code IN ('size_fit','wrong_variant','damaged','misprint',
                           'wrong_item','quality','other')),
  condition_note      varchar(500),
  disposition         varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (disposition IN ('pending','restock','scrap','return_to_customer',
                           'exchange','replacement')),
  exchange_variant_id uuid          REFERENCES product_variants (id) ON DELETE RESTRICT,
  refund_amount       DECIMAL(12,2) CHECK (refund_amount >= 0),
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  -- UNIQUE doubles as the return_id FK index; qty is how many come back.
  UNIQUE (return_id, order_item_id),
  CHECK (disposition <> 'exchange' OR exchange_variant_id IS NOT NULL),
  CHECK (request_type <> 'exchange' OR reason_code IN ('size_fit','wrong_variant')),
  CHECK (request_type <> 'replacement'
         OR reason_code IN ('damaged','misprint','wrong_item','quality'))
);
CREATE UNIQUE INDEX one_exchange_per_order_item
  ON return_items (order_item_id) WHERE request_type = 'exchange';
-- One defect replacement per order line (the reprint is a new order line).
CREATE UNIQUE INDEX one_replacement_per_order_item
  ON return_items (order_item_id) WHERE request_type = 'replacement';
CREATE INDEX idx_return_items_order_item_id ON return_items (order_item_id);
CREATE INDEX idx_return_items_exchange_variant_id ON return_items (exchange_variant_id);

-- ------------------------------------------------- return_status_history
-- Mirrors order_status_history: written in the same TX as returns.status, so
-- the customer timeline can never skip a step.
CREATE TABLE return_status_history (
  id          uuid         PRIMARY KEY,
  return_id   uuid         NOT NULL REFERENCES returns (id) ON DELETE CASCADE,
  from_status varchar(20),                                    -- NULL on creation
  to_status   varchar(20)  NOT NULL,
  note        varchar(500),
  actor       varchar(50)  NOT NULL,                          -- user id or 'system'
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_rsh_return_id ON return_status_history (return_id, created_at);

-- --------------------------------------------------------------- shipments
-- Customer-facing projection. status mirrors the carrier and the admin
-- shipments page (out_for_delivery / exception included; 009-fulfillment
-- keeps the raw provider state on fulfillment_orders).
CREATE TABLE shipments (
  id                    uuid        PRIMARY KEY,
  order_id              uuid        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  carrier               varchar(50),
  tracking_number       varchar(100),
  status                varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','shipped','in_transit','out_for_delivery',
                      'delivered','exception','returned')),
  pieces                smallint    NOT NULL DEFAULT 1 CHECK (pieces > 0),
  -- Admin "Dispatch Date" reads shipped_at; estimated_delivery_at is the
  -- promised date shown to the customer.
  shipped_at            timestamptz,
  estimated_delivery_at date,
  delivered_at          timestamptz,
  -- Which provider order this parcel belongs to (FK attached in 009).
  fulfillment_order_id  uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_order_id ON shipments (order_id);
CREATE INDEX idx_shipments_fulfillment_order_id ON shipments (fulfillment_order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments (tracking_number);
CREATE INDEX idx_shipments_status ON shipments (status);

-- --------------------------------------------------------- shipment_events
-- The tracking timeline (admin drawer ShipmentItem.events[] and the
-- storefront Order.trackingEvents[]). UNIQUE (shipment, occurred_at, status)
-- stops a repeated carrier/Qikink sync from appending the same scan twice.
CREATE TABLE shipment_events (
  id          uuid         PRIMARY KEY,
  shipment_id uuid         NOT NULL REFERENCES shipments (id) ON DELETE CASCADE,
  status      varchar(20)  NOT NULL
    CHECK (status IN ('pending','shipped','in_transit','out_for_delivery',
                      'delivered','exception','returned')),
  location    varchar(255),
  description varchar(255),
  occurred_at timestamptz  NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (shipment_id, occurred_at, status)
);

-- ------------------------------------ forward foreign key (constraint only)
-- Every column lives in its own CREATE TABLE. Postgres cannot reference a
-- table before it exists, so the one FK that points from an earlier file
-- (002 stock_movements.order_id / order_item_id) is attached here, where
-- orders and order_items exist.
ALTER TABLE stock_movements
  ADD CONSTRAINT stock_movements_order_fk
    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
  ADD CONSTRAINT stock_movements_order_item_fk
    FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE SET NULL;
