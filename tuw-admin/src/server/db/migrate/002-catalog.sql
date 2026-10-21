-- 002-catalog.sql — Catalog (14 tables; options trio removed for library)
-- Source of truth: DOC/backend/04-Catalog.md (transcribed 1:1).
-- Order: parents before children (categories/brands/charts/collections
-- before products; products before everything referencing it).

-- -------------------------------------------------------------- categories
CREATE TABLE categories (
  id                   uuid         PRIMARY KEY,
  parent_id            uuid         REFERENCES categories (id) ON DELETE RESTRICT,
  name                 varchar(150) NOT NULL,
  slug                 varchar(180) NOT NULL UNIQUE,
  description          text,
  image_url            varchar(2048),
  is_active            boolean      NOT NULL DEFAULT true,
  show_in_navbar       boolean      NOT NULL DEFAULT false,
  show_in_megamenu     boolean      NOT NULL DEFAULT false,
  megamenu_show_images boolean      NOT NULL DEFAULT false,
  sort_order           integer      NOT NULL DEFAULT 0,
  settings             jsonb        NOT NULL DEFAULT '{}',
  deleted_at           timestamptz,
  search_vector        tsvector     GENERATED ALWAYS AS
    (to_tsvector('english', name || ' ' || coalesce(description, ''))) STORED,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_search_vector ON categories USING gin (search_vector);
CREATE INDEX idx_categories_navbar ON categories (is_active, show_in_navbar, sort_order)
  WHERE is_active AND show_in_navbar;

-- ----------------------------------------------------------------- brands
-- Defined but unbuilt in v1: DDL ships now, seed/UI/queries come at launch.
CREATE TABLE brands (
  id          uuid         PRIMARY KEY,
  name        varchar(150) NOT NULL,
  slug        varchar(180) NOT NULL UNIQUE,
  logo_url    varchar(2048),
  description text,
  is_active   boolean      NOT NULL DEFAULT true,
  sort_order  integer      NOT NULL DEFAULT 0,
  deleted_at  timestamptz,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_brands_active ON brands (is_active) WHERE is_active;

-- ------------------------------------------------------------ size_charts
CREATE TABLE size_charts (
  id         uuid        PRIMARY KEY,
  name       varchar(150) NOT NULL,
  rows       jsonb       NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------- products
CREATE TABLE products (
  id                 uuid          PRIMARY KEY,
  sku                varchar(64)   NOT NULL UNIQUE,
  name               varchar(255)  NOT NULL,
  slug               varchar(280)  NOT NULL UNIQUE,
  style_code         varchar(50),
  short_description  varchar(500),
  description        text,
  category_id        uuid          REFERENCES categories (id) ON DELETE SET NULL,
  brand_id           uuid          REFERENCES brands (id) ON DELETE SET NULL,
  size_chart_id      uuid          REFERENCES size_charts (id) ON DELETE SET NULL,
  price              DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  base_price         DECIMAL(12,2) CHECK (base_price >= 0),
  compare_at_price   DECIMAL(12,2) CHECK (compare_at_price >= 0),
  stock              integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status             varchar(20)   NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','archived')),
  tags               varchar(50)[],
  attributes         jsonb         NOT NULL DEFAULT '{}',
  photo_settings     jsonb         NOT NULL DEFAULT '{}',
  source             varchar(20)   NOT NULL DEFAULT 'local'
    CHECK (source IN ('local','csv','shopify','bigcommerce','odoo')),
  external_id        varchar(255),
  -- Internal workbook reference (Excel S.No). Nullable; a display/reference
  -- field, never the product identity. Re-import identity is source_group_key.
  internal_serial_no integer       CHECK (internal_serial_no > 0),
  -- Deterministic import group: style code when present, otherwise
  -- name + gender (+ HSN when a conflicting group is split). Internal only.
  source_group_key   varchar(255),
  weight_g           integer       CHECK (weight_g >= 0),
  shipping_weight_g  integer       CHECK (shipping_weight_g >= 0),
  dimensions         varchar(50),
  -- Apparel specification fields (Clothing Specs tab). Product-level because
  -- they describe the style, not an individual variant.
  fabric_spec        varchar(255),
  cut                varchar(255),
  model_dims         varchar(255),
  care_instructions  text,
  gender             varchar(20)   CHECK (gender IN ('Female','Male','Unisex','Kids','Boy','Girl')),
  tax_rate           DECIMAL(5,2)  CHECK (tax_rate >= 0),
  hsn_code           varchar(12)   CHECK (hsn_code IS NULL OR hsn_code ~ '^[0-9]{4,8}$'),
  monogram_enabled   boolean       NOT NULL DEFAULT false,
  monogram_max_chars smallint      NOT NULL DEFAULT 3 CHECK (monogram_max_chars >= 1),
  monogram_upcharge  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (monogram_upcharge >= 0),
  deleted_at         timestamptz,
  search_vector      tsvector      GENERATED ALWAYS AS
    (to_tsvector('english', name || ' ' || coalesce(short_description, '') || ' ' || coalesce(description, ''))) STORED,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_brand_id ON products (brand_id);
CREATE INDEX idx_products_search_vector ON products USING gin (search_vector);
CREATE INDEX idx_products_active ON products (status) WHERE status = 'active';
CREATE INDEX idx_products_tags ON products USING gin (tags);
CREATE UNIQUE INDEX products_source_external_key ON products (source, external_id)
  WHERE external_id IS NOT NULL;
CREATE INDEX idx_products_active_price ON products (status, price)
  WHERE status = 'active';
CREATE INDEX idx_products_internal_serial_no ON products (internal_serial_no)
  WHERE internal_serial_no IS NOT NULL;
CREATE UNIQUE INDEX products_source_group_key ON products (source, source_group_key)
  WHERE source_group_key IS NOT NULL;

-- --------------------------------------------------- product_source_rows
-- Preserves one row per workbook listing row. A product can be assembled from
-- several rows (size cohorts); variants point at the row that produced them.
-- Excel ID is deliberately not stored here; S.No + row number are the audit
-- reference. raw_data excludes the Excel ID.
CREATE TABLE product_source_rows (
  id                uuid        PRIMARY KEY,
  product_id        uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  source_serial_no  integer     NOT NULL CHECK (source_serial_no > 0),
  source_row_no     integer     NOT NULL CHECK (source_row_no > 0),
  raw_data          jsonb       NOT NULL DEFAULT '{}',
  imported_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, source_serial_no)
);
CREATE INDEX idx_product_source_rows_product_id
  ON product_source_rows (product_id);
CREATE INDEX idx_product_source_rows_serial
  ON product_source_rows (source_serial_no);

-- ------------------------------------------------------- product_variants
CREATE TABLE product_variants (
  id               uuid          PRIMARY KEY,
  product_id       uuid          NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  source_row_id    uuid          REFERENCES product_source_rows (id) ON DELETE SET NULL,
  sku              varchar(64)   NOT NULL UNIQUE,
  variant_key      varchar(255),
  price            DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  price_overridden boolean       NOT NULL DEFAULT false,
  stock            integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  weight_g         integer       CHECK (weight_g >= 0),
  shipping_weight_g integer      CHECK (shipping_weight_g >= 0),
  dimensions       varchar(50),
  image_url        varchar(2048),
  is_active        boolean       NOT NULL DEFAULT true,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),
  -- Composite key for the variant→attribute-value FK in 010.
  UNIQUE (id, product_id),
  -- Prevents two variants representing the same option combination.
  -- Null is allowed until the writer computes a key.
  UNIQUE (product_id, variant_key)
);
CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_product_variants_active ON product_variants (product_id)
  WHERE is_active;
CREATE INDEX idx_product_variants_source_row_id
  ON product_variants (source_row_id);

-- --------------------------------------------------------- product_images
CREATE TABLE product_images (
  id         uuid         PRIMARY KEY,
  product_id uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id uuid         REFERENCES product_variants (id) ON DELETE CASCADE,
  url        varchar(2048) NOT NULL,
  alt        varchar(255),
  sort_order integer      NOT NULL DEFAULT 0,
  is_primary boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_images_product_order
  ON product_images (product_id, sort_order);
CREATE INDEX idx_product_images_variant_id ON product_images (variant_id);
CREATE UNIQUE INDEX one_primary_per_product ON product_images (product_id)
  WHERE is_primary;

-- product_options trio REMOVED (single-record library replaces per-product
-- copies; see 010-attr-library.sql). Nothing was ever built on them.

-- ------------------------------------------------------ product_attributes
CREATE TABLE product_attributes (
  id         uuid         PRIMARY KEY,
  name       varchar(100) NOT NULL,
  slug       varchar(120) NOT NULL UNIQUE,
  type       varchar(20)  NOT NULL CHECK (type IN ('text','number','boolean')),
  unit       varchar(20),
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

-- ------------------------------------------------ product_attribute_values
CREATE TABLE product_attribute_values (
  id           uuid         PRIMARY KEY,
  product_id   uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  attribute_id uuid         NOT NULL REFERENCES product_attributes (id) ON DELETE CASCADE,
  value        varchar(255) NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (product_id, attribute_id)
);
CREATE INDEX idx_pav_attribute_id ON product_attribute_values (attribute_id);

-- -------------------------------------------------------------- collections
CREATE TABLE collections (
  id          uuid         PRIMARY KEY,
  name        varchar(150) NOT NULL,
  slug        varchar(180) NOT NULL UNIQUE,
  season      varchar(50),
  visibility  varchar(20)  NOT NULL DEFAULT 'draft'
    CHECK (visibility IN ('published','draft','scheduled')),
  description text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------- collection_products
CREATE TABLE collection_products (
  collection_id uuid    NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
  product_id    uuid    NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  position      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

-- --------------------------------------------------------- stock_movements
CREATE TABLE stock_movements (
  id         uuid    PRIMARY KEY,
  product_id uuid    NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id uuid    REFERENCES product_variants (id) ON DELETE CASCADE,
  qty_change integer NOT NULL,
  reason     varchar(30) NOT NULL
    CHECK (reason IN ('sale','restock','import','admin_adjustment','return','cancel')),
  -- order_id arrives via 004-orders.sql (orders table does not exist yet;
  -- linking FKs are added where both sides exist, never forward-referenced).
  qty_after  integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_product_time
  ON stock_movements (product_id, created_at);
CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at);

-- ------------------------------------------------------ product_discounts
CREATE TABLE product_discounts (
  id            uuid          PRIMARY KEY,
  product_id    uuid          NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  discount_type varchar(10)   NOT NULL CHECK (discount_type IN ('percent','fixed')),
  value         DECIMAL(12,2) NOT NULL CHECK (value >= 0),
  starts_at     timestamptz   NOT NULL,
  ends_at       timestamptz   NOT NULL,
  is_active     boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now(),
  CHECK ((discount_type = 'percent' AND value <= 100) OR discount_type = 'fixed')
);
CREATE INDEX idx_product_discounts_active ON product_discounts (product_id)
  WHERE is_active;
CREATE INDEX idx_discounts_active_range
  ON product_discounts (starts_at, ends_at) WHERE is_active;

-- ----------------------------------------------------------------- reviews
CREATE TABLE reviews (
  id          uuid        PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating      smallint    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       varchar(255),
  body        text,
  is_approved boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_product_approved ON reviews (product_id)
  WHERE is_approved;
CREATE INDEX idx_reviews_user_id ON reviews (user_id);
