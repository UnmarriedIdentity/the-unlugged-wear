-- 009-fulfillment.sql — Integration providers + fulfilment (7 tables)
-- Source of truth: DOC/backend/16-Fulfillment-Providers.md.
-- APPLIES AFTER 004-orders.sql (orders, order_items, shipments, returns),
-- 002-catalog.sql (product_variants) and 006-cms.sql (media).
--
-- Design rule: no table here is Qikink-shaped. Qikink is one row in
-- integration_providers; its quirks live in jsonb payloads and in the
-- adapter code (server/integrations/fulfillment/qikink). Adding another
-- print-on-demand partner, courier or payment gateway = one provider row +
-- one adapter; no schema change.
-- We hold no warehouse: order fulfilment status mirrors provider state.

-- --------------------------------------------------- integration_providers
-- Registry of every external service: payment gateways, fulfilment
-- partners, couriers, email/SMS senders. Secrets never live here (env only).
CREATE TABLE integration_providers (
  id           uuid         PRIMARY KEY,
  slug         varchar(30)  NOT NULL UNIQUE,          -- 'qikink', 'razorpay'
  name         varchar(100) NOT NULL,
  category     varchar(20)  NOT NULL
    CHECK (category IN ('payment','fulfillment','shipping','email','sms','other')),
  environment  varchar(10)  NOT NULL DEFAULT 'sandbox'
    CHECK (environment IN ('sandbox','live')),
  is_active    boolean      NOT NULL DEFAULT false,
  -- What the adapter can do, read by the services before calling it:
  -- {"cod":true,"cancel":true,"webhooks":false,"tracking":"poll",
  --  "claimWindowDays":7,"rtoStorageDays":100}
  capabilities jsonb        NOT NULL DEFAULT '{}',
  -- Non-secret configuration (base URLs, default print type, pickup id).
  settings     jsonb        NOT NULL DEFAULT '{}',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_providers_category ON integration_providers (category, is_active);

-- Forward foreign keys (constraint only — the columns are declared in their
-- own CREATE TABLE in 002/004/005): provider slugs become real FKs now that
-- the registry exists.
ALTER TABLE products
  ADD CONSTRAINT products_partner_provider_fk
    FOREIGN KEY (partner_provider) REFERENCES integration_providers (slug)
    ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE payments
  ADD CONSTRAINT payments_provider_fk
    FOREIGN KEY (provider) REFERENCES integration_providers (slug)
    ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE webhook_events
  ADD CONSTRAINT webhook_events_provider_fk
    FOREIGN KEY (provider) REFERENCES integration_providers (slug)
    ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX idx_payments_provider ON payments (provider);

-- ----------------------------------------------- provider_product_mappings
-- How one of our variants is ordered from one provider. Qikink needs a store
-- SKU, a print type and design/placement data; another partner needs other
-- fields — they all go in provider_payload, validated by the adapter.
CREATE TABLE provider_product_mappings (
  id               uuid         PRIMARY KEY,
  provider_id      uuid         NOT NULL REFERENCES integration_providers (id) ON DELETE RESTRICT,
  variant_id       uuid         NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  provider_sku     varchar(100) NOT NULL,
  -- e.g. Qikink {"printTypeId":1,"designs":[{"placementSku":"fr",
  --   "designCode":"TUW-ONYX-01","designLink":"https://…","mockupLink":"https://…"}]}
  provider_payload jsonb        NOT NULL DEFAULT '{}',
  -- What the provider charges us per unit (product + print), for margin
  -- reports. Shipping is charged per order on fulfillment_orders.
  unit_cost        DECIMAL(12,2) CHECK (unit_cost >= 0),
  is_active        boolean      NOT NULL DEFAULT true,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (provider_id, variant_id)
);
CREATE INDEX idx_ppm_variant_id ON provider_product_mappings (variant_id);
CREATE INDEX idx_ppm_provider_sku ON provider_product_mappings (provider_id, provider_sku);

-- ------------------------------------------------ provider_cod_remittances
-- Cash-on-delivery money the provider collected and paid back to us (Qikink
-- pays COD to the wallet or bank after delivery, per transfer id).
CREATE TABLE provider_cod_remittances (
  id            uuid          PRIMARY KEY,
  provider_id   uuid          NOT NULL REFERENCES integration_providers (id) ON DELETE RESTRICT,
  transfer_ref  varchar(100)  NOT NULL,              -- provider Transfer ID / UTR
  amount        DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  fees          DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
  remitted_to   varchar(10)   NOT NULL CHECK (remitted_to IN ('wallet','bank')),
  remitted_at   timestamptz   NOT NULL,
  raw_payload   jsonb         NOT NULL DEFAULT '{}',
  created_at    timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (provider_id, transfer_ref)
);
CREATE INDEX idx_cod_remittances_remitted_at ON provider_cod_remittances (remitted_at);

-- ----------------------------------------------------- fulfillment_orders
-- One row per order sent to one provider. An order may have several rows:
-- split across providers, a re-ship after RTO, or the replacement order an
-- exchange/replacement creates (which is its own orders row).
-- status is our normalized vocabulary; provider_status is the raw string
-- (no CHECK — each provider has its own words, mapped in the adapter).
CREATE TABLE fulfillment_orders (
  id                uuid          PRIMARY KEY,
  order_id          uuid          NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  provider_id       uuid          NOT NULL REFERENCES integration_providers (id) ON DELETE RESTRICT,
  -- Our reference sent to the provider (unique per provider, never reused).
  external_ref      varchar(60)   NOT NULL,
  provider_order_id varchar(100),
  reason            varchar(12)   NOT NULL DEFAULT 'initial'
    CHECK (reason IN ('initial','reship')),
  status            varchar(20)   NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','submitted','on_hold','in_production','shipped',
                      'delivery_exception','delivered','rto_initiated','returned',
                      'cancelled','failed')),
  provider_status   varchar(50),
  gateway           varchar(10)   NOT NULL CHECK (gateway IN ('prepaid','cod')),
  cod_amount        DECIMAL(12,2) CHECK (cod_amount >= 0),
  -- What the provider charged us (product + print + shipping + COD fee).
  provider_cost     DECIMAL(12,2) CHECK (provider_cost >= 0),
  courier           varchar(100),
  awb               varchar(100),
  submitted_at      timestamptz,
  delivered_at      timestamptz,
  -- RTO parcels sit at the provider for a limited time (Qikink: 100 days),
  -- after which they are lost; re-ship before this date.
  rto_storage_until date,
  cod_remittance_id uuid          REFERENCES provider_cod_remittances (id) ON DELETE SET NULL,
  submit_attempts   smallint      NOT NULL DEFAULT 0 CHECK (submit_attempts >= 0),
  last_error        text,
  raw_payload       jsonb         NOT NULL DEFAULT '{}',
  synced_at         timestamptz,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (provider_id, external_ref),
  CHECK (gateway = 'cod' OR cod_amount IS NULL)
);
CREATE INDEX idx_fulfillment_orders_order_id ON fulfillment_orders (order_id);
CREATE UNIQUE INDEX one_provider_order_id
  ON fulfillment_orders (provider_id, provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE INDEX idx_fulfillment_orders_awb ON fulfillment_orders (awb) WHERE awb IS NOT NULL;
-- The poll worker: open rows, stalest first.
CREATE INDEX idx_fulfillment_orders_sync ON fulfillment_orders (status, synced_at)
  WHERE status NOT IN ('delivered','cancelled','returned','failed');
CREATE INDEX idx_fulfillment_orders_cod_remittance ON fulfillment_orders (cod_remittance_id)
  WHERE cod_remittance_id IS NOT NULL;

-- shipments.fulfillment_order_id is declared in 004; attach its FK now.
ALTER TABLE shipments
  ADD CONSTRAINT shipments_fulfillment_order_fk
    FOREIGN KEY (fulfillment_order_id) REFERENCES fulfillment_orders (id) ON DELETE SET NULL;

-- ------------------------------------------------ fulfillment_order_items
-- Which order lines (and how many) went to which provider order.
CREATE TABLE fulfillment_order_items (
  id                   uuid         PRIMARY KEY,
  fulfillment_order_id uuid         NOT NULL REFERENCES fulfillment_orders (id) ON DELETE CASCADE,
  order_item_id        uuid         NOT NULL REFERENCES order_items (id) ON DELETE RESTRICT,
  qty                  integer      NOT NULL CHECK (qty > 0),
  -- Snapshot of what was sent (the mapping may change later).
  provider_sku         varchar(100) NOT NULL,
  provider_payload     jsonb        NOT NULL DEFAULT '{}',
  UNIQUE (fulfillment_order_id, order_item_id)
);
CREATE INDEX idx_foi_order_item_id ON fulfillment_order_items (order_item_id);

-- ---------------------------------------------------- provider_wallet_ledger
-- Prepaid provider balance (Qikink: Rs.1 = 1 credit). Every recharge, order
-- debit, cancellation credit, claim credit and COD-to-wallet remittance.
CREATE TABLE provider_wallet_ledger (
  id                   uuid          PRIMARY KEY,
  provider_id          uuid          NOT NULL REFERENCES integration_providers (id) ON DELETE RESTRICT,
  kind                 varchar(20)   NOT NULL
    CHECK (kind IN ('recharge','order_debit','cancel_credit','claim_credit',
                    'cod_remittance','withdrawal','adjustment')),
  direction            varchar(6)    NOT NULL CHECK (direction IN ('debit','credit')),
  amount               DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance_after        DECIMAL(12,2),
  fulfillment_order_id uuid          REFERENCES fulfillment_orders (id) ON DELETE SET NULL,
  cod_remittance_id    uuid          REFERENCES provider_cod_remittances (id) ON DELETE SET NULL,
  external_ref         varchar(100),                 -- provider txn id
  note                 varchar(255),
  actor                varchar(50)   NOT NULL,       -- user id or 'system'
  created_at           timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_pwl_provider_time ON provider_wallet_ledger (provider_id, created_at);
CREATE INDEX idx_pwl_fulfillment_order_id ON provider_wallet_ledger (fulfillment_order_id)
  WHERE fulfillment_order_id IS NOT NULL;
CREATE INDEX idx_pwl_cod_remittance_id ON provider_wallet_ledger (cod_remittance_id)
  WHERE cod_remittance_id IS NOT NULL;
CREATE UNIQUE INDEX one_wallet_entry_per_external_ref
  ON provider_wallet_ledger (provider_id, external_ref) WHERE external_ref IS NOT NULL;

-- ------------------------------------------------------- fulfillment_claims
-- A defect / damage / wrong-item / lost-parcel claim raised with the
-- provider (Qikink: within 7 days of delivery, unboxing video + photos).
-- Usually opened from a customer 'replacement' request (return_id).
CREATE TABLE fulfillment_claims (
  id                   uuid         PRIMARY KEY,
  fulfillment_order_id uuid         NOT NULL REFERENCES fulfillment_orders (id) ON DELETE RESTRICT,
  return_id            uuid         REFERENCES returns (id) ON DELETE SET NULL,
  type                 varchar(20)  NOT NULL
    CHECK (type IN ('damaged','misprint','wrong_item','size_discrepancy','lost_in_transit')),
  status               varchar(20)  NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','rejected','resolved')),
  resolution           varchar(20)
    CHECK (resolution IN ('reprint','wallet_credit','refund','none')),
  -- Claim must be raised before this moment (delivered_at + window).
  claim_deadline       timestamptz,
  -- media ids of the unboxing video / photos (006 media rows).
  evidence_media_ids   uuid[]       NOT NULL DEFAULT '{}',
  provider_ticket_ref  varchar(100),
  customer_note        varchar(1000),
  staff_note           varchar(1000),
  submitted_at         timestamptz,
  resolved_at          timestamptz,
  created_by           uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('approved','resolved') OR resolution IS NOT NULL)
);
CREATE INDEX idx_claims_fulfillment_order_id ON fulfillment_claims (fulfillment_order_id);
CREATE INDEX idx_claims_return_id ON fulfillment_claims (return_id) WHERE return_id IS NOT NULL;
CREATE INDEX idx_claims_open ON fulfillment_claims (status, claim_deadline)
  WHERE status IN ('draft','submitted');
CREATE INDEX idx_claims_created_by ON fulfillment_claims (created_by);
