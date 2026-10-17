-- 012-styling.sql — Styling / Complete the Look module (7 tables)
-- Source of truth: DOC/backend/19-Styling-Recommendations.md (transcribed 1:1).
-- Module-owned: styling reads core (categories, products, attribute
-- definitions/values, users); nothing in core reads styling. Dropping these
-- 7 tables removes the module completely — zero edits to any other table.
-- APPLIES AFTER 002-catalog.sql + 010-attr-library.sql.
-- Build order: last — ships after the core e-commerce app (file 19).

-- ------------------------------------------------------------ styling_slots
-- The outfit roles: top, bottom, outerwear, headwear, footwear, accessory.
CREATE TABLE styling_slots (
  id         uuid        PRIMARY KEY,
  slug       varchar(30) NOT NULL UNIQUE,
  name       varchar(60) NOT NULL,
  sort_order integer     NOT NULL DEFAULT 0,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------- styling_category_slots
-- Category -> slot map. Resolution walks parent_id to the nearest mapped
-- ancestor (app-side); unmapped branches are simply not suggestible.
CREATE TABLE styling_category_slots (
  category_id uuid        NOT NULL PRIMARY KEY REFERENCES categories (id) ON DELETE CASCADE,
  slot_id     uuid        NOT NULL REFERENCES styling_slots (id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_styling_category_slots_slot_id
  ON styling_category_slots (slot_id);

-- ----------------------------------------------------- styling_slot_rules
-- The day-zero complement matrix: which roles pair with which, weighted.
CREATE TABLE styling_slot_rules (
  id             uuid        PRIMARY KEY,
  source_slot_id uuid        NOT NULL REFERENCES styling_slots (id) ON DELETE CASCADE,
  target_slot_id uuid        NOT NULL REFERENCES styling_slots (id) ON DELETE CASCADE,
  weight         integer     NOT NULL DEFAULT 10 CHECK (weight BETWEEN 0 AND 100),
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_slot_id, target_slot_id),
  CHECK (source_slot_id <> target_slot_id)
);
CREATE INDEX idx_styling_slot_rules_target_slot_id
  ON styling_slot_rules (target_slot_id);

-- --------------------------------------------------- styling_value_affinity
-- Generic value<->value affinity, scoped by definition: style harmony
-- pairs + manual color overrides. Negative score = actively avoid.
-- Pairs stored sorted; reads match either order (symmetric by design).
CREATE TABLE styling_value_affinity (
  id            uuid        PRIMARY KEY,
  definition_id uuid        NOT NULL REFERENCES attribute_definitions (id) ON DELETE CASCADE,
  value_a_id    uuid        NOT NULL REFERENCES attribute_values (id) ON DELETE CASCADE,
  value_b_id    uuid        NOT NULL REFERENCES attribute_values (id) ON DELETE CASCADE,
  score         integer     NOT NULL CHECK (score BETWEEN -100 AND 100),
  note          varchar(255),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (definition_id, value_a_id, value_b_id),
  CHECK (value_a_id <> value_b_id)
);
CREATE INDEX idx_styling_value_affinity_value_a_id
  ON styling_value_affinity (value_a_id);
CREATE INDEX idx_styling_value_affinity_value_b_id
  ON styling_value_affinity (value_b_id);

-- ------------------------------------------------------- styling_overrides
-- The merchandiser's two buttons: pin = always include,
-- block = never show (block beats pin when both exist).
CREATE TABLE styling_overrides (
  id                uuid        PRIMARY KEY,
  source_product_id uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  target_product_id uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  kind              varchar(10) NOT NULL CHECK (kind IN ('pin','block')),
  priority          integer     NOT NULL DEFAULT 0,
  note              varchar(255),
  created_by        uuid        REFERENCES users (id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_product_id, target_product_id),
  CHECK (source_product_id <> target_product_id)
);
CREATE INDEX idx_styling_overrides_target_product_id
  ON styling_overrides (target_product_id);
CREATE INDEX idx_styling_overrides_created_by
  ON styling_overrides (created_by);

-- ------------------------------------------------------ styling_co_purchase
-- Nightly co-purchase rollup (dormant until refinement stage 2).
-- updated_at = last nightly refresh; never trust orders_count < 3.
CREATE TABLE styling_co_purchase (
  product_a_id uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  product_b_id uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  score        integer     NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  orders_count integer     NOT NULL DEFAULT 0 CHECK (orders_count >= 0),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_a_id, product_b_id),
  CHECK (product_a_id <> product_b_id)
);
CREATE INDEX idx_styling_co_purchase_product_b_id
  ON styling_co_purchase (product_b_id);

-- ---------------------------------------------------------- styling_events
-- Impression/click/atc telemetry (dormant until the module wires events
-- at launch). Analytics lifecycle: append-only; monthly RANGE partitions
-- on ts attach with the analytics build (003-008 conventions); raw rows
-- drop >30d.
CREATE TABLE styling_events (
  id                 uuid        PRIMARY KEY,
  source_product_id  uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  related_product_id uuid        REFERENCES products (id) ON DELETE CASCADE,
  slot_id            uuid        REFERENCES styling_slots (id) ON DELETE SET NULL,
  color_value_id     uuid        REFERENCES attribute_values (id) ON DELETE SET NULL,
  kind               varchar(20) NOT NULL CHECK (kind IN ('impression','click','add_to_cart')),
  position           smallint    CHECK (position IS NULL OR position >= 1),
  variant            varchar(30),
  contributors       jsonb,
  user_id            uuid        REFERENCES users (id) ON DELETE SET NULL,
  session_id         varchar(64),
  ts                 timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_styling_events_source
  ON styling_events (source_product_id, ts DESC);
CREATE INDEX idx_styling_events_related
  ON styling_events (related_product_id, kind, ts DESC);
