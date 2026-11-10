-- 007-cms-pages.sql — CMS pages & settings (5 tables)
-- Source of truth: DOC/backend/09-CMS-Media.md (transcribed 1:1).
-- Content is documents, not rows: blocks/sections/theme are jsonb validated
-- by Zod in the app, so a new page section or a new theme token never needs
-- a migration. No table here references catalog rows by FK — ids inside
-- jsonb are resolved by the renderer (a deleted category must not break a
-- published page; the renderer skips it).

-- ------------------------------------------------------------ cms_sections
-- One row per page section. `key` is the stable identity the editor and the
-- React tree both key on; `page_key` groups the ordered chain that renders
-- a page.
CREATE TABLE cms_sections (
  id         uuid         PRIMARY KEY,
  key        varchar(150) NOT NULL UNIQUE,
  page_key   varchar(100) NOT NULL,
  type       varchar(50)  NOT NULL
    CHECK (type IN ('hero','banner','featured_products','blog_teaser',
                    'brands','testimonial')),
  title      varchar(255),
  -- Shape varies by type; a hero holds slides[], each slide ctas[0..3].
  content    jsonb        NOT NULL DEFAULT '{}',
  settings   jsonb        NOT NULL DEFAULT '{}',
  sort_order integer      NOT NULL DEFAULT 0,
  is_active  boolean      NOT NULL DEFAULT true,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);
-- Page render = one ordered read of the active chain.
CREATE INDEX idx_cms_sections_page_order
  ON cms_sections (page_key, sort_order) WHERE is_active;

-- ------------------------------------------------------------ cms_settings
-- Single-row theme document. `scope` makes "exactly one row" a constraint
-- rather than a convention; `version` is the cache-buster the storefront
-- compares before re-fetching.
CREATE TABLE cms_settings (
  id         uuid        PRIMARY KEY,
  scope      varchar(50) NOT NULL UNIQUE,
  theme      jsonb       NOT NULL DEFAULT '{}',
  version    integer     NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------- navigation_settings
-- Single-row navbar document (categoryIds[], megamenu flags/columns).
-- Read whole, never queried by field — PK and the scope unique are enough.
CREATE TABLE navigation_settings (
  id         uuid        PRIMARY KEY,
  scope      varchar(20) NOT NULL UNIQUE DEFAULT 'global',
  navbar     jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------- pages
-- Static pages (about, shipping, returns...). Slug is the route.
CREATE TABLE pages (
  id         uuid         PRIMARY KEY,
  slug       varchar(180) NOT NULL UNIQUE,
  title      varchar(255) NOT NULL,
  blocks     jsonb        NOT NULL DEFAULT '[]'
    CHECK (jsonb_typeof(blocks) = 'array'),
  seo        jsonb,
  is_active  boolean      NOT NULL DEFAULT true,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

-- --------------------------------------------------------- store_settings
-- Operational config, not content: key/value config rows looked up by name
-- (never by id), which is why the PK is the text key. All seven admin
-- settings tabs write here.
-- Rule, not hope: **secrets never land here.** Gateway keys and webhook
-- secrets live in env; app validation rejects any value matching secret
-- shape. `qikinkApiKey` exists only in the mock layer and must not become
-- a row.
CREATE TABLE store_settings (
  key        varchar(150) PRIMARY KEY,
  value      jsonb        NOT NULL,
  updated_at timestamptz  NOT NULL DEFAULT now(),
  updated_by uuid         REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX idx_store_settings_updated_by ON store_settings (updated_by);
