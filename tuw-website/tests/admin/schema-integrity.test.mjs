import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------
// Static schema guard. No PostgreSQL is available in this environment,
// so these tests protect the things a real migration run would catch:
// table inventory, duplicate names, parent-before-child FK order, retired
// systems creeping back into the DDL, and the idempotency constraints that
// stop a retried request from writing a second row. Pure Node, no packages.
// ---------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATE_DIR = join(HERE, '..', '..', 'src', 'server', 'db', 'migrate');
const DOCS_DIR = join(HERE, '..', '..', '..', 'DOC', 'backend');

// Apply order. Parents always precede their children, so 009 (which
// references orders) now sits after 004 and needs no external allowlist.
const FILES = [
  '001-auth.sql',
  '002-catalog.sql',
  '003-cart.sql',
  '004-orders.sql',
  '005-platform.sql',
  '006-cms.sql',
  '007-cms-pages.sql',
  '009-partner.sql',
  '010-attr-library.sql',
  '011-household.sql',
  '012-styling.sql',
  '013-analytics.sql',
  '014-operations.sql',
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
    'password_reset_tokens',
    'email_verification_tokens',
    'login_attempts',
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
  '003-cart.sql': ['carts', 'cart_items', 'wishlists', 'wishlist_items'],
  '004-orders.sql': [
    'discount_codes',
    'orders',
    'order_items',
    'order_status_history',
    'payments',
    'refunds',
    'returns',
    'return_items',
    'shipments',
    'shipment_events',
  ],
  '005-platform.sql': [
    'import_jobs',
    'email_logs',
    'notification_templates',
    'idempotency_keys',
    'webhook_events',
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
    'design_assets',
  ],
  '007-cms-pages.sql': [
    'cms_sections',
    'cms_settings',
    'navigation_settings',
    'pages',
    'store_settings',
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
  '013-analytics.sql': [
    'page_views',
    'analytics_sessions',
    'cart_events',
    'abandoned_carts',
    'daily_stats',
    'product_views',
    'search_terms',
  ],
  '014-operations.sql': ['support_tickets', 'support_messages', 'notifications'],
};

// Every specified table is now written as DDL. Kept as an explicit empty
// list so a future regression has somewhere to declare itself.
const DOCUMENTED_ONLY = [];

// No forward references remain: 004 exists, so 009 and stock_movements
// link to a table created earlier in the same run.
const EXTERNAL_REFS = new Set();

const RETIRED_TABLES = [
  'product_options',
  'product_option_values',
  'product_variant_option_values',
  'product_attributes',
  'product_attribute_values',
];

// Partitions are children of a partitioned table, not independent tables.
const PARTITION_PARENTS = {
  '013-analytics.sql': ['page_views', 'cart_events', 'product_views', 'search_terms'],
};

const EXPECTED_IMPLEMENTED = Object.values(IMPLEMENTED).flat().length;
const EXPECTED_TOTAL = EXPECTED_IMPLEMENTED + DOCUMENTED_ONLY.length;

const read = (path) => readFileSync(path, 'utf8');
const sqlText = (file) => read(join(MIGRATE_DIR, file));

const stripComments = (sql) => sql.replace(/--.*$/gm, '');

// Comments contain prose like "profile_size_preferences ... references" and
// "products hold references"; strip them before parsing so the guard reads
// DDL only. Partition-creation statements are removed too — `CREATE TABLE
// page_views_default PARTITION OF page_views` creates a partition, and the
// inventory counts tables.
const code = (file) => stripComments(sqlText(file))
  .replace(/CREATE\s+TABLE\s+[a-z_]+\s+PARTITION\s+OF\s+[a-z_]+[\s\S]*?;/gi, '');

const createTableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z_]+)/gi;

const tablesIn = (sql) => [...sql.matchAll(createTableRe)].map((m) => m[1].toLowerCase());

const block = (sql, table) =>
  sql.match(new RegExp(`CREATE\\s+TABLE\\s+${table}\\s*\\(([\\s\\S]*?)\\n\\);`, 'i'))?.[1] ?? '';

describe('schema integrity', () => {
  test('inventory matches the 88 implemented tables, file by file', () => {
    const actual = {};
    for (const file of FILES) actual[file] = tablesIn(code(file));

    assert.deepEqual(actual, IMPLEMENTED);
    assert.equal(EXPECTED_IMPLEMENTED, 88);
    assert.equal(DOCUMENTED_ONLY.length, 0);
    assert.equal(EXPECTED_TOTAL, 88);
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

  test('every REFERENCES target exists earlier, so the apply order is real', () => {
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

  test('009-partner applies after 004-orders', () => {
    assert.ok(FILES.indexOf('004-orders.sql') < FILES.indexOf('009-partner.sql'));
    // The dependency is real in the DDL, not just in the file name order.
    assert.match(code('009-partner.sql'), /REFERENCES\s+orders\s*\(id\)/i);
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

    const productsBlock = block(all, 'products');
    assert.ok(productsBlock.length > 0, 'products CREATE TABLE block not found');
    assert.equal(/\battributes\b/i.test(productsBlock), false, 'products.attributes is back; use the attribute library links');
    assert.equal(/\bsizes\b/i.test(productsBlock), false, 'products.sizes is back; use the attribute library links');
  });

  test('semantic attribute metadata is present and values stay normalized', () => {
    const library = code('010-attr-library.sql');
    const definitions = block(library, 'attribute_definitions');
    const links = block(library, 'product_attribute_links');

    assert.ok(definitions.length > 0, 'attribute_definitions CREATE TABLE block not found');
    assert.match(definitions, /\bslug\b\s+varchar\(100\)\s+NOT NULL UNIQUE/i);
    assert.match(definitions, /slug\s*~\s*'\^\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*\$'/i);
    assert.equal(
      /\bvalues\b/i.test(definitions),
      false,
      'attribute_definitions.values is back; values belong in attribute_values',
    );
    // The library's enable toggle is independent of the show_on_* flags.
    assert.match(definitions, /\bis_active\b\s+boolean\s+NOT NULL DEFAULT true/i);

    assert.ok(links.length > 0, 'product_attribute_links CREATE TABLE block not found');
    assert.match(links, /\baxis_label\b\s+varchar\(50\)/i);
    assert.match(links, /\bdisplay_position\b\s+smallint/i);
  });

  test('docs counts match 88 implemented tables', () => {
    const readme = read(join(DOCS_DIR, '00-README.md'));
    const dataTables = read(join(DOCS_DIR, '02-Data-Tables.md'));
    const catalog = read(join(DOCS_DIR, '04-Catalog.md'));

    assert.match(readme, /Data at a glance \(88 tables, all implemented in DDL\)/);
    assert.match(dataTables, /> 88 tables \(88 implemented DDL \+ 0 specified\)/);
    assert.match(catalog, /> 17 tables\./);

    // Catalog = 002 (12) + 010 (5).
    assert.equal(IMPLEMENTED['002-catalog.sql'].length, 12);
    assert.equal(IMPLEMENTED['010-attr-library.sql'].length, 5);
    assert.equal(IMPLEMENTED['002-catalog.sql'].length + IMPLEMENTED['010-attr-library.sql'].length, 17);
  });

  test('CMS blog slice is normalized and durable', () => {
    const cms = code('006-cms.sql');
    const blogsBlock = block(cms, 'blogs');

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

  test('admin-panel gaps are closed in the DDL', () => {
    // Design asset library.
    assert.match(code('006-cms.sql'), /CREATE\s+TABLE\s+design_assets\b/i);
    assert.match(code('006-cms.sql'), /usage IN \('product','section','blog','design'\)/i);
    // Media library display metadata.
    const mediaBlock = block(code('006-cms.sql'), 'media');
    assert.match(mediaBlock, /\bfilename\b\s+varchar\(255\)/i);
    assert.match(mediaBlock, /\bsize_bytes\b\s+bigint/i);

    // Account lifecycle: invited customers have no password yet.
    const usersBlock = block(code('001-auth.sql'), 'users');
    assert.match(usersBlock, /password_hash\s+varchar\(255\)(?!\s+NOT NULL)/i);
    assert.match(usersBlock, /status IN \('pending','active','disabled'\)/i);
    assert.match(usersBlock, /\blocked_until\b\s+timestamptz/i);

    // Collections carry the storefront's cover, tagline and schedule.
    const collectionsBlock = block(code('002-catalog.sql'), 'collections');
    assert.match(collectionsBlock, /\bcover_image_url\b\s+varchar\(2048\)/i);
    assert.match(collectionsBlock, /\btagline\b\s+varchar\(150\)/i);
    assert.match(collectionsBlock, /\bpublished_at\b\s+timestamptz/i);

    // Products carry the partner attribute the drawer edits.
    const productsBlock = block(code('002-catalog.sql'), 'products');
    assert.match(productsBlock, /\bpartner_provider\b/i);
    assert.match(productsBlock, /\bpartner_availability\b/i);

    // Addresses carry a recipient and a courier contact.
    const addressesBlock = block(code('011-household.sql'), 'addresses');
    assert.match(addressesBlock, /\brecipient_name\b\s+varchar\(120\)\s+NOT NULL/i);
    assert.match(addressesBlock, /\bphone\b\s+varchar\(30\)/i);

    // Payments record how the customer paid, not only who processed it.
    assert.match(block(code('004-orders.sql'), 'payments'), /\bmethod\b\s+varchar\(20\)/i);

    // Shipment timeline is a child table.
    assert.match(code('004-orders.sql'), /CREATE\s+TABLE\s+shipment_events\b/i);

    // Analytics uses the non-colliding name.
    assert.match(code('013-analytics.sql'), /CREATE\s+TABLE\s+analytics_sessions\b/i);
    assert.equal(/CREATE\s+TABLE\s+sessions\b/i.test(code('013-analytics.sql')), false);

    // The bell's categories match the admin UI filters.
    assert.match(
      block(code('014-operations.sql'), 'notifications'),
      /kind IN \('order','cart','inventory','payment','system','marketing','refund'\)/i,
    );
  });

  test('idempotency guards live in the schema, not only in handlers', () => {
    const platform = code('005-platform.sql');
    const idem = block(platform, 'idempotency_keys');
    assert.match(idem, /UNIQUE \(scope, key\)/i);
    assert.match(block(platform, 'webhook_events'), /UNIQUE \(provider, provider_event_id\)/i);

    // Retried checkout cannot fork an order; survives idempotency_keys TTL.
    assert.match(block(code('004-orders.sql'), 'orders'), /\bidempotency_key\b\s+varchar\(255\)/i);
    assert.match(
      code('004-orders.sql'),
      /CREATE UNIQUE INDEX one_order_per_idempotency_key[\s\S]*?WHERE idempotency_key IS NOT NULL/i,
    );

    // Natural keys on the business tables.
    assert.match(
      code('002-catalog.sql'),
      /CREATE UNIQUE INDEX one_review_per_user_product ON reviews \(product_id, user_id\)/i,
    );
    assert.match(code('005-platform.sql'), /CREATE UNIQUE INDEX one_email_per_dedupe_key/i);
    assert.match(code('014-operations.sql'), /CREATE UNIQUE INDEX one_notification_per_dedupe_key/i);
    assert.match(
      block(code('004-orders.sql'), 'shipment_events'),
      /UNIQUE \(shipment_id, occurred_at, status\)/i,
    );
    assert.match(
      block(code('014-operations.sql'), 'support_messages'),
      /UNIQUE \(ticket_id, created_at, sender\)/i,
    );

    // Import report rows cannot double-log the same job.
    assert.match(code('001-auth.sql'), /one_import_summary_per_product_job/i);
  });

  test('event tables are partitioned and keep a default partition', () => {
    const analytics = code('013-analytics.sql');
    const raw = sqlText('013-analytics.sql');

    for (const table of PARTITION_PARENTS['013-analytics.sql']) {
      assert.match(
        raw,
        new RegExp(`CREATE\\s+TABLE\\s+${table}\\s*\\([\\s\\S]*?\\)\\s*PARTITION\\s+BY\\s+RANGE\\s*\\(ts\\)`, 'i'),
        `${table} must be RANGE-partitioned on ts`,
      );
      assert.match(
        raw,
        new RegExp(`CREATE\\s+TABLE\\s+${table}_default\\s+PARTITION\\s+OF\\s+${table}\\s+DEFAULT`, 'i'),
        `${table} needs a _default partition so inserts work before monthly partitions attach`,
      );
    }

    // Retention policy: the permanent rollup is a plain table.
    assert.equal(/PARTITION\s+BY/i.test(block(analytics, 'daily_stats')), false);
  });

  test('migration README declares the full apply order and no blocked file', () => {
    const readme = read(join(MIGRATE_DIR, 'README.md'));
    assert.match(readme, /Total.*\*\*88\*\*/);
    assert.equal(/blocked/i.test(readme), false, 'no file is blocked any more');
    for (const file of FILES) {
      assert.match(readme, new RegExp(file.replace('.', '\\.')), `${file} missing from the apply order`);
    }
  });
});
