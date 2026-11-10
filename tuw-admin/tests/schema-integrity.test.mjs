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
const MIGRATE_DIR = join(HERE, '..', '..', 'db', 'migrate');
const DOCS_DIR = join(HERE, '..', '..', 'DOC', 'backend');

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
  '008-commerce-extras.sql',
  '009-fulfillment.sql',
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
    'return_status_history',
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
  '008-commerce-extras.sql': [
    'newsletter_subscribers',
    'faqs',
    'gift_cards',
    'gift_card_transactions',
    'stock_alert_subscriptions',
  ],
  '009-fulfillment.sql': [
    'integration_providers',
    'provider_product_mappings',
    'provider_cod_remittances',
    'fulfillment_orders',
    'fulfillment_order_items',
    'provider_wallet_ledger',
    'fulfillment_claims',
  ],
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
  test('inventory matches the 99 implemented tables, file by file', () => {
    const actual = {};
    for (const file of FILES) actual[file] = tablesIn(code(file));

    assert.deepEqual(actual, IMPLEMENTED);
    assert.equal(EXPECTED_IMPLEMENTED, 99);
    assert.equal(DOCUMENTED_ONLY.length, 0);
    assert.equal(EXPECTED_TOTAL, 99);
  });

  test('guest checkout, exchanges and no store credit are encoded in DDL', () => {
    const orders = code('004-orders.sql');
    const ordersBlock = block(orders, 'orders');
    assert.match(ordersBlock, /placed_by_user_id\s+uuid\s+REFERENCES/i);
    assert.match(ordersBlock, /guest_email\s+varchar\(255\)/i);
    assert.match(ordersBlock, /orders_buyer_identity/i);
    assert.match(ordersBlock, /order_type\s+varchar\(20\)/i);
    assert.match(block(orders, 'returns'), /replacement_order_id\s+uuid\s+UNIQUE REFERENCES orders/i);
    assert.match(block(orders, 'returns'), /requested_by_profile_id\s+uuid\s+NOT NULL/i);
    assert.match(block(orders, 'returns'), /price_difference\s+DECIMAL/i);
    assert.match(block(orders, 'refunds'), /'upi','bank_transfer'/);
    // Provider slugs are data rows, not CHECK lists.
    assert.match(code('009-fulfillment.sql'), /payments_provider_fk/);
    assert.equal(/provider IN \(/i.test(code('005-platform.sql')), false);
    assert.equal(/store_credit/i.test(orders), false, 'store credit is not a feature');
    assert.match(code('014-operations.sql'), /'contact_form'/);
  });

  test('columns live in CREATE TABLE; later files only attach forward FKs', () => {
    for (const file of FILES) {
      assert.equal(/ADD\s+COLUMN/i.test(code(file)), false, `${file} adds a column with ALTER`);
    }
    const products = block(code('002-catalog.sql'), 'products');
    assert.match(products, /exchange_policy\s+varchar\(20\)\s+NOT NULL DEFAULT 'defects_only'/i);
    const orders = code('004-orders.sql');
    assert.match(block(orders, 'orders'), /cancellable_until\s+timestamptz/i);
    assert.match(orders, /CREATE UNIQUE INDEX one_exchange_per_order_item/i);
    assert.match(block(orders, 'returns'), /cardinality\(evidence_media_ids\) >= 1/i);
  });

  test('money and stock writes carry duplicate guards', () => {
    const guards = {
      '002-catalog.sql': ['one_stock_movement_per_line_reason'],
      '004-orders.sql': [
        'one_order_per_idempotency_key', 'one_captured_payment_per_order',
        'one_refund_per_idempotency_key', 'one_refund_per_payout_reference',
        'one_return_per_idempotency_key', 'one_exchange_per_order_item',
        'one_replacement_per_order_item',
      ],
      '008-commerce-extras.sql': [
        'one_gift_card_redeem_per_order', 'one_gift_card_issue',
        'one_gift_card_reversal_per_order', 'one_gift_card_adjust_per_key',
      ],
      '009-fulfillment.sql': [
        'one_initial_submission_per_provider', 'one_provider_order_id',
        'one_wallet_entry_per_external_ref', 'one_wallet_entry_per_fulfillment_kind',
        'one_open_claim_per_type',
      ],
    };
    for (const [file, names] of Object.entries(guards)) {
      const sql = code(file);
      for (const name of names) {
        assert.match(sql, new RegExp(`CREATE UNIQUE INDEX ${name}\\b`), `${file}: ${name} missing`);
      }
    }
    assert.match(block(code('005-platform.sql'), 'idempotency_keys'), /UNIQUE \(scope, actor_ref, key\)/);
    assert.match(block(code('008-commerce-extras.sql'), 'gift_cards'), /UNIQUE \(purchased_order_item_id, purchased_unit_no\)/);
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

  test('009-fulfillment applies after 004-orders', () => {
    assert.ok(FILES.indexOf('004-orders.sql') < FILES.indexOf('009-fulfillment.sql'));
    // The dependency is real in the DDL, not just in the file name order.
    assert.match(code('009-fulfillment.sql'), /REFERENCES\s+orders\s*\(id\)/i);
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

  test('docs counts match 99 implemented tables', () => {
    const readme = read(join(DOCS_DIR, '00-README.md'));
    const dataTables = read(join(DOCS_DIR, '02-Data-Tables.md'));
    const catalog = read(join(DOCS_DIR, '04-Catalog.md'));

    assert.match(readme, /Data at a glance \(99 tables, all implemented in DDL\)/);
    assert.match(dataTables, /> 99 tables \(99 implemented DDL \+ 0 specified\)/);
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
    // The book is private to one profile: a household-scoped book would leak
    // one member's addresses into another member's account.
    assert.match(addressesBlock, /\bprofile_id\b\s+uuid\s+NOT NULL REFERENCES profiles \(id\)/i);
    assert.equal(/\bhousehold_id\b/.test(addressesBlock), false, 'addresses must not be household-scoped');
    assert.match(
      code('011-household.sql'),
      /CREATE UNIQUE INDEX one_default_shipping_per_profile\s*\n?\s*ON addresses \(profile_id\)/i,
    );

    // Returns are a request pipeline with a separate resolution axis, not just
    // an inbound-RMA stage (the four admin stages are a subset by design).
    const returnsSql = code('004-orders.sql');
    const returnsBlock = block(returnsSql, 'returns');
    assert.ok(returnsBlock.length > 0, 'returns CREATE TABLE block not found');
    assert.match(returnsBlock, /\brma_number\b\s+varchar\(30\)\s+NOT NULL UNIQUE/i);
    assert.match(returnsBlock, /status IN \('requested','approved','rejected'/i);
    assert.match(returnsBlock, /\bresolution\b\s+varchar\(20\)\s+NOT NULL DEFAULT 'pending'/i);
    assert.match(returnsBlock, /\brefund_id\b\s+uuid\s+UNIQUE REFERENCES refunds \(id\)/i);
    assert.match(returnsSql, /CREATE\s+TABLE\s+return_status_history\b/i);

    const returnItemsBlock = block(returnsSql, 'return_items');
    assert.match(returnItemsBlock, /\breason_code\b\s+varchar\(30\)\s+NOT NULL/i);
    assert.match(returnItemsBlock, /CHECK \(disposition <> 'exchange' OR exchange_variant_id IS NOT NULL\)/i);
    assert.match(returnItemsBlock, /UNIQUE \(return_id, order_item_id\)/i);

    // Over-return guard lives on the order line, where the aggregate can be a CHECK.
    const orderItemsBlock = block(returnsSql, 'order_items');
    assert.match(orderItemsBlock, /\breturned_qty\b\s+integer\s+NOT NULL DEFAULT 0/i);
    assert.match(orderItemsBlock, /CHECK \(returned_qty <= qty\)/i);

    // Family: soft leave keeps order history valid, and the composite FK makes
    // "order for a member of my own household" a database rule.
    const household = code('011-household.sql');
    assert.match(block(household, 'household_members'), /\bleft_at\b\s+timestamptz/i);
    assert.match(
      household,
      /CREATE UNIQUE INDEX one_active_household_per_profile[\s\S]*?WHERE left_at IS NULL/i,
    );
    assert.match(
      household,
      /ALTER TABLE orders[\s\S]*?FOREIGN KEY \(for_household_id, for_profile_id\)\s*\n?\s*REFERENCES household_members \(household_id, profile_id\)/i,
    );

    // Saved sizes: the composite FK proves the value belongs to its definition.
    const sizesBlock = block(household, 'profile_size_preferences');
    assert.match(sizesBlock, /\bsize_definition_id\b\s+uuid\s+NOT NULL REFERENCES attribute_definitions/i);
    assert.match(
      sizesBlock,
      /FOREIGN KEY \(size_definition_id, size_value_id\)\s*\n?\s*REFERENCES attribute_values \(definition_id, id\)/i,
    );
    assert.match(code('010-attr-library.sql'), /UNIQUE \(definition_id, id\)/i);

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
    assert.match(idem, /UNIQUE \(scope, actor_ref, key\)/i);
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
    assert.match(readme, /Total.*\*\*99\*\*/);
    assert.equal(/blocked/i.test(readme), false, 'no file is blocked any more');
    for (const file of FILES) {
      assert.match(readme, new RegExp(file.replace('.', '\\.')), `${file} missing from the apply order`);
    }
  });
});
