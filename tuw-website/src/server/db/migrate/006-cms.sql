-- 006-cms.sql — CMS assets & blog (10 tables)
-- Source of truth: DOC/backend/09-CMS-Media.md (transcribed 1:1).
-- Order: parents before children (media/categories/authors/tags before
-- blogs; blogs before every owned child; media before design_assets).
-- The five page/settings tables (cms_sections, cms_settings,
-- navigation_settings, pages, store_settings) live in 007-cms-pages.sql.

-- ------------------------------------------------------------------ media
-- R2 asset metadata. Provider-agnostic: swapping object storage never
-- touches this schema (see DOC/backend/11-Storage.md).
CREATE TABLE media (
  id          uuid          PRIMARY KEY,
  url         varchar(2048) NOT NULL UNIQUE,
  -- Library display metadata: the asset browser must not need an R2 HEAD
  -- round-trip per card to render name + weight.
  filename    varchar(255),
  size_bytes  bigint        CHECK (size_bytes > 0),
  alt         varchar(255),
  width       integer       CHECK (width > 0),
  height      integer       CHECK (height > 0),
  mime_type   varchar(100),
  -- usage is the storage whitelist (what an asset is for); the admin
  -- library's four categories map onto it: photoshoot -> section,
  -- banner -> section, product -> product, brand -> section.
  usage       varchar(20)   NOT NULL
    CHECK (usage IN ('product','section','blog','design')),
  uploaded_by uuid          REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_usage ON media (usage);
CREATE INDEX idx_media_uploaded_by ON media (uploaded_by);

-- -------------------------------------------------------- blog_categories
-- One primary category per post. Categories are editorial pillars; they
-- are RESTRICT-protected — deactivate instead of deleting.
CREATE TABLE blog_categories (
  id          uuid         PRIMARY KEY,
  name        varchar(150) NOT NULL,
  slug        varchar(180) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  sort_order  integer      NOT NULL DEFAULT 0,
  is_active   boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_blog_categories_name_lower
  ON blog_categories (lower(name));
CREATE INDEX idx_blog_categories_slug ON blog_categories (slug);
CREATE INDEX idx_blog_categories_active_sort
  ON blog_categories (is_active, sort_order);

-- ------------------------------------------------------------ blog_authors
-- Public bylines. A staff user may link here, but a guest author needs no
-- login. Post rows RESTRICT deletion, so authors are retired, not dropped.
CREATE TABLE blog_authors (
  id              uuid         PRIMARY KEY,
  user_id         uuid         UNIQUE REFERENCES users (id) ON DELETE SET NULL,
  name            varchar(150) NOT NULL,
  slug            varchar(180) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  role_title      varchar(150),
  bio             text,
  avatar_media_id uuid         REFERENCES media (id) ON DELETE SET NULL,
  is_active       boolean      NOT NULL DEFAULT true,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_authors_avatar_media_id
  ON blog_authors (avatar_media_id);
CREATE INDEX idx_blog_authors_is_active ON blog_authors (is_active);

-- ---------------------------------------------------------------- blog_tags
-- Cross-cutting editorial tags. Tags handle filters that do not deserve a
-- category (lookbook, behind-the-scenes, organic-cotton...).
CREATE TABLE blog_tags (
  id         uuid        PRIMARY KEY,
  name       varchar(80) NOT NULL,
  slug       varchar(100) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_blog_tags_name_lower ON blog_tags (lower(name));

-- ------------------------------------------------------------------- blogs
-- No `content_html` column: the JSON document is the single editable
-- source. `content_text`, reading time and `search_vector` are derived
-- caches owned by the save transaction/generated column. Status is a
-- finite scalar state — no lookup table. No `views` column: analytics owns
-- that data.
CREATE TABLE blogs (
  id                     uuid         PRIMARY KEY,
  slug                   varchar(180) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title                  varchar(255) NOT NULL,
  subtitle               varchar(255),
  excerpt                varchar(500),
  category_id            uuid         REFERENCES blog_categories (id) ON DELETE RESTRICT,
  author_id              uuid         NOT NULL REFERENCES blog_authors (id) ON DELETE RESTRICT,
  cover_media_id         uuid         REFERENCES media (id) ON DELETE RESTRICT,
  og_media_id            uuid         REFERENCES media (id) ON DELETE RESTRICT,
  content                jsonb        NOT NULL DEFAULT '[]'
    CHECK (jsonb_typeof(content) = 'array'),
  content_schema_version smallint     NOT NULL DEFAULT 1 CHECK (content_schema_version > 0),
  content_text           text         NOT NULL DEFAULT '',
  reading_time_minutes   smallint     NOT NULL DEFAULT 0
    CHECK (reading_time_minutes >= 0),
  status                 varchar(20)  NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','published','archived')),
  is_featured            boolean      NOT NULL DEFAULT false,
  published_at           timestamptz,
  seo_title              varchar(255),
  seo_description        varchar(320),
  canonical_url          varchar(2048),
  noindex                boolean      NOT NULL DEFAULT false,
  version                integer      NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by             uuid         REFERENCES users (id) ON DELETE SET NULL,
  updated_by             uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at             timestamptz  NOT NULL DEFAULT now(),
  updated_at             timestamptz  NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('scheduled','published') OR published_at IS NOT NULL),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_text, '')), 'C')
  ) STORED
);

CREATE INDEX idx_blogs_category_id ON blogs (category_id);
CREATE INDEX idx_blogs_author_id ON blogs (author_id);
CREATE INDEX idx_blogs_cover_media_id ON blogs (cover_media_id);
CREATE INDEX idx_blogs_og_media_id ON blogs (og_media_id);
CREATE INDEX idx_blogs_created_by ON blogs (created_by);
CREATE INDEX idx_blogs_updated_by ON blogs (updated_by);
CREATE INDEX idx_blogs_public_feed
  ON blogs (published_at DESC, id DESC)
  WHERE status = 'published';
CREATE INDEX idx_blogs_public_category
  ON blogs (category_id, published_at DESC, id DESC)
  WHERE status = 'published';
CREATE INDEX idx_blogs_public_author
  ON blogs (author_id, published_at DESC, id DESC)
  WHERE status = 'published';
CREATE INDEX idx_blogs_public_featured
  ON blogs (published_at DESC, id DESC)
  WHERE status = 'published' AND is_featured;
CREATE INDEX idx_blogs_admin_status_updated
  ON blogs (status, updated_at DESC);
CREATE INDEX idx_blogs_scheduled
  ON blogs (published_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_blogs_search ON blogs USING gin (search_vector);

-- ---------------------------------------------------------- blog_post_tags
-- Immutable junction; composite PK is the dedupe constraint.
CREATE TABLE blog_post_tags (
  blog_id uuid NOT NULL REFERENCES blogs (id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES blog_tags (id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);
CREATE INDEX idx_blog_post_tags_tag_id ON blog_post_tags (tag_id, blog_id);

-- ---------------------------------------------------------- blog_revisions
-- Immutable snapshots, not live content. Restore copies a snapshot into a
-- draft; it never mutates the published row directly.
CREATE TABLE blog_revisions (
  id          uuid         PRIMARY KEY,
  blog_id     uuid         NOT NULL REFERENCES blogs (id) ON DELETE CASCADE,
  revision_no integer      NOT NULL CHECK (revision_no > 0),
  title       varchar(255) NOT NULL,
  snapshot    jsonb        NOT NULL
    CHECK (jsonb_typeof(snapshot) = 'object'),
  created_by  uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (blog_id, revision_no)
);
CREATE INDEX idx_blog_revisions_blog_created
  ON blog_revisions (blog_id, created_at DESC);
CREATE INDEX idx_blog_revisions_created_by
  ON blog_revisions (created_by);

-- ------------------------------------------------------- blog_slug_history
-- Required for published slug changes. The service checks the new slug in
-- both tables, inserts the retired slug, and resolves historical hits to a
-- 301 redirect.
CREATE TABLE blog_slug_history (
  slug       varchar(180) PRIMARY KEY
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  blog_id    uuid         NOT NULL REFERENCES blogs (id) ON DELETE CASCADE,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_slug_history_blog_id
  ON blog_slug_history (blog_id);

-- ---------------------------------------------------------- blog_post_media
-- Inline-media FK ledger for `blogs.content` image blocks. Cover and OG
-- media are direct FKs on `blogs`, not duplicated here. The save
-- transaction extracts inline mediaIds, validates them against
-- media(usage='blog'), and syncs this table — making media deletion
-- FK-blocked while any current post still uses the asset.
CREATE TABLE blog_post_media (
  blog_id    uuid    NOT NULL REFERENCES blogs (id) ON DELETE CASCADE,
  media_id   uuid    NOT NULL REFERENCES media (id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (blog_id, media_id)
);
CREATE INDEX idx_blog_post_media_media_id
  ON blog_post_media (media_id, blog_id);

-- ---------------------------------------------------------- design_assets
-- The /designs library: print artwork, embroidery files, typography specs
-- and label sheets handed to the production partner. CMS owns it because
-- it is asset metadata next to `media`, not catalog data — a design is
-- reusable across many products and never owned by one.
-- `media_id` is optional: a design can be registered as a row with its
-- spec fields before (or without) the binary ever being uploaded; when it
-- is set, the partial unique keeps two rows from pointing at one file.
CREATE TABLE design_assets (
  id              uuid          PRIMARY KEY,
  name            varchar(255)  NOT NULL,
  category        varchar(20)   NOT NULL
    CHECK (category IN ('print_artwork','embroidery','typography','label_spec')),
  designer        varchar(150),
  placement       varchar(100),
  dimensions      varchar(50),
  file_format     varchar(30),
  -- Mirrors the upload cap enforced in the UI (25 MB); a larger row is a
  -- bug, not a bigger file.
  file_size_bytes bigint        CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  status          varchar(20)   NOT NULL DEFAULT 'in_review'
    CHECK (status IN ('approved','in_review','archived')),
  media_id        uuid          REFERENCES media (id) ON DELETE RESTRICT,
  notes           text,
  uploaded_by     uuid          REFERENCES users (id) ON DELETE SET NULL,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_design_assets_category ON design_assets (category);
CREATE INDEX idx_design_assets_status ON design_assets (status);
CREATE INDEX idx_design_assets_media_id ON design_assets (media_id);
CREATE INDEX idx_design_assets_uploaded_by ON design_assets (uploaded_by);
CREATE UNIQUE INDEX one_design_per_media ON design_assets (media_id)
  WHERE media_id IS NOT NULL;
