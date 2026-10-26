import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------
// Static schema guard. No PostgreSQL is available in this environment,
// so these tests protect the things a real migration run would catch:
// table inventory, duplicate names, parent-before-child FK order, and
// retired systems creeping back into the DDL. Pure Node, no packages.
// ---------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATE_DIR = join(HERE, '..', 'src', 'server', 'db', 'migrate');
const DOCS_DIR = join(HERE, '..', '..', 'DOC', 'backend');

const FILES = [
  '001-auth.sql',
  '002-catalog.sql',
  '006-cms.sql',
  '009-partner.sql',
  '010-attr-library.sql',
  '011-household.sql',
  '012-styling.sql',
];

const IMPLEMENTED = {
  '001-auth.sql': [
    'roles',
    'permissions',
    'users',
    'profiles',
    'role_permissions',
    'user_roles',
    'refresh_tokens',
    'customer_notes',
    'staff_invitations',
    'audit_logs',
  ],
  '002-catalog.sql': [
    'categories',
    'brands',
    'size_charts',
    'products',
    'product_source_rows',
    'product_variants',
    'product_images',
    'collections',
    'collection_products',
    'stock_movements',
    'product_discounts',
    'reviews',
  ],
  '006-cms.sql': [
    'media',
    'blog_categories',
    'blog_authors',
    'blog_tags',
    'blogs',
    'blog_post_tags',
    'blog_revisions',
    'blog_slug_history',
    'blog_post_media',
  ],
  '009-partner.sql': ['partner_orders', 'partner_wallet_ledger'],
  '010-attr-library.sql': [
    'attribute_definitions',
    'attribute_values',
    'product_attribute_links',
    'product_attribute_link_values',
    'product_variant_attribute_values',
  ],
  '011-household.sql': [
    'households',
    'household_members',
    'profile_size_preferences',
    'household_invitations',
    'addresses',
  ],
  '012-styling.sql': [
    'styling_slots',
    'styling_category_slots',
    'styling_slot_rules',
    'styling_value_affinity',
    'styling_overrides',
    'styling_co_purchase',
    'styling_events',
  ],
};

const DOCUMENTED_ONLY = [
  // Cart & wishlist (4)
  'carts',
  'cart_items',
  'wishlists',
  'wishlist_items',
  // Orders & money (9)
  'orders',
  'order_items',
  'order_status_history',
  'payments',
  'refunds',
  'returns',
  'return_items',
  'discount_codes',
  'shipments',
  // Platform (3)
  'import_jobs',
  'email_logs',
  'notification_templates',
  // CMS (14; blog slice implemented in 006, settings/pages still pending)
  'cms_sections',
  'cms_settings',
  'navigation_settings',
  'pages',
  'store_settings',
  // Analytics (7)
  'page_views',
  'sessions',
  'cart_events',
  'abandoned_carts',
  'daily_stats',
  'product_views',
  'search_terms',
  // Operations (3)
  'support_tickets',
  'support_messages',
  'notifications',
];

// 009 lands before 004 exists. The FK is correct; the allowlist keeps the
// guard honest instead of silently dropping the check.
const EXTERNAL_REFS = new Set(['orders']);

const RETIRED_TABLES = [
  'product_options',
  'product_option_values',
  'product_variant_option_values',
  'product_attributes',
  'product_attribute_values',
];

const EXPECTED_IMPLEMENTED = Object.values(IMPLEMENTED).flat().length;
const EXPECTED_TOTAL = EXPECTED_IMPLEMENTED + DOCUMENTED_ONLY.length;

const read = (path) => readFileSync(path, 'utf8');
const sqlText = (file) => read(join(MIGRATE_DIR, file));

// Comments contain prose like "profile_size_preferences ... references" and
// "products hold references"; strip them before parsing so the guard reads
// DDL only.
const code = (file) => sqlText(file).replace(/--.*$/gm, '');

const createTableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi;

const tablesIn = (sql) => [...sql.matchAll(createTableRe)].map((m) => m[1].toLowerCase());

describe('schema integrity', () => {
  test('inventory matches the 50 implemented tables, file by file', () => {
    const actual = {};
    for (const file of FILES) actual[file] = tablesIn(code(file));

    assert.deepEqual(actual, IMPLEMENTED);
    assert.equal(EXPECTED_IMPLEMENTED, 50);
    assert.equal(DOCUMENTED_ONLY.length, 31);
    assert.equal(EXPECTED_TOTAL, 81);
  });

  test('no duplicate CREATE TABLE names across files', () => {
    const seen = new Map();
    for (const file of FILES) {
      for (const name of tablesIn(code(file))) {
        assert.equal(seen.has(name), false, `${name} is created twice (${seen.get(name)} and ${file})`);
        seen.set(name, file);
      }
    }
  });

  test('every REFERENCES target exists earlier or is an explicit external dependency', () => {
    const seen = new Set();
    const refRe = /(?:CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)|REFERENCES\s+([a-z_]+))/gi;

    for (const file of FILES) {
      const sql = code(file);
      for (const match of sql.matchAll(refRe)) {
        const created = match[1]?.toLowerCase();
        const referenced = match[2]?.toLowerCase();
        if (created) {
          seen.add(created);
          continue;
        }
        if (!referenced) continue;
        assert.ok(
          seen.has(referenced) || EXTERNAL_REFS.has(referenced),
          `${file}: REFERENCES ${referenced}, but ${referenced} is not created earlier and is not an explicit external dependency`,
        );
      }
    }
  });

  test('retired systems stay out of the DDL', () => {
    const all = FILES.map(code).join('\n');
    for (const retired of RETIRED_TABLES) {
      assert.equal(
        new RegExp(`CREATE\\s+TABLE\\s+${retired}\\b`, 'i').test(all),
        false,
        `retired table ${retired} reappeared`,
      );
    }

    const productsBlock = all.match(/CREATE\s+TABLE\s+products\s*\(([\s\S]*?)\n\);/i)?.[1] ?? '';
    assert.ok(productsBlock.length > 0, 'products CREATE TABLE block not found');
    assert.equal(/\battributes\b/i.test(productsBlock), false, 'products.attributes is back; use the attribute library links');
    assert.equal(/\bsizes\b/i.test(productsBlock), false, 'products.sizes is back; use the attribute library links');
  });

  test('semantic attribute metadata is present and values stay normalized', () => {
    const library = code('010-attr-library.sql');
    const definitions = library.match(/CREATE\s+TABLE\s+attribute_definitions\s*\(([\s\S]*?)\n\);/i)?.[1] ?? '';
    const links = library.match(/CREATE\s+TABLE\s+product_attribute_links\s*\(([\s\S]*?)\n\);/i)?.[1] ?? '';

    assert.ok(definitions.length > 0, 'attribute_definitions CREATE TABLE block not found');
    assert.match(definitions, /\bslug\b\s+varchar\(100\)\s+NOT NULL UNIQUE/i);
    assert.match(definitions, /slug\s*~\s*'\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$'/i);
    assert.equal(
      /\bvalues\b/i.test(definitions),
      false,
      'attribute_definitions.values is back; values belong in attribute_values',
    );

    assert.ok(links.length > 0, 'product_attribute_links CREATE TABLE block not found');
    assert.match(links, /\baxis_label\b\s+varchar\(50\)/i);
    assert.match(links, /\bdisplay_position\b\s+smallint/i);
  });

  test('docs counts match 50 implemented + 31 specified = 81', () => {
    const readme = read(join(DOCS_DIR, '00-README.md'));
    const dataTables = read(join(DOCS_DIR, '02-Data-Tables.md'));
    const catalog = read(join(DOCS_DIR, '04-Catalog.md'));

    assert.match(readme, /Data at a glance \(81 planned tables: 50 implemented DDL \+ 31 specified\)/);
    assert.match(dataTables, /> 81 tables \(50 implemented DDL \+ 31 specified\)/);
    assert.match(catalog, /> 17 tables\./);

    // Catalog = 002 (12) + 010 (5); CMS blog slice = 006 (9).
    assert.equal(IMPLEMENTED['002-catalog.sql'].length, 12);
    assert.equal(IMPLEMENTED['010-attr-library.sql'].length, 5);
    assert.equal(IMPLEMENTED['006-cms.sql'].length, 9);
    assert.equal(IMPLEMENTED['002-catalog.sql'].length + IMPLEMENTED['010-attr-library.sql'].length, 17);
  });

  test('CMS blog slice is normalized and durable', () => {
    const cms = code('006-cms.sql');
    const blogsBlock = cms.match(/CREATE\s+TABLE\s+blogs\s*\(([\s\S]*?)\n\);/i)?.[1] ?? '';

    assert.ok(blogsBlock.length > 0, 'blogs CREATE TABLE block not found');
    // One primary category + many tags; no M:N category junction.
    assert.match(cms, /CREATE\s+TABLE\s+blog_post_tags\b/i);
    assert.equal(/CREATE\s+TABLE\s+blog_post_categories\b/i.test(cms), false);
    // Status is a scalar state, not a lookup table.
    assert.match(blogsBlock, /status\s+varchar\(20\)\s+NOT NULL DEFAULT 'draft'/i);
    assert.match(blogsBlock, /CHECK \(status IN \('draft','scheduled','published','archived'\)\)/i);
    assert.equal(/CREATE\s+TABLE\s+blog_statuses\b/i.test(cms), false);
    // JSON document stays the single editable source.
    assert.match(blogsBlock, /content\s+jsonb\s+NOT NULL DEFAULT '\[\]'/i);
    assert.equal(/\bcontent_html\b/i.test(cms), false);
    // Derived caches and search.
    assert.match(blogsBlock, /content_text\s+text\s+NOT NULL DEFAULT ''/i);
    assert.match(blogsBlock, /reading_time_minutes\s+smallint/i);
    assert.match(blogsBlock, /search_vector\s+tsvector\s+GENERATED ALWAYS AS/i);
    // Inline media ledger and slug history exist; views do not.
    assert.match(cms, /CREATE\s+TABLE\s+blog_post_media\b/i);
    assert.match(cms, /CREATE\s+TABLE\s+blog_slug_history\b/i);
    assert.equal(/\bviews\b/i.test(blogsBlock), false);
  });

  test('migration README declares the 009 -> 004 dependency', () => {
    const readme = read(join(MIGRATE_DIR, 'README.md'));
    assert.match(readme, /004-orders\.sql/);
    assert.match(readme, /blocked/i);
    assert.match(readme, /Total.*\*\*50\*\*/);
  });
});
