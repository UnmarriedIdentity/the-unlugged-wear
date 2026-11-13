-- 013-analytics.sql — Analytics (7 tables)
-- Source of truth: DOC/backend/10-Analytics.md (transcribed 1:1).
-- Raw events are transient evidence, rollups are the record: four event
-- tables are RANGE-partitioned on `ts` and dropped after 30 days (90 for
-- search terms), while daily_stats is never partitioned and never dropped.
-- Every event table carries a `_default` partition so inserts work on day
-- one; monthly partitions attach later and the default drains into them.
-- Idempotency: the PK is (id, ts) where `id` is the client-generated UUIDv7
-- and `ts` is stamped once at creation, so a retried or offline-flushed
-- batch re-inserts with ON CONFLICT (id, ts) DO NOTHING and cannot double
-- count. `sessions` is named analytics_sessions — `sessions` is a reserved
-- word in most session middleware and the name collided with auth tables.

-- -------------------------------------------------------------- page_views
CREATE TABLE page_views (
  id          uuid         NOT NULL,
  session_id  varchar(64)  NOT NULL,
  user_id     uuid         REFERENCES users (id) ON DELETE SET NULL,
  page        varchar(500) NOT NULL,
  referrer    varchar(2048),
  -- {ua, mobile}
  device      jsonb,
  duration_ms integer      CHECK (duration_ms >= 0),
  exited      boolean      NOT NULL DEFAULT false,
  event_kind  varchar(20)  NOT NULL DEFAULT 'pageview'
    CHECK (event_kind IN ('pageview','heartbeat')),
  ts          timestamptz  NOT NULL DEFAULT now(),
  -- Partition key must be part of the PK on a partitioned table.
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);
CREATE TABLE page_views_default PARTITION OF page_views DEFAULT;
-- Session timeline (first index) + popular pages (second).
CREATE INDEX idx_page_views_session_ts ON page_views (session_id, ts);
CREATE INDEX idx_page_views_page_ts ON page_views (page, ts DESC);
CREATE INDEX idx_page_views_user_id ON page_views (user_id)
  WHERE user_id IS NOT NULL;

-- ------------------------------------------------------ analytics_sessions
-- One row per browsing session, upserted by session_id on every heartbeat.
-- Plain table (90-day retention, no partitioning) because funnels read it
-- whole rather than by time range.
CREATE TABLE analytics_sessions (
  id           uuid         PRIMARY KEY,
  session_id   varchar(64)  NOT NULL UNIQUE,
  user_id      uuid         REFERENCES users (id) ON DELETE SET NULL,
  started_at   timestamptz  NOT NULL DEFAULT now(),
  last_seen_at timestamptz  NOT NULL DEFAULT now(),
  -- Embedded path: funnels need no join.
  pages        varchar(500)[] NOT NULL DEFAULT '{}',
  exit_page    varchar(500),
  ended_at     timestamptz,
  device       jsonb
);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions (user_id);
CREATE INDEX idx_analytics_sessions_last_seen_at
  ON analytics_sessions (last_seen_at);

-- ------------------------------------------------------------- cart_events
CREATE TABLE cart_events (
  id         uuid        NOT NULL,
  cart_id    uuid        NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES users (id) ON DELETE SET NULL,
  event_type varchar(20) NOT NULL
    CHECK (event_type IN ('item_added','item_removed','qty_changed','cart_viewed')),
  -- {productId, variantId, qty}
  payload    jsonb       NOT NULL DEFAULT '{}',
  ts         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);
CREATE TABLE cart_events_default PARTITION OF cart_events DEFAULT;
CREATE INDEX idx_cart_events_cart_ts ON cart_events (cart_id, ts);
CREATE INDEX idx_cart_events_user_ts ON cart_events (user_id, ts)
  WHERE user_id IS NOT NULL;

-- --------------------------------------------------------- abandoned_carts
-- Written once per cart by the idle >24h detector; `reminded_at` makes the
-- reminder exactly-once. Retention 1yr — recovery math needs the history.
CREATE TABLE abandoned_carts (
  id           uuid          PRIMARY KEY,
  cart_id      uuid          NOT NULL UNIQUE REFERENCES carts (id) ON DELETE CASCADE,
  user_id      uuid          REFERENCES users (id) ON DELETE SET NULL,
  -- Reminder target captured for guests who typed it before leaving.
  email        varchar(255),
  items        jsonb         NOT NULL DEFAULT '[]',
  cart_total   DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cart_total >= 0),
  abandoned_at timestamptz   NOT NULL,
  reminded_at  timestamptz,
  status       varchar(20)   NOT NULL DEFAULT 'detected'
    CHECK (status IN ('detected','reminded','converted','recovered')),
  created_at   timestamptz   NOT NULL DEFAULT now()
);
-- Detector + admin list.
CREATE INDEX idx_abandoned_carts_status_time
  ON abandoned_carts (status, abandoned_at DESC);
CREATE INDEX idx_abandoned_carts_user_id ON abandoned_carts (user_id);

-- ------------------------------------------------------------- daily_stats
-- The permanent record: one row per day, forever. This is what survives
-- when raw events age out, so a fresh rollup run must UPSERT on `date`.
CREATE TABLE daily_stats (
  id              uuid          PRIMARY KEY,
  date            date          NOT NULL UNIQUE,
  page_views      integer       NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  unique_visitors integer       NOT NULL DEFAULT 0 CHECK (unique_visitors >= 0),
  -- {page: count} rollup of exit pages.
  exits_by_page   jsonb         NOT NULL DEFAULT '{}',
  conversions     integer       NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue         DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------- product_views
-- Explicit FK, never parsed from the URL: routing must not shape analytics.
CREATE TABLE product_views (
  id         uuid        NOT NULL,
  product_id uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  session_id varchar(64) NOT NULL,
  user_id    uuid        REFERENCES users (id) ON DELETE SET NULL,
  ts         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);
CREATE TABLE product_views_default PARTITION OF product_views DEFAULT;
CREATE INDEX idx_product_views_product_ts ON product_views (product_id, ts DESC);
CREATE INDEX idx_product_views_session_ts ON product_views (session_id, ts);

-- ------------------------------------------------------------ search_terms
-- Demand intelligence. `hits` is the result count at query time — unknowable
-- later, which is exactly why it is stored here and not derived.
CREATE TABLE search_terms (
  id              uuid         NOT NULL,
  term            varchar(255) NOT NULL,
  hits            integer      NOT NULL DEFAULT 0 CHECK (hits >= 0),
  results_clicked integer      NOT NULL DEFAULT 0 CHECK (results_clicked >= 0),
  session_id      varchar(64),
  ts              timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);
CREATE TABLE search_terms_default PARTITION OF search_terms DEFAULT;
CREATE INDEX idx_search_terms_term_ts ON search_terms (term, ts DESC);
-- Zero-result leaderboard: the query that tells buying what to stock next.
CREATE INDEX idx_search_terms_zero_hits ON search_terms (hits, ts DESC)
  WHERE hits = 0;

-- Partitioning and retention are operational, not types:
--   monthly: CREATE TABLE page_views_2026_11 PARTITION OF page_views
--              FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
--   retention: DROP TABLE page_views_2026_08;   -- raw events age out
--   daily_stats and abandoned_carts are never dropped.
