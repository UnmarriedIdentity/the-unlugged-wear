-- 014-operations.sql — Support & notifications (3 tables)
-- Source of truth: DOC/backend/15-Operations.md (transcribed 1:1).
-- Human-facing ops: threads staff actually answer, bells customers actually
-- read. Email delivery is a different lifecycle and stays in email_logs
-- (005-platform.sql) — there is no sms_logs table: nothing in the product
-- sends SMS yet, so the provider decision is deliberately not pre-made.

-- --------------------------------------------------------- support_tickets
-- One row per thread. updated_at is last activity (the queue's sort key).
CREATE TABLE support_tickets (
  id          uuid         PRIMARY KEY,
  user_id     uuid         REFERENCES users (id) ON DELETE SET NULL,
  -- A non-logged-in writer has no row to point at: one honest exception,
  -- recorded as columns rather than a fake user.
  guest_name  varchar(150),
  guest_email varchar(255),
  subject     varchar(255) NOT NULL,
  priority    varchar(20)  NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high','medium','low')),
  status      varchar(20)  NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending','resolved')),
  -- NULL = unassigned pool.
  assigned_to uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  -- Rule enforced, not documented: a guest thread must carry a reply target.
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL))
);
-- The queue itself.
CREATE INDEX idx_support_tickets_status_time ON support_tickets (status, updated_at DESC);
CREATE INDEX idx_support_tickets_assignee ON support_tickets (assigned_to);
CREATE INDEX idx_support_tickets_user_id ON support_tickets (user_id);
CREATE INDEX idx_support_tickets_guest_email ON support_tickets (guest_email)
  WHERE guest_email IS NOT NULL;

-- --------------------------------------------------------- support_messages
-- The embedded array from the mock dies here: messages are rows, so two
-- agents can answer the same thread without a lost update.
CREATE TABLE support_messages (
  id         uuid        PRIMARY KEY,
  ticket_id  uuid        NOT NULL REFERENCES support_tickets (id) ON DELETE CASCADE,
  sender     varchar(20) NOT NULL CHECK (sender IN ('customer','staff')),
  -- Which agent answered; customer rows stay NULL.
  staff_id   uuid        REFERENCES users (id) ON DELETE SET NULL,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- A retried or double-clicked send cannot post the same message twice.
  UNIQUE (ticket_id, created_at, sender)
);
CREATE INDEX idx_support_messages_ticket_id ON support_messages (ticket_id, created_at);
CREATE INDEX idx_support_messages_staff_id ON support_messages (staff_id)
  WHERE staff_id IS NOT NULL;

-- ------------------------------------------------------------ notifications
-- In-app bell. email_logs never shares this table: a bell read and a mail
-- delivery are different lifecycles with different failure modes.
-- `kind` carries the admin bell's categories (orders / inventory / payment /
-- system / marketing) plus `cart` (abandonment) and `refund` (money back).
CREATE TABLE notifications (
  id         uuid         PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind       varchar(20)  NOT NULL
    CHECK (kind IN ('order','cart','inventory','payment','system','marketing','refund')),
  title      varchar(150) NOT NULL,
  body       text,
  -- Deep link (/account/orders/...); nullable, never a broken window.
  link       varchar(500),
  -- NULL = unread. Never a boolean next to a timestamp.
  read_at    timestamptz,
  -- Exactly-once producer guard: 'order.shipped:<order_id>',
  -- 'cart.abandoned:<cart_id>'. A retried job cannot ring twice.
  dedupe_key varchar(255),
  created_at timestamptz  NOT NULL DEFAULT now()
);
-- Unread badge count = one narrow index read.
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_at);
CREATE INDEX idx_notifications_kind ON notifications (kind);
CREATE UNIQUE INDEX one_notification_per_dedupe_key
  ON notifications (dedupe_key) WHERE dedupe_key IS NOT NULL;
