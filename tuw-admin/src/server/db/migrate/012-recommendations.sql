-- 012-recommendations.sql — Complete-the-look (3 tables + 1 column)
-- Source of truth: DOC/backend/18-Recommendations.md (transcribed 1:1).
-- The ALTER at the bottom adds categories.style_slot_id here (not in 002)
-- because style_slots is created in this file — ordering, not migration
-- debt; the chain is unbuilt, so the schema reads as designed once.

-- ------------------------------------------------------------ style_slots
CREATE TABLE style_slots (
  id         uuid        PRIMARY KEY,
  name       varchar(50) NOT NULL,
  slug       varchar(50) NOT NULL UNIQUE,
  position   integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- --------------------------------------------------- style_slot_pairings
-- Directed: slot_id = anchor, pairs_with_slot_id = promoted in its rail.
CREATE TABLE style_slot_pairings (
  slot_id            uuid    NOT NULL REFERENCES style_slots (id) ON DELETE CASCADE,
  pairs_with_slot_id uuid    NOT NULL REFERENCES style_slots (id) ON DELETE CASCADE,
  weight             integer NOT NULL DEFAULT 0,
  PRIMARY KEY (slot_id, pairs_with_slot_id),
  CHECK (slot_id <> pairs_with_slot_id)
);
CREATE INDEX idx_style_slot_pairings_target
  ON style_slot_pairings (pairs_with_slot_id);

-- ------------------------------------------------------ product_pairings
-- One winning row per (anchor, suggestion) pair; source records why.
CREATE TABLE product_pairings (
  id                uuid         PRIMARY KEY,
  product_id        uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  paired_product_id uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  score             numeric(5,4) NOT NULL DEFAULT 0
    CHECK (score >= 0 AND score <= 1),
  source            varchar(20)  NOT NULL DEFAULT 'heuristic'
    CHECK (source IN ('curated','copurchase','heuristic')),
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (product_id, paired_product_id),
  CHECK (product_id <> paired_product_id)
);
CREATE INDEX idx_product_pairings_product_score
  ON product_pairings (product_id, score DESC);
CREATE INDEX idx_product_pairings_paired
  ON product_pairings (paired_product_id);

-- --------------------------------------- categories gains its style slot
-- NULL = never suggested (non-wearables). Assigning a slot to a new
-- garment type is a data edit; product types never need new DDL.
ALTER TABLE categories
  ADD COLUMN style_slot_id uuid REFERENCES style_slots (id) ON DELETE SET NULL;
CREATE INDEX idx_categories_style_slot_id ON categories (style_slot_id);
