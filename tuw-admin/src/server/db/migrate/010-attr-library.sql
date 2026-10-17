-- 010-attr-library.sql — Global attribute library (4 tables)
-- Source of truth: DOC/backend/04-Catalog.md (library section).
-- One attribute = one row; products hold references, never copies.

-- ---------------------------------------------- attribute_definitions
CREATE TABLE attribute_definitions (
  id           uuid         PRIMARY KEY,
  name         varchar(100) NOT NULL UNIQUE,
  display_type varchar(20)  NOT NULL DEFAULT 'pill'
    CHECK (display_type IN ('pill','swatch','radio')),
  show_on_pdp      boolean  NOT NULL DEFAULT true,
  show_on_checkout boolean  NOT NULL DEFAULT false,
  show_on_admin    boolean  NOT NULL DEFAULT true,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CHECK (show_on_pdp OR show_on_checkout OR show_on_admin)
);

-- -------------------------------------------------- attribute_values
CREATE TABLE attribute_values (
  id            uuid         PRIMARY KEY,
  definition_id uuid         NOT NULL REFERENCES attribute_definitions (id) ON DELETE CASCADE,
  value         varchar(150) NOT NULL,
  swatch_hex    varchar(7)   CHECK (swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position      integer      NOT NULL DEFAULT 0,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (definition_id, value)
);

-- -------------------------------------------- product_attribute_links
CREATE TABLE product_attribute_links (
  product_id    uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES attribute_definitions (id) ON DELETE RESTRICT,
  PRIMARY KEY (product_id, definition_id)
);

-- -------------------------------------- product_attribute_link_values
CREATE TABLE product_attribute_link_values (
  product_id       uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  definition_id    uuid NOT NULL REFERENCES attribute_definitions (id) ON DELETE CASCADE,
  value_id         uuid NOT NULL REFERENCES attribute_values (id) ON DELETE RESTRICT,
  price_adjustment DECIMAL(12,2) CHECK (price_adjustment >= 0),
  PRIMARY KEY (product_id, definition_id, value_id)
);
CREATE INDEX idx_palv_value_id ON product_attribute_link_values (value_id);
