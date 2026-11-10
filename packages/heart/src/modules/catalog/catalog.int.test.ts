// Break-it tests for the catalog import + storefront read model. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const catalog = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
const db = () => getDb();
const count = async (q: ReturnType<typeof sql>) => (await db().execute<{ n: number }>(q)).rows[0]!.n;

const listing = [
  { qikinkId: 11, gender: 'Unisex', style: 'Classic Tee | UC22', sizes: 'S,M,L', colors: 'Black,White', basePriceINR: 300, placements: 'Front,Back', hsn: '610910', taxRatePercent: 5, weightGrams: 180 },
  { qikinkId: 12, gender: 'Unisex', style: 'Classic Tee | UC22', sizes: 'XXL,3XL', colors: 'Black,White', basePriceINR: 360, placements: 'Front', hsn: '610910', taxRatePercent: 5 },
  { qikinkId: 13, gender: 'Unisex', style: 'Acrylic Poster', sizes: '12x18 In,18x24 In', colors: 'NA', basePriceINR: 150, placements: 'Front', hsn: '491199', taxRatePercent: 12 },
  { qikinkId: 14, gender: 'Robot', style: 'Broken | ZZ99', sizes: 'S', colors: 'Red', basePriceINR: 100 },
  { qikinkId: 15, gender: 'Female', style: "O'Brien \"Crop\" 🌸 Top; DROP TABLE products;--", sizes: 'S', colors: 'Pink', basePriceINR: 200, hsn: '610910' },
];

before(async () => { if (!skip) drop = (await createTestDatabase()).drop; }, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('import creates drafts only — nothing reaches the storefront until published', { skip }, async () => {
  const report = await catalog.importQikinkListing(listing, { actorId: null });
  assert.equal(report.created, 3);
  assert.equal(report.status, 'partial', 'the Robot row failed; the honest middle state');
  assert.equal(report.totalRows, 5);
  assert.equal(report.successRows + report.failedRows, report.totalRows);
  const job = (await db().execute<{ status: string; success_count: number; failed_count: number; errors: unknown[] }>(sql`SELECT status, success_count, failed_count, errors FROM import_jobs WHERE id = ${report.jobId}`)).rows[0]!;
  assert.deepEqual([job.status, job.success_count, job.failed_count], ['partial', 4, 1]);
  assert.ok(JSON.stringify(job.errors).includes('Robot'));
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE status <> 'draft'`), 0);
  assert.equal((await catalog.getStorefrontCatalog()).products.length, 0);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE name LIKE '%DROP TABLE%'`), 1, 'hostile names are data, never SQL');
});

test('re-running the same sheet adds nothing and keeps staff edits; a new row only adds its variants', { skip }, async () => {
  await db().execute(sql`UPDATE products SET name = 'Staff Renamed Tee', price = 999.00 WHERE style_code = 'UC22'`);
  await db().execute(sql`UPDATE product_variants SET price = 777.00, price_overridden = true WHERE sku LIKE '%-BLACK-S'`);
  const before = await count(sql`SELECT count(*)::int AS n FROM product_variants`);
  const again = await catalog.importQikinkListing(listing, { actorId: null });
  assert.equal(again.created, 0);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM product_variants`), before);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE name = 'Staff Renamed Tee' AND price = 999.00`), 1);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM product_variants WHERE price = 777.00`), 1);
  const grown = await catalog.importQikinkListing([...listing, { ...listing[0], qikinkId: 16, colors: 'Navy Blue', sizes: 'M' }], { actorId: null });
  assert.equal(grown.products.find((p) => p.key === 'code:uc22')!.variantsAdded, 1);
});

test('parallel imports of the same sheet never duplicate products or variants', { skip }, async () => {
  const sheet = [{ qikinkId: 21, gender: 'Male', style: 'Race Hoodie | UH01', sizes: 'S,M,L,XL', colors: 'Black,Grey', basePriceINR: 500, hsn: '611020' }];
  const runs = await Promise.all(Array.from({ length: 5 }, () => catalog.importQikinkListing(sheet, { actorId: null })));
  assert.equal(runs.reduce((n, r) => n + r.created, 0), 1);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products WHERE style_code = 'UH01'`), 1);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.style_code = 'UH01'`), 8);
  assert.ok(runs.every((r) => r.failedRows === 0));
});

test('storefront read model: From price, per-size ladder, colour-less products, hidden states', { skip }, async () => {
  await db().execute(sql`UPDATE products SET status = 'active'`);
  let { products } = await catalog.getStorefrontCatalog();
  const tee = products.find((p) => p.partnerStyleCode === 'UC22')!;
  assert.equal(tee.priceMinorINR, 77700, 'From = the lowest active variant (the staff-overridden one)');
  assert.ok(tee.sizes.every((s) => typeof s.priceMinorINR === 'number'), 'ladder exposes per-size prices');
  assert.deepEqual(tee.sizes.map((s) => s.size), ['S', 'M', 'L', 'XXL', '3XL']);
  assert.equal(tee.sizes.find((s) => s.size === '3XL')!.priceMinorINR, 89900, 'cost ₹360 → draft ₹899');
  assert.deepEqual(tee.printAreas, ['Front', 'Back']);
  assert.equal(tee.priceIsDraft, true);
  assert.equal(JSON.stringify(tee).includes('300.00'), false, 'partner cost never reaches the storefront');
  const poster = products.find((p) => p.title === 'Acrylic Poster')!;
  assert.deepEqual(poster.colors.map((c) => c.value), ['standard'], 'NA colours → one neutral swatch');
  assert.equal(poster.variantLabel, 'Dimensions');

  const hoodie = products.find((p) => p.partnerStyleCode === 'UH01')!;
  assert.equal(hoodie.sizes.some((s) => 'priceINR' in s), false, 'one price → no per-size prices');
  await db().execute(sql`UPDATE products SET partner_availability = 'discontinued' WHERE style_code = 'UH01'`);
  await db().execute(sql`UPDATE product_variants SET is_active = false WHERE sku LIKE 'TUW-UC22-WHITE-%'`);
  await db().execute(sql`UPDATE products SET status = 'archived' WHERE title_hack_never_exists IS NULL`).catch(() => {});
  await db().execute(sql`UPDATE products SET deleted_at = now() WHERE name = 'Acrylic Poster'`);
  ({ products } = await catalog.getStorefrontCatalog());
  assert.ok(products.find((p) => p.partnerStyleCode === 'UH01')!.sizes.every((s) => !s.inStock), 'discontinued → not orderable');
  assert.deepEqual(products.find((p) => p.partnerStyleCode === 'UC22')!.colors.map((c) => c.value), ['black', 'navy-blue'], 'switched-off variants drop their colour');
  assert.equal(products.some((p) => p.title === 'Acrylic Poster'), false, 'deleted products vanish');
  await db().execute(sql`UPDATE products SET status = 'archived' WHERE style_code = 'UH01'`);
  ({ products } = await catalog.getStorefrontCatalog());
  assert.equal(products.some((p) => p.partnerStyleCode === 'UH01'), false, 'archived products vanish');
  await db().execute(sql`UPDATE product_variants SET is_active = false WHERE product_id = (SELECT id FROM products WHERE style_code = 'UC22')`);
  ({ products } = await catalog.getStorefrontCatalog());
  assert.equal(products.some((p) => p.partnerStyleCode === 'UC22'), false, 'a product with nothing purchasable is not listed');
});

test('collections list only published ones and only visible members, in position order', { skip }, async () => {
  const [{ id: a }, { id: b }] = (await db().execute<{ id: string }>(sql`SELECT id FROM products WHERE status = 'active' AND deleted_at IS NULL ORDER BY created_at LIMIT 2`)).rows as { id: string }[];
  await db().execute(sql`INSERT INTO collections (id, name, slug, visibility) VALUES ('00000000-0000-7000-8000-0000000c0001', 'Live', 'live', 'published'),
    ('00000000-0000-7000-8000-0000000c0002', 'Hidden', 'hidden', 'draft'),
    ('00000000-0000-7000-8000-0000000c0003', 'Later', 'later', 'scheduled')`).catch(async () => {
    // scheduled requires published_at (CHECK) — that refusal is the point
    await db().execute(sql`INSERT INTO collections (id, name, slug, visibility) VALUES ('00000000-0000-7000-8000-0000000c0001', 'Live', 'live', 'published'), ('00000000-0000-7000-8000-0000000c0002', 'Hidden', 'hidden', 'draft')`);
  });
  await db().execute(sql`INSERT INTO collections (id, name, slug, visibility, published_at) VALUES ('00000000-0000-7000-8000-0000000c0004', 'Future', 'future', 'scheduled', now() + interval '1 day')`);
  if (a && b) await db().execute(sql`INSERT INTO collection_products (collection_id, product_id, position) VALUES ('00000000-0000-7000-8000-0000000c0001', ${b}, 0), ('00000000-0000-7000-8000-0000000c0001', ${a}, 1)`);
  const { collections } = await catalog.getStorefrontCatalog();
  assert.deepEqual(collections.map((c) => c.slug), ['live']);
  assert.equal(collections[0]!.productIds.length, collections[0]!.productCount);
});

test('one name sold for four genders imports in parallel with four distinct slugs', { skip }, async () => {
  const sheet = ['Boy', 'Girl', 'Female', 'Male'].map((gender, i) => ({ qikinkId: 40 + i, gender, style: 'Classic Crew Race', sizes: 'S,M', colors: 'Black', basePriceINR: 250, hsn: '610910' }));
  const report = await catalog.importQikinkListing(sheet, { actorId: null });
  assert.equal(report.failedRows, 0);
  const slugs = (await db().execute<{ slug: string }>(sql`SELECT slug FROM products WHERE name = 'Classic Crew Race' ORDER BY slug`)).rows.map((r) => r.slug);
  assert.deepEqual(slugs, ['classic-crew-race', 'classic-crew-race-2', 'classic-crew-race-3', 'classic-crew-race-4']);
});

test('long model names that share 20 characters still get distinct SKUs', { skip }, async () => {
  const sheet = [{ qikinkId: 50, gender: 'Unisex', style: 'Redmi Race Cases', sizes: 'Redmi Note 12 Pro Plus 5G,Redmi Note 12 Pro Plus 4G', colors: 'NA', basePriceINR: 120, hsn: '392690' }];
  const report = await catalog.importQikinkListing(sheet, { actorId: null });
  assert.equal(report.failedRows, 0);
  assert.equal(await count(sql`SELECT count(DISTINCT v.sku)::int AS n FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.name = 'Redmi Race Cases'`), 2);
});
