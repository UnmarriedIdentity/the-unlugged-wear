-- 009-partner.sql — Qikink partner seam (2 tables)
-- Source of truth: DOC/backend/16-Partner-Qikink.md.
-- APPLIES AFTER 004-orders.sql (references orders(id)); 003-008 land first.
-- No warehouse: fulfillment statuses mirror partner state (see file 16).

-- ----------------------------------------------------------- partner_orders
-- Sync seam: our order <-> Qikink order. One partner order per order.
CREATE TABLE partner_orders (
  id              uuid         PRIMARY KEY,
  order_id        uuid         NOT NULL UNIQUE REFERENCES orders (id) ON DELETE RESTRICT,
  qikink_order_id varchar(100),
  awb             varchar(100),
  courier         varchar(100),
  partner_status  varchar(50),
  raw_payload     jsonb        NOT NULL DEFAULT '{}',
  synced_at       timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_orders_qikink_id ON partner_orders (qikink_order_id);
CREATE INDEX idx_partner_orders_awb ON partner_orders (awb);
CREATE INDEX idx_partner_orders_synced_at ON partner_orders (synced_at);

-- ----------------------------------------------------- partner_wallet_ledger
-- Real-money trail: Rs.1 = 1 credit. Every debit/refund per order lands here.
CREATE TABLE partner_wallet_ledger (
  id         uuid          PRIMARY KEY,
  order_id   uuid          REFERENCES orders (id) ON DELETE SET NULL,
  direction  varchar(10)   NOT NULL CHECK (direction IN ('debit','credit')),
  credits    DECIMAL(12,2) NOT NULL CHECK (credits > 0),
  reason     varchar(100)  NOT NULL,
  balance_after DECIMAL(12,2),
  created_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_partner_wallet_order_id ON partner_wallet_ledger (order_id);
CREATE INDEX idx_partner_wallet_created_at ON partner_wallet_ledger (created_at);
