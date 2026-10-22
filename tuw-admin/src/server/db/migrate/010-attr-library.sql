-- 010-attr-library.sql — Global attribute library (5 tables)
-- Source of truth: DOC/backend/04-Catalog.md (library section).
-- One attribute definition = one row; products hold references, never copies.
-- Definitions are semantic types (Size, Model, Dimensions, Capacity, Shape,
-- Style). Adding a type is an INSERT, never a new table/column or a values
-- array. Per-product display labels live on product_attribute_links.
-- product_variant_attribute_values completes the chain: product → linked
-- attribute value → exact variant combination.

-- ---------------------------------------------- attribute_definitions
CREATE TABLE attribute_definitions (
  id           uuid         PRIMARY KEY,
  name         varchar(100) NOT NULL UNIQUE,
  -- Stable machine key for filters/URLs. The name is the canonical type
  -- label ("Model"); the slug lets the storefront link to a definition
  -- without relying on a mutable display label.
  slug         varchar(100) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
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
  product_id            uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  definition_id         uuid NOT NULL REFERENCES attribute_definitions (id) ON DELETE RESTRICT,
  -- Variant axes are per product: Color/Size for apparel, Model/Color for
  -- phone cases, Dimensions/Color for posters. The library record is shared.
  is_variant_axis       boolean NOT NULL DEFAULT false,
  variant_axis_position smallint CHECK (
    variant_axis_position IS NULL OR variant_axis_position >= 0
  ),
  -- Optional per-product display label ("Model", "Dimensions", "Capacity")
  -- without duplicating the shared attribute definition.
  axis_label            varchar(50),
  -- Per-product order for linked non-axis attributes (specs). Variant axes
  -- use variant_axis_position; NULL falls back to the definition name.
  display_position      smallint CHECK (
    display_position IS NULL OR display_position >= 0
  ),
  PRIMARY KEY (product_id, definition_id),
  CHECK (NOT is_variant_axis OR variant_axis_position IS NOT NULL)
);
CREATE UNIQUE INDEX idx_pal_variant_axis_position
  ON product_attribute_links (product_id, variant_axis_position)
  WHERE is_variant_axis;

-- -------------------------------------- product_attribute_link_values
CREATE TABLE product_attribute_link_values (
  product_id       uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  definition_id    uuid NOT NULL REFERENCES attribute_definitions (id) ON DELETE CASCADE,
  value_id         uuid NOT NULL REFERENCES attribute_values (id) ON DELETE RESTRICT,
  price_adjustment DECIMAL(12,2) CHECK (price_adjustment >= 0),
  PRIMARY KEY (product_id, definition_id, value_id)
);
CREATE INDEX idx_palv_value_id ON product_attribute_link_values (value_id);

-- --------------------------------- product_variant_attribute_values
-- One row per variant per axis. The composite FKs enforce three things:
-- 1) the variant belongs to the product; 2) the attribute is linked to the
-- product; 3) the exact value is selected on the product. The PK allows one
-- value per axis per variant. Duplicate variant combinations are blocked by
-- product_variants UNIQUE (product_id, variant_key).
CREATE TABLE product_variant_attribute_values (
  variant_id    uuid NOT NULL,
  product_id    uuid NOT NULL,
  definition_id uuid NOT NULL,
  value_id      uuid NOT NULL,

  PRIMARY KEY (variant_id, definition_id),

  FOREIGN KEY (variant_id, product_id)
    REFERENCES product_variants (id, product_id) ON DELETE CASCADE,

  FOREIGN KEY (product_id, definition_id)
    REFERENCES product_attribute_links (product_id, definition_id)
    ON DELETE CASCADE,

  FOREIGN KEY (product_id, definition_id, value_id)
    REFERENCES product_attribute_link_values
      (product_id, definition_id, value_id)
    ON DELETE CASCADE
);
CREATE INDEX idx_pvav_product_id
  ON product_variant_attribute_values (product_id);
CREATE INDEX idx_pvav_value_id
  ON product_variant_attribute_values (value_id);
