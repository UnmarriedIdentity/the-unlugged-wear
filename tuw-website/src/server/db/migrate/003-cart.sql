-- 003-cart.sql — Cart & wishlist (4 tables)
-- Source of truth: DOC/backend/05-Cart-Wishlist.md (transcribed 1:1).
-- A guest may hold a cart (`session_id`, signed cookie); CHECKOUT requires a
-- login, so orders never carry a guest identity. Merge rule: guest lines fold
-- into the user's active cart on login and the guest cart flips to
-- `converted` (never deleted — abandonment math stays honest).
-- Snapshot doctrine: cart lines freeze price/name/image at add time.

-- ------------------------------------------------------------------- carts
CREATE TABLE carts (
  id               uuid         PRIMARY KEY,
  user_id          uuid         REFERENCES users (id) ON DELETE CASCADE,
  session_id       varchar(64),
  for_profile_id   uuid         REFERENCES profiles (id) ON DELETE SET NULL,
  status           varchar(20)  NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','abandoned','converted')),
  last_activity_at timestamptz  NOT NULL DEFAULT now(),
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now(),
  -- A cart always belongs to someone.
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);
CREATE INDEX idx_carts_user_id ON carts (user_id);
CREATE INDEX idx_carts_session_id ON carts (session_id);
CREATE INDEX idx_carts_for_profile_id ON carts (for_profile_id);
-- Merge target: at most one active cart per user (guests have none).
CREATE UNIQUE INDEX one_active_cart_per_user ON carts (user_id)
  WHERE user_id IS NOT NULL AND status = 'active';
-- Abandonment detector scan — narrow by construction.
CREATE INDEX idx_carts_abandoned ON carts (status, last_activity_at)
  WHERE status = 'active';

-- -------------------------------------------------------------- cart_items
-- Snapshots, not joins: the cart re-read is one indexed scan, no cross-table
-- joins (P99 <100ms at 200 lines). Snapshots refresh only on explicit re-add.
CREATE TABLE cart_items (
  id            uuid          PRIMARY KEY,
  cart_id       uuid          NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  product_id    uuid          NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  variant_id    uuid          REFERENCES product_variants (id) ON DELETE RESTRICT,
  qty           integer       NOT NULL CHECK (qty > 0),
  unit_price    DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
  product_name  varchar(255)  NOT NULL,
  product_slug  varchar(280),
  image_url     varchar(2048),
  variant_label varchar(150),
  added_at      timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_cart_items_product_id ON cart_items (product_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items (variant_id);
-- No duplicate lines: re-adding the same product+variant merges qty instead
-- of inserting a second row (NULL variant counts as equal).
CREATE UNIQUE INDEX cart_items_cart_product_unique
  ON cart_items (cart_id, product_id, variant_id) NULLS NOT DISTINCT;

-- --------------------------------------------------------------- wishlists
-- One list per user, by design. No admin UI: wishlists inform nothing
-- operational and surface only in recommendations later.
CREATE TABLE wishlists (
  id         uuid        PRIMARY KEY,
  user_id    uuid        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------------- wishlist_items
CREATE TABLE wishlist_items (
  id          uuid        PRIMARY KEY,
  wishlist_id uuid        NOT NULL REFERENCES wishlists (id) ON DELETE CASCADE,
  product_id  uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items (product_id);
CREATE UNIQUE INDEX one_wishlist_entry_per_product
  ON wishlist_items (wishlist_id, product_id);
