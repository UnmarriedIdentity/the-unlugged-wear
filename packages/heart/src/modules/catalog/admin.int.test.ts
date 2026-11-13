// Break-it tests for the staff side of the catalog. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
const db = () => getDb();
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const count = async (q: ReturnType<typeof sql>) => (await db().execute<{ n: number }>(q)).rows[0]!.n;
const S = c.catalogSchemas;

const base = (over: Record<string, unknown> = {}) => S.productFields.parse({ name: 'Test Tee', slug: '', category: 'Tees', price: 999, stock: 10, colors: ['Black', 'White'], sizes: ['S', 'M'], partner: 'Custom Atelier', publicationStatus: 'draft', description: 'd', ...over });
/** What the editor sends back when nothing was changed. */
const asInput = (d: Awaited<ReturnType<typeof c.adminGetProduct>>, over: Record<string, unknown> = {}) => S.productFields.parse({
  name: d.name, slug: d.slug, category: d.category, price: d.price, basePrice: d.basePrice, priceAdjustments: d.priceAdjustments, compareAtPrice: d.compareAtPrice, stock: d.stock,
  colors: d.colors, sizes: d.sizes, partner: d.partner, publicationStatus: d.publicationStatus, description: d.description, styleCode: d.styleCode, weight: d.weight, shippingWeight: d.shippingWeight,
  dimensions: d.dimensions, gender: d.gender, taxRate: d.taxRate, hsnCode: d.hsnCode, photoSettings: d.photoSettings, discounts: d.discounts, images: d.images, variants: d.variants, attributes: d.attributes, care: d.care, ...over,
});

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'catalog-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('schemas refuse hostile input before it reaches the database', { skip }, () => {
  const bad = (o: Record<string, unknown>) => S.productFields.safeParse({ name: 'X', partner: 'Custom Atelier', publicationStatus: 'draft', price: 1, ...o }).success;
  assert.equal(bad({ price: -1 }), false);
  assert.equal(bad({ price: 1.005 }), false);
  assert.equal(bad({ images: ['javascript:alert(1)'] }), false);
  assert.equal(bad({ images: ['data:image/png;base64,AAAA'] }), false);
  assert.equal(bad({ images: ['//evil.example/x.png'] }), false);
  assert.equal(bad({ slug: '../etc' }), false);
  assert.equal(bad({ taxRate: 99 }), false);
  assert.equal(bad({ hsnCode: '12' }), false);
  assert.equal(bad({ discounts: [{ discountType: 'percent', value: 150, startsAt: '2026-01-01', endsAt: '2026-02-01', isActive: true }] }), false);
  assert.equal(bad({ discounts: [{ discountType: 'fixed', value: 10, startsAt: '2026-03-01', endsAt: '2026-02-01', isActive: true }] }), false);
  assert.equal(bad({ images: ['/images/a.png', 'https://cdn.example/a.png'] }), true);
});

test('create: matrix, conserved stock, unknown category and bad weight refused, publish rules', { skip }, async () => {
  const p = await c.adminCreateProduct(base({ slug: 'create-tee' }), actor);
  assert.equal(p.variants.length, 4);
  assert.equal(p.variants.reduce((n, v) => n + v.stock, 0), 10);
  assert.equal(p.publicationStatus, 'draft');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'create-tee' }), actor)), 'CONFLICT');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'no-cat', category: 'Ghosts' }), actor)), 'VALIDATION_FAILED');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'bad-w', weight: 'heavy' }), actor)), 'VALIDATION_FAILED');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'no-pub', category: '', publicationStatus: 'published' }), actor)), 'RULE_VIOLATION');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'free-pub', price: 0, publicationStatus: 'published' }), actor)), 'RULE_VIOLATION');
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'cmp', compareAtPrice: 999 }), actor)), 'VALIDATION_FAILED');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE slug IN ('no-cat','bad-w','no-pub','free-pub','cmp')`), 0, 'refused saves leave nothing behind');
});

test('imported tiers: anchor is retail, and an unchanged save moves no price', { skip }, async () => {
  const report = await c.importQikinkListing([
    { qikinkId: 1, gender: 'Unisex', style: 'Tier Tee | UT01', sizes: 'S,M', colors: 'Black', basePriceINR: 300, hsn: '610910' },
    { qikinkId: 2, gender: 'Unisex', style: 'Tier Tee | UT01', sizes: 'XXL', colors: 'Black', basePriceINR: 360, hsn: '610910' },
  ], { actorId: actor });
  const id = report.products[0]!.productId;
  const d = await c.adminGetProduct(id);
  assert.equal(d.basePrice, 799, 'anchor is the lowest retail tier, never the ₹300 partner cost');
  assert.equal(d.variants.find((v) => v.size === 'XXL')!.price, 899);
  assert.equal(d.variants.find((v) => v.size === 'XXL')!.priceOverridden, true, 'tiers are pinned');
  assert.equal(d.variants.find((v) => v.size === 'S')!.priceOverridden, undefined);
  const saved = await c.adminUpdateProduct(id, asInput(d), actor);
  assert.deepEqual(saved.variants.map((v) => [v.size, v.price]).sort(), d.variants.map((v) => [v.size, v.price]).sort());
  assert.equal(saved.price, 799);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE product_id = ${id}`), 0, 'no stock change, no ledger row');
});

test('edit: rename keeps the old URL, image labels survive, removed variants switch off, stock is ledgered', { skip }, async () => {
  const p = await c.adminCreateProduct(base({ slug: 'old-url', images: ['/a.png', '/b.png'] }), actor);
  await db().execute(sql`UPDATE product_images SET label = '01 · FRONT' WHERE product_id = ${p.id} AND url = '/a.png'`);
  const keep = p.variants.filter((v) => v.color === 'Black').map((v, i) => (i === 0 ? { ...v, stock: v.stock + 7 } : v));
  const d = await c.adminUpdateProduct(p.id, asInput(await c.adminGetProduct(p.id), { slug: 'new-url', publicationStatus: 'published', images: ['/b.png', '/a.png'], variants: keep }), actor);
  assert.equal(d.slug, 'new-url');
  assert.deepEqual(d.images, ['/b.png', '/a.png'], 'first image is the cover');
  const { products } = await c.getStorefrontCatalog();
  const live = products.find((x) => x.productId === p.id)!;
  assert.deepEqual(live.aliases, ['old-url']);
  assert.deepEqual(live.colors.map((x) => x.value), ['black'], 'switched-off colour is gone from the storefront');
  assert.equal(live.images.find((i) => i.url === '/a.png')!.label, '01 · FRONT');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM product_variants WHERE product_id = ${p.id} AND NOT is_active`), 2, 'kept for order history');
  const m = (await db().execute<{ qty_change: number; reason: string }>(sql`SELECT qty_change, reason FROM stock_movements WHERE product_id = ${p.id}`)).rows;
  assert.ok(m.some((x) => x.qty_change === 7 && x.reason === 'admin_adjustment'));
  assert.equal(await code(c.adminCreateProduct(base({ slug: 'old-url' }), actor)), 'CONFLICT', 'an alias is still a taken URL');
  const back = await c.adminUpdateProduct(p.id, asInput(d, { slug: 'old-url' }), actor);
  assert.equal(back.slug, 'old-url', 'a product may take back its own alias');
});

test('stale edits are refused; parallel saves leave one consistent product; SKU clashes are named', { skip }, async () => {
  const p = await c.adminCreateProduct(base({ slug: 'race' }), actor);
  const d = await c.adminGetProduct(p.id);
  await c.adminUpdateProduct(p.id, asInput(d, { description: 'first' }), actor, d.updatedAt);
  assert.equal(await code(c.adminUpdateProduct(p.id, asInput(d, { description: 'stale' }), actor, d.updatedAt)), 'CONFLICT');
  await Promise.all([5, 6, 7, 8].map((n) => c.adminUpdateProduct(p.id, asInput(d, { description: `v${n}` }), actor)));
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM product_variants WHERE product_id = ${p.id}`), 4);
  const other = await c.adminCreateProduct(base({ slug: 'sku-owner' }), actor);
  const clash = d.variants.map((v, i) => (i === 0 ? { ...v, sku: other.variants[0]!.sku } : v));
  assert.equal(await code(c.adminUpdateProduct(p.id, asInput(await c.adminGetProduct(p.id), { variants: clash }), actor)), 'CONFLICT');
});

test('bulk status reports refusals; soft delete hides, keeps the row and the URL', { skip }, async () => {
  const ok = await c.adminCreateProduct(base({ slug: 'bulk-ok' }), actor);
  const noCat = await c.adminCreateProduct(base({ slug: 'bulk-nocat', category: '' }), actor);
  const res = await c.adminSetProductsStatus([ok.id, noCat.id], 'published', actor);
  assert.deepEqual(res.updated, [ok.id]);
  assert.equal(res.refused[0]!.reason, 'needs a category');
  assert.ok((await c.getStorefrontCatalog()).products.some((p) => p.productId === ok.id));
  await c.adminDeleteProducts([ok.id], actor);
  assert.equal((await c.getStorefrontCatalog()).products.some((p) => p.productId === ok.id), false);
  assert.equal((await c.adminListProducts()).some((p) => p.id === ok.id), false);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE id = ${ok.id}`), 1);
  assert.equal(await code(c.adminUpdateProduct(ok.id, base(), actor)), 'NOT_FOUND');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'product.delete'`), 1);
});

test('collections: order kept, drop date required, future drops hidden, ghosts refused', { skip }, async () => {
  const a = await c.adminCreateProduct(base({ slug: 'col-a', publicationStatus: 'published' }), actor);
  const b = await c.adminCreateProduct(base({ slug: 'col-b', publicationStatus: 'published' }), actor);
  const col = (o: Record<string, unknown>) => S.collectionFields.parse({ name: 'Drop', slug: 'drop', visibility: 'published', productIds: [b.id, a.id], ...o });
  const list = await c.adminSaveCollection(undefined, col({}), actor);
  assert.deepEqual(list.find((x) => x.slug === 'drop')!.productIds, [b.id, a.id]);
  const live = (await c.getStorefrontCatalog()).collections.find((x) => x.slug === 'drop')!;
  assert.deepEqual(live.productIds, [b.id, a.id]);
  assert.equal(S.collectionFields.safeParse({ name: 'X', slug: 'x', visibility: 'scheduled' }).success, false);
  assert.equal(await code(c.adminSaveCollection(undefined, col({}), actor)), 'CONFLICT');
  await c.adminSaveCollection(undefined, col({ slug: 'later', visibility: 'scheduled', publishedAt: new Date(Date.now() + 86_400_000).toISOString() }), actor);
  assert.equal((await c.getStorefrontCatalog()).collections.some((x) => x.slug === 'later'), false);
  assert.equal(await code(c.adminSaveCollection(undefined, col({ slug: 'ghost', productIds: ['00000000-0000-7000-8000-000000000999'] }), actor)), 'VALIDATION_FAILED');
  const id = list.find((x) => x.slug === 'drop')!.id;
  await c.adminDeleteCollection(id, actor);
  assert.equal(await code(c.adminDeleteCollection(id, actor)), 'NOT_FOUND');
});

test('categories: unique names, reserved name, delete refused while in use', { skip }, async () => {
  assert.equal(await code(c.adminSaveCategory(S.categoryFields.parse({ name: 'TEES' }), actor)), 'CONFLICT');
  assert.equal(await code(c.adminSaveCategory(S.categoryFields.parse({ name: 'uncategorized' }), actor)), 'VALIDATION_FAILED');
  const tees = (await c.adminListCategories()).find((x) => x.name === 'Tees')!;
  assert.ok(tees.productCount > 0);
  assert.equal(await code(c.adminDeleteCategory(tees.id, actor)), 'RULE_VIOLATION');
  const list = await c.adminSaveCategory(S.categoryFields.parse({ name: 'Empty Shelf' }), actor);
  const shelf = list.find((x) => x.name === 'Empty Shelf')!;
  assert.equal(shelf.slug, 'empty-shelf');
  assert.equal((await c.adminDeleteCategory(shelf.id, actor)).some((x) => x.id === shelf.id), false);
  const hidden = await c.adminSaveCategory(S.categoryFields.parse({ id: tees.id, name: 'Tees', slug: tees.slug, showInMegamenu: false }), actor);
  assert.equal(hidden.find((x) => x.id === tees.id)!.showInMegamenu, false);
  assert.equal((await c.getStorefrontCatalog()).categories.find((x) => x.slug === tees.slug)!.showInMegamenu, false);
});
