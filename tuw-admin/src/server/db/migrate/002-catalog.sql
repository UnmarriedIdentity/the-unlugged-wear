-- 002-catalog.sql — Catalog (16 tables)
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
  weight_g           integer       CHECK (weight_g >= 0),
  shipping_weight_g  integer       CHECK (shipping_weight_g >= 0),
  dimensions         varchar(50),
  gender             varchar(20)   CHECK (gender IN ('Female','Male','Unisex','Kids')),
  tax_rate           DECIMAL(5,2)  CHECK (tax_rate >= 0),
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

-- ------------------------------------------------------- product_variants
CREATE TABLE product_variants (
  id         uuid          PRIMARY KEY,
  product_id uuid          NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  sku        varchar(64)   NOT NULL UNIQUE,
  price      DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  stock      integer       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url  varchar(2048),
  is_active  boolean       NOT NULL DEFAULT true,
  created_at timestamptz   NOT NULL DEFAULT now(),
  updated_at timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_product_variants_active ON product_variants (product_id)
  WHERE is_active;

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

-- -------------------------------------------------------- product_options
CREATE TABLE product_options (
  id              uuid         PRIMARY KEY,
  product_id      uuid         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  name            varchar(100) NOT NULL,
  display_type    varchar(20)  NOT NULL DEFAULT 'pill'
    CHECK (display_type IN ('pill','swatch','radio')),
  show_on_pdp     boolean      NOT NULL DEFAULT true,
  show_on_checkout boolean     NOT NULL DEFAULT false,
  show_on_admin   boolean      NOT NULL DEFAULT true,
  position        integer      NOT NULL DEFAULT 0,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now(),
  CHECK (show_on_pdp OR show_on_checkout OR show_on_admin)
);
CREATE INDEX idx_product_options_product_id ON product_options (product_id);

-- -------------------------------------------------- product_option_values
CREATE TABLE product_option_values (
  id         uuid         PRIMARY KEY,
  option_id  uuid         NOT NULL REFERENCES product_options (id) ON DELETE CASCADE,
  value      varchar(150) NOT NULL,
  swatch_hex varchar(7)   CHECK (swatch_hex ~ '^#[0-9A-Fa-f]{6}$'),
  position   integer      NOT NULL DEFAULT 0,
  created_at timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (option_id, value)
);

-- -------------------------------------------- product_variant_option_values
CREATE TABLE product_variant_option_values (
  variant_id      uuid NOT NULL REFERENCES product_variants (id) ON DELETE CASCADE,
  option_id       uuid NOT NULL REFERENCES product_options (id) ON DELETE CASCADE,
  option_value_id uuid NOT NULL REFERENCES product_option_values (id) ON DELETE RESTRICT,
  PRIMARY KEY (variant_id, option_id)
);
CREATE INDEX idx_pvov_option_value_id
  ON product_variant_option_values (option_value_id);
CREATE INDEX idx_pvov_option_id ON product_variant_option_values (option_id);

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
