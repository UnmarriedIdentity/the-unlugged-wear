-- 004-orders.sql — Orders & money (10 tables)
-- Source of truth: DOC/backend/06-Orders-Payments.md (transcribed 1:1).
-- Money is DECIMAL(12,2); totals are stored, never derived — a financial
-- record must be immutable, not recomputed. Currency: INR (single currency).
-- Order inside the file: discount_codes first (orders references it), then
-- orders and every owned child. 009-partner.sql applies after this file.
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
-- Checkout requires a login: placed_by_user_id is the payer of record and is
-- never NULL (a guest cart must merge into a user before ordering). RESTRICT
-- keeps financial history even if an account is disabled.
CREATE TABLE orders (
  id                uuid          PRIMARY KEY,
  placed_by_user_id uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  for_profile_id    uuid          NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  order_number      varchar(30)   NOT NULL UNIQUE,
  -- Fulfillment axis (independent from payment). Spec vocabulary only.
  status            varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped',
                      'delivered','cancelled','failed','refunded')),
  subtotal          DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  tax               DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
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
  notes             text,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_placed_by ON orders (placed_by_user_id, created_at DESC);
CREATE INDEX idx_orders_for_profile ON orders (for_profile_id, created_at DESC);
CREATE INDEX idx_orders_discount_code_id ON orders (discount_code_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
CREATE UNIQUE INDEX one_order_per_idempotency_key
  ON orders (placed_by_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ------------------------------------------------------------- order_items
-- Immutable purchase record: snapshots beat live catalog data on purpose.
CREATE TABLE order_items (
  id           uuid          PRIMARY KEY,
  order_id     uuid          NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   uuid          NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  variant_id   uuid          REFERENCES product_variants (id) ON DELETE RESTRICT,
  product_name varchar(255)  NOT NULL,
  sku          varchar(64)   NOT NULL,
  unit_price   DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  qty          integer       NOT NULL CHECK (qty > 0),
  line_total   DECIMAL(12,2) NOT NULL CHECK (line_total >= 0),
  -- {"Size":"M","Color":"Onyx"} — frozen variant combination.
  options      jsonb,
  created_at   timestamptz   NOT NULL DEFAULT now()
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
  provider       varchar(30)   NOT NULL DEFAULT 'mock'
    CHECK (provider IN ('mock','razorpay','stripe')),
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
  method     varchar(30)   NOT NULL DEFAULT 'source'
    CHECK (method IN ('source','store_credit')),
  status     varchar(20)   NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','completed','rejected')),
  actor      uuid          NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_refunds_order_id ON refunds (order_id);
CREATE INDEX idx_refunds_payment_id ON refunds (payment_id);
CREATE INDEX idx_refunds_actor ON refunds (actor);
CREATE INDEX idx_refunds_status ON refunds (status);
-- Concurrency guard: no double-processing the same order.
CREATE UNIQUE INDEX one_open_refund ON refunds (order_id)
  WHERE status = 'processing';

-- ----------------------------------------------------------------- returns
-- RMA stage machine. Restock writes stock_movements with reason 'return'.
CREATE TABLE returns (
  id              uuid         PRIMARY KEY,
  order_id        uuid         NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  stage           varchar(20)  NOT NULL DEFAULT 'in_transit'
    CHECK (stage IN ('in_transit','inspected','restocked','disputed')),
  carrier         varchar(50),
  tracking_number varchar(100),
  reason          varchar(255) NOT NULL,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_returns_order_id ON returns (order_id);
CREATE INDEX idx_returns_stage ON returns (stage);

-- ------------------------------------------------------------ return_items
CREATE TABLE return_items (
  id            uuid        PRIMARY KEY,
  return_id     uuid        NOT NULL REFERENCES returns (id) ON DELETE CASCADE,
  order_item_id uuid        NOT NULL REFERENCES order_items (id) ON DELETE RESTRICT,
  qty           integer     NOT NULL CHECK (qty > 0),
  disposition   varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (disposition IN ('pending','restock','scrap','exchange')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_return_items_return_id ON return_items (return_id);
CREATE INDEX idx_return_items_order_item_id ON return_items (order_item_id);

-- --------------------------------------------------------------- shipments
-- Customer-facing projection. status mirrors the carrier and the admin
-- shipments page (out_for_delivery / exception included; 009-partner keeps
-- the raw Qikink state on partner_orders).
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
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipments_order_id ON shipments (order_id);
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

-- ------------------------------------------- deferred FK, now satisfiable
-- 002-catalog.sql is applied before this file, so stock_movements.order_id
-- could not be declared there. This is still a from-scratch build (no
-- database exists), not a forward migration of a live schema.
ALTER TABLE stock_movements
  ADD COLUMN order_id uuid REFERENCES orders (id) ON DELETE SET NULL;
CREATE INDEX idx_stock_movements_order_id ON stock_movements (order_id)
  WHERE order_id IS NOT NULL;
