-- 005-platform.sql — Platform: imports, email, idempotency (5 tables)
-- Sources of truth: DOC/backend/07-Import-Jobs.md (import_jobs),
-- DOC/backend/08-Notify.md (email_logs, notification_templates),
-- DOC/backend/21-Idempotency.md (idempotency_keys, webhook_events).
-- Imports create DRAFTS, never live products — a human publishes.
-- Idempotency is a schema concern here: duplicate HTTP retries and duplicate
-- provider webhook deliveries are rejected by constraints, not by handler code.

-- ------------------------------------------------------------ import_jobs
CREATE TABLE import_jobs (
  id            uuid         PRIMARY KEY,
  source        varchar(20)  NOT NULL DEFAULT 'csv'
    CHECK (source IN ('csv','json','shopify','odoo')),
  file_key      varchar(500),
  status        varchar(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','partial')),
  total_rows    integer      NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  success_count integer      NOT NULL DEFAULT 0 CHECK (success_count >= 0),
  failed_count  integer      NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  -- [{row, field, message}] — the admin report reads this, not server logs.
  errors        jsonb        NOT NULL DEFAULT '[]',
  created_by    uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_jobs_status ON import_jobs (status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs (created_at);
CREATE INDEX idx_import_jobs_created_by ON import_jobs (created_by);

-- -------------------------------------------------------------- email_logs
-- Rows before attempts: render -> write 'queued' -> send -> update. Failed
-- rows are picked up by the status-index sweep (retries live in the DB).
CREATE TABLE email_logs (
  id         uuid         PRIMARY KEY,
  recipient  varchar(255) NOT NULL,
  subject    varchar(255),
  template   varchar(100),
  status     varchar(20)  NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sent','failed')),
  error      text,
  -- Exactly-once producer guard: 'order.confirmation:<order_id>',
  -- 'cart.abandoned:<cart_id>', 'auth.reset:<token_id>'.
  dedupe_key varchar(255),
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_logs_status ON email_logs (status);
CREATE INDEX idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX idx_email_logs_created_at ON email_logs (created_at);
CREATE UNIQUE INDEX one_email_per_dedupe_key ON email_logs (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- --------------------------------------------------- notification_templates
CREATE TABLE notification_templates (
  id         uuid         PRIMARY KEY,
  key        varchar(100) NOT NULL UNIQUE,
  subject    varchar(255) NOT NULL,
  body       text         NOT NULL,
  -- Declared {{variable}} list — powers the admin template editor later.
  variables  jsonb        NOT NULL DEFAULT '[]',
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------- idempotency_keys
-- One row per mutating request that carried an `Idempotency-Key` header.
-- UNIQUE (scope, key) is THE dedupe guarantee: the retry hits the same row
-- and the stored response is replayed verbatim instead of re-executing.
CREATE TABLE idempotency_keys (
  id             uuid         PRIMARY KEY,
  -- checkout | payment.capture | refund.create | return.create | cart.merge
  -- import.apply | support.create | household.invite | auth.signup
  -- auth.invite | auth.reset | cms.publish
  scope          varchar(60)  NOT NULL,
  key            varchar(255) NOT NULL,
  user_id        uuid         REFERENCES users (id) ON DELETE SET NULL,
  -- sha256(method + path + canonical body): a reused key with a different
  -- payload is a client bug, not a retry (422).
  request_hash   char(64)     NOT NULL,
  status         varchar(20)  NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','failed')),
  response_code  smallint,
  response_body  jsonb,
  resource_table varchar(63),
  resource_id    uuid,
  -- In-flight lease: a concurrent duplicate is refused while it is held.
  locked_until   timestamptz,
  expires_at     timestamptz  NOT NULL,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  completed_at   timestamptz,
  UNIQUE (scope, key)
);
CREATE INDEX idx_idempotency_keys_user_id ON idempotency_keys (user_id);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);
CREATE INDEX idx_idempotency_keys_status ON idempotency_keys (status)
  WHERE status = 'in_progress';

-- ---------------------------------------------------------- webhook_events
-- Razorpay / Stripe / Qikink / Shiprocket retry until they get a 2xx and
-- replay after outages. The provider's own event id is the dedupe key, so
-- "payment captured applied twice" is structurally impossible. The row is
-- also the replay log and the failed-delivery queue.
CREATE TABLE webhook_events (
  id                 uuid        PRIMARY KEY,
  provider           varchar(30) NOT NULL
    CHECK (provider IN ('razorpay','stripe','qikink','shiprocket')),
  provider_event_id  varchar(150) NOT NULL,
  event_type         varchar(100) NOT NULL,
  signature_verified boolean     NOT NULL DEFAULT false,
  payload            jsonb       NOT NULL,
  status             varchar(20) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processed','ignored','failed')),
  attempts           smallint    NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  error              text,
  received_at        timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz,
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX idx_webhook_events_status ON webhook_events (status, received_at);
CREATE INDEX idx_webhook_events_type ON webhook_events (provider, event_type);
