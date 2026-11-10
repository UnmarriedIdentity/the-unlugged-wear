-- 001-seed-core.sql — Core reference data (idempotent)
-- Source of truth: DOC/backend/03-Auth-RBAC.md §4 (roles/permissions),
-- 04-Catalog.md (attribute library), 19-Styling-Recommendations.md §2 (the
-- day-zero complement matrix), 09-CMS-Media.md (settings rows).
--
-- Rules this file obeys:
--   * Re-runnable: every statement is ON CONFLICT DO NOTHING, so applying it
--     twice (or on every deploy) changes nothing the second time.
--   * Deterministic ids: the namespace 00000000-0000-4000-8000-0000000000XX
--     is reserved for seed rows — block 01 roles, 02 permissions,
--     03 attribute_definitions, 04 attribute_values, 05 styling_slots,
--     06 styling_slot_rules, 07 cms_settings, 08 navigation_settings,
--     09 discount_codes. Real rows always use app-generated UUIDv7, so a
--     seed row can never collide with a live one.
--   * No credentials: no users, no password hashes, no tokens, no API keys.
--     The first admin is created by the env-driven bootstrap script.
--   * No fabricated business data: no orders, no usage counts. `uses_count`
--     starts at 0 on every coupon — a seeded redemption count would be a lie
--     the reports cannot undo.
--   * Secrets never land in store_settings (see 007-cms-pages.sql).

-- -------------------------------------------------------- 1. roles (4)
-- The DB vocabulary is fixed: admin / support / warehouse / customer.
-- Admin UI personas (Owner, Operations, Content, Read-only) map onto these;
-- see 03-Auth-RBAC.md. `customer` holds no permissions on purpose —
-- customer abilities are identity-scoped (own cart/orders/addresses).
INSERT INTO roles (id, name, slug, description) VALUES
  ('00000000-0000-4000-8000-000000000101', 'Admin',     'admin',
   'Full access: every permission, every module'),
  ('00000000-0000-4000-8000-000000000102', 'Support',   'support',
   'Customer support: read/update orders, read/update customers'),
  ('00000000-0000-4000-8000-000000000103', 'Warehouse', 'warehouse',
   'Fulfilment: read/update orders, manage shipments'),
  ('00000000-0000-4000-8000-000000000104', 'Customer',  'customer',
   'Storefront shopper with no admin permissions')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------- 2. permissions (19)
INSERT INTO permissions (id, name, slug, description) VALUES
  ('00000000-0000-4000-8000-000000000201', 'Create product',      'product.create',
   'Add products and variants'),
  ('00000000-0000-4000-8000-000000000202', 'Update product',      'product.update',
   'Edit products, variants, media and pricing'),
  ('00000000-0000-4000-8000-000000000203', 'Archive product',     'product.archive',
   'Soft-delete and restore products'),
  ('00000000-0000-4000-8000-000000000204', 'Import products',     'product.import',
   'Run CSV imports and review their reports'),
  ('00000000-0000-4000-8000-000000000205', 'Manage categories',   'category.manage',
   'Create, reorder and retire catalog categories'),
  ('00000000-0000-4000-8000-000000000206', 'Manage discounts',    'discount.manage',
   'Create and retire product discounts and codes'),
  ('00000000-0000-4000-8000-000000000207', 'View orders',         'order.view',
   'Read the order queue and order detail'),
  ('00000000-0000-4000-8000-000000000208', 'Update order status', 'order.update_status',
   'Move an order along the fulfilment states'),
  ('00000000-0000-4000-8000-000000000209', 'Refund order',        'order.refund',
   'Issue and approve refunds'),
  ('00000000-0000-4000-8000-00000000020a', 'Manage shipments',    'shipment.manage',
   'Create shipments, print labels, push carrier updates'),
  ('00000000-0000-4000-8000-00000000020b', 'View customers',      'customer.view',
   'Read customer profiles, notes and order history'),
  ('00000000-0000-4000-8000-00000000020c', 'Update customer status', 'customer.update_status',
   'Enable or disable a customer account'),
  ('00000000-0000-4000-8000-00000000020d', 'Edit content',        'cms.edit',
   'Edit pages, sections, blog drafts and media'),
  ('00000000-0000-4000-8000-00000000020e', 'Publish content',     'cms.publish',
   'Publish or schedule pages and blog posts'),
  ('00000000-0000-4000-8000-00000000020f', 'Manage media',        'media.manage',
   'Upload, replace and delete R2 assets'),
  ('00000000-0000-4000-8000-000000000210', 'Manage users',        'user.manage',
   'Invite staff, disable accounts'),
  ('00000000-0000-4000-8000-000000000211', 'Manage roles',        'role.manage',
   'Grant and revoke roles and permissions'),
  ('00000000-0000-4000-8000-000000000212', 'Manage settings',     'settings.manage',
   'Write store_settings (brand, shipping, tax, payments)'),
  ('00000000-0000-4000-8000-000000000213', 'View reports',        'report.view',
   'Read analytics and revenue reports')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------ 3. role_permissions
-- admin gets everything (SELECT-join, so a new permission is granted
-- automatically and re-running this file heals a missed grant).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.slug IN (
  'order.view', 'order.update_status', 'customer.view', 'customer.update_status'
)
WHERE r.slug = 'support'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.slug IN (
  'order.view', 'order.update_status', 'shipment.manage'
)
WHERE r.slug = 'warehouse'
ON CONFLICT DO NOTHING;

-- customer holds no rows here (identity-scoped abilities, not permissions).

-- ------------------------------------- 4. attribute_definitions (9 rows)
-- The single attribute system. Four definitions carry shopper-facing values
-- now; five are semantic types created empty and filled by the importer.
-- show_on_pdp defaults true except `placements`, which is an internal
-- production attribute (admin-only). show_on_checkout is opt-in for all.
INSERT INTO attribute_definitions
  (id, name, slug, display_type, is_active, show_on_pdp, show_on_checkout, show_on_admin)
VALUES
  ('00000000-0000-4000-8000-000000000301', 'Color',      'color',      'swatch', true, true,  false, true),
  ('00000000-0000-4000-8000-000000000302', 'Size',       'size',       'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000303', 'Placements', 'placements', 'radio',  true, false, false, true),
  ('00000000-0000-4000-8000-000000000304', 'Fabric',     'fabric',     'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000305', 'Model',      'model',      'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000306', 'Dimensions', 'dimensions', 'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000307', 'Capacity',   'capacity',   'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000308', 'Shape',      'shape',      'pill',   true, true,  false, true),
  ('00000000-0000-4000-8000-000000000309', 'Style',      'style',      'pill',   true, true,  false, true)
ON CONFLICT DO NOTHING;

-- ------------------------------------------ attribute_values (22 rows)
-- Colors carry swatch_hex (the storefront swatch and the styling HSL
-- harmony engine both read it); the other definitions are text-only.
INSERT INTO attribute_values (id, definition_id, value, swatch_hex, position) VALUES
  ('00000000-0000-4000-8000-000000010101', '00000000-0000-4000-8000-000000000301', 'Black',       '#000000', 0),
  ('00000000-0000-4000-8000-000000010102', '00000000-0000-4000-8000-000000000301', 'Onyx',        '#353839', 1),
  ('00000000-0000-4000-8000-000000010103', '00000000-0000-4000-8000-000000000301', 'Chalk White', '#F5F2EC', 2),
  ('00000000-0000-4000-8000-000000010104', '00000000-0000-4000-8000-000000000301', 'Olive',       '#6B6B47', 3),
  ('00000000-0000-4000-8000-000000010105', '00000000-0000-4000-8000-000000000301', 'Navy Blue',   '#1B2A4A', 4),
  ('00000000-0000-4000-8000-000000010106', '00000000-0000-4000-8000-000000000301', 'Maroon',      '#6E1423', 5),
  ('00000000-0000-4000-8000-000000020101', '00000000-0000-4000-8000-000000000302', 'XS',  NULL, 0),
  ('00000000-0000-4000-8000-000000020102', '00000000-0000-4000-8000-000000000302', 'S',   NULL, 1),
  ('00000000-0000-4000-8000-000000020103', '00000000-0000-4000-8000-000000000302', 'M',   NULL, 2),
  ('00000000-0000-4000-8000-000000020104', '00000000-0000-4000-8000-000000000302', 'L',   NULL, 3),
  ('00000000-0000-4000-8000-000000020105', '00000000-0000-4000-8000-000000000302', 'XL',  NULL, 4),
  ('00000000-0000-4000-8000-000000020106', '00000000-0000-4000-8000-000000000302', 'XXL', NULL, 5),
  ('00000000-0000-4000-8000-000000030101', '00000000-0000-4000-8000-000000000303', 'Front',        NULL, 0),
  ('00000000-0000-4000-8000-000000030102', '00000000-0000-4000-8000-000000000303', 'Back',         NULL, 1),
  ('00000000-0000-4000-8000-000000030103', '00000000-0000-4000-8000-000000000303', 'Left Pocket',  NULL, 2),
  ('00000000-0000-4000-8000-000000030104', '00000000-0000-4000-8000-000000000303', 'Right Pocket', NULL, 3),
  ('00000000-0000-4000-8000-000000030105', '00000000-0000-4000-8000-000000000303', 'Left Sleeve',  NULL, 4),
  ('00000000-0000-4000-8000-000000030106', '00000000-0000-4000-8000-000000000303', 'Right Sleeve', NULL, 5),
  ('00000000-0000-4000-8000-000000040101', '00000000-0000-4000-8000-000000000304', 'Cotton',       NULL, 0),
  ('00000000-0000-4000-8000-000000040102', '00000000-0000-4000-8000-000000000304', 'French Terry', NULL, 1),
  ('00000000-0000-4000-8000-000000040103', '00000000-0000-4000-8000-000000000304', 'Fleece',       NULL, 2),
  ('00000000-0000-4000-8000-000000040104', '00000000-0000-4000-8000-000000000304', 'Linen',        NULL, 3)
ON CONFLICT DO NOTHING;

-- --------------------------------------------- 5. styling_slots (6 rows)
-- Internal outfit vocabulary, not the nav tree (19 §2).
INSERT INTO styling_slots (id, slug, name, sort_order) VALUES
  ('00000000-0000-4000-8000-000000050101', 'top',       'Top',       1),
  ('00000000-0000-4000-8000-000000050102', 'bottom',    'Bottom',    2),
  ('00000000-0000-4000-8000-000000050103', 'outerwear', 'Outerwear', 3),
  ('00000000-0000-4000-8000-000000050104', 'headwear',  'Headwear',  4),
  ('00000000-0000-4000-8000-000000050105', 'footwear',  'Footwear',  5),
  ('00000000-0000-4000-8000-000000050106', 'accessory', 'Accessory', 6)
ON CONFLICT DO NOTHING;

-- ------------------------------- styling_slot_rules (30-row matrix)
-- Verbatim from 19 §2. Direction matters: the two directions of a pair are
-- independent rows and grow apart as evidence arrives. Weight 0-100.
INSERT INTO styling_slot_rules (id, source_slot_id, target_slot_id, weight)
SELECT v.id, s.id, t.id, v.weight
FROM (VALUES
  ('00000000-0000-4000-8000-000000060101'::uuid, 'top',       'bottom',    20),
  ('00000000-0000-4000-8000-000000060102'::uuid, 'top',       'outerwear',  8),
  ('00000000-0000-4000-8000-000000060103'::uuid, 'top',       'headwear',  12),
  ('00000000-0000-4000-8000-000000060104'::uuid, 'top',       'footwear',  10),
  ('00000000-0000-4000-8000-000000060105'::uuid, 'top',       'accessory',  6),
  ('00000000-0000-4000-8000-000000060106'::uuid, 'bottom',    'top',       20),
  ('00000000-0000-4000-8000-000000060107'::uuid, 'bottom',    'outerwear',  8),
  ('00000000-0000-4000-8000-000000060108'::uuid, 'bottom',    'headwear',  12),
  ('00000000-0000-4000-8000-000000060109'::uuid, 'bottom',    'footwear',  10),
  ('00000000-0000-4000-8000-000000060110'::uuid, 'bottom',    'accessory',  6),
  ('00000000-0000-4000-8000-000000060111'::uuid, 'outerwear', 'top',       16),
  ('00000000-0000-4000-8000-000000060112'::uuid, 'outerwear', 'bottom',    16),
  ('00000000-0000-4000-8000-000000060113'::uuid, 'outerwear', 'headwear',  10),
  ('00000000-0000-4000-8000-000000060114'::uuid, 'outerwear', 'footwear',  10),
  ('00000000-0000-4000-8000-000000060115'::uuid, 'outerwear', 'accessory',  6),
  ('00000000-0000-4000-8000-000000060116'::uuid, 'headwear',  'top',       14),
  ('00000000-0000-4000-8000-000000060117'::uuid, 'headwear',  'bottom',    14),
  ('00000000-0000-4000-8000-000000060118'::uuid, 'headwear',  'outerwear',  8),
  ('00000000-0000-4000-8000-000000060119'::uuid, 'headwear',  'footwear',  10),
  ('00000000-0000-4000-8000-000000060120'::uuid, 'headwear',  'accessory',  6),
  ('00000000-0000-4000-8000-000000060121'::uuid, 'footwear',  'top',       10),
  ('00000000-0000-4000-8000-000000060122'::uuid, 'footwear',  'bottom',    12),
  ('00000000-0000-4000-8000-000000060123'::uuid, 'footwear',  'outerwear',  8),
  ('00000000-0000-4000-8000-000000060124'::uuid, 'footwear',  'headwear',   4),
  ('00000000-0000-4000-8000-000000060125'::uuid, 'footwear',  'accessory',  6),
  ('00000000-0000-4000-8000-000000060126'::uuid, 'accessory', 'top',       10),
  ('00000000-0000-4000-8000-000000060127'::uuid, 'accessory', 'bottom',    10),
  ('00000000-0000-4000-8000-000000060128'::uuid, 'accessory', 'outerwear',  8),
  ('00000000-0000-4000-8000-000000060129'::uuid, 'accessory', 'headwear',   8),
  ('00000000-0000-4000-8000-000000060130'::uuid, 'accessory', 'footwear',   8)
) AS v (id, source_slug, target_slug, weight)
JOIN styling_slots s ON s.slug = v.source_slug
JOIN styling_slots t ON t.slug = v.target_slug
ON CONFLICT DO NOTHING;

-- ------------------------------------------- 6. single-row settings
-- scope='global' is the unique key: the row exists once, forever.
INSERT INTO cms_settings (id, scope, theme) VALUES
  ('00000000-0000-4000-8000-000000070101', 'global', '{}')
ON CONFLICT DO NOTHING;

INSERT INTO navigation_settings (id, scope, navbar) VALUES
  ('00000000-0000-4000-8000-000000080101', 'global', '{}')
ON CONFLICT DO NOTHING;

-- ------------------------------------- 7. store_settings (14 keys)
-- Operational config only. No qikink.api_key, no gateway secret: those live
-- in env (09 §store_settings). Values are typed jsonb, not strings.
INSERT INTO store_settings (key, value) VALUES
  ('store.name',                 to_jsonb('The Unplugged Wear'::text)),
  ('store.legal_entity',         to_jsonb('The Unplugged Wear Apparel LLC'::text)),
  ('store.support_email',        to_jsonb('care@theunpluggedwear.com'::text)),
  ('store.currency',             to_jsonb('INR'::text)),
  -- Real IANA zone, not the mock's display string ("UTC+00:00 (London…)").
  ('store.timezone',             to_jsonb('Asia/Kolkata'::text)),
  ('brand.tagline',              to_jsonb('Unplugged Luxury & Urban Minimalism'::text)),
  ('brand.color',                to_jsonb('#7539FF'::text)),
  ('shipping.free_threshold',    to_jsonb(3000)),
  ('shipping.standard_fee',      to_jsonb(150)),
  ('tax.included',               to_jsonb(true)),
  ('fulfillment.partner',        to_jsonb('qikink'::text)),
  ('fulfillment.environment',    to_jsonb('sandbox'::text)),
  ('payments.stripe_live_mode',  to_jsonb(false)),
  ('notifications.order_email',  to_jsonb('orders@theunpluggedwear.com'::text))
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------ 8. discount_codes (3 rows)
-- No date window and uses_count 0: a seeded redemption count or an expired
-- window would silently break the first real checkout. Windows are set in
-- the admin once the campaign dates are confirmed.
INSERT INTO discount_codes
  (id, code, discount_type, value, min_order_amount, max_uses, uses_count, is_active)
VALUES
  ('00000000-0000-4000-8000-000000090101', 'UNPLUGGED10', 'percent', 10, 999,  500, 0, true),
  ('00000000-0000-4000-8000-000000090102', 'FLAT200',     'fixed',   200, 1499, NULL, 0, true),
  ('00000000-0000-4000-8000-000000090103', 'MINIMAL10',   'percent', 10, NULL, NULL, 0, true)
ON CONFLICT DO NOTHING;
