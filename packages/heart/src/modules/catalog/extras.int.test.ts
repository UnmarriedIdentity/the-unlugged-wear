// Break-it tests: search, attribute library, size charts, partner SKUs, reviews. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
const db = () => getDb();
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const count = async (q: ReturnType<typeof sql>) => (await db().execute<{ n: number }>(q)).rows[0]!.n;
const S = c.catalogSchemas;
const meta = { origin: 'https://shop.example.com' };
const product = (name: string, over: Record<string, unknown> = {}) => c.adminCreateProduct(S.productFields.parse({ name, slug: '', category: 'Tees', price: 999, colors: ['Black'], sizes: ['S', 'M'], partner: 'Qikink Direct API', publicationStatus: 'published', ...over }), actor);

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'extras-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('search: prefix, ranking, hidden products, and operators cannot be injected', { skip }, async () => {
  const hoodie = await product('Zephyr Hoodie');
  const mention = await product('Plain Scarf', { description: 'Goes well with any zephyr hoodie you own.' });
  const exact = await product('Zephyr', { styleCode: 'ZP01' });
  await product('Zephyr Draft', { publicationStatus: 'draft' });
  const ids = (await c.searchProducts('zephyr')).ids;
  assert.deepEqual(ids.slice(0, 2), [exact.id, hoodie.id], 'exact name, then name prefix');
  assert.equal(ids[ids.length - 1], mention.id, 'a mention in the description ranks last');
  assert.equal(ids.length, 3, 'drafts never appear');
  assert.ok((await c.searchProducts('zeph')).ids.includes(hoodie.id), 'prefix while typing');
  assert.ok((await c.searchProducts('HOODIES')).ids.includes(hoodie.id), 'stemming + case');
  assert.deepEqual((await c.searchProducts('zp01')).ids, [exact.id], 'style code');
  for (const hostile of ["hood & !", 'a:* | b', "'; DROP TABLE products;--", '(((', '\\', '%', '_', '🌸', '   ', 'x'.repeat(500)]) {
    const r = await c.searchProducts(hostile);
    assert.ok(Array.isArray(r.ids), `survives ${hostile.slice(0, 12)}`);
  }
  assert.equal((await c.searchProducts('%')).total, 0, 'a bare wildcard matches nothing');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM products`) > 0, true);
});

test('search terms: logged normalised, zero results kept, noise ignored', { skip }, async () => {
  await c.logSearch('  Blue   HOODIE ', 0);
  await c.logSearch('a', 0);
  await c.logSearch('x'.repeat(500), 3);
  const rows = (await db().execute<{ term: string; hits: number }>(sql`SELECT term, hits FROM search_terms ORDER BY ts`)).rows;
  assert.deepEqual(rows[0], { term: 'blue hoodie', hits: 0 });
  assert.equal(rows.length, 2);
  assert.equal(rows[1]!.term.length, 100);
});

test('attribute library: duplicates, core axes, in-use guards, visibility, PDP details', { skip }, async () => {
  let lib = await c.createAttribute(S.attributeCreate.parse({ name: 'Fabric Weight' }), actor);
  const def = lib.find((a) => a.name === 'Fabric Weight')!;
  assert.equal(await code(c.createAttribute(S.attributeCreate.parse({ name: 'fabric weight' }), actor)), 'CONFLICT');
  lib = await c.addAttributeValue(def.id, '240 GSM', actor);
  assert.equal(await code(c.addAttributeValue(def.id, '240 gsm', actor)), 'CONFLICT');
  const color = lib.find((a) => a.slug === 'color')!;
  assert.equal(await code(c.deleteAttribute(color.id, actor)), 'RULE_VIOLATION');
  assert.equal(await code(c.updateAttribute({ id: color.id, enabled: false }, actor)), 'RULE_VIOLATION');
  assert.equal(await code(c.updateAttribute({ id: def.id, showOnPdp: false, showOnCheckout: false, showOnAdmin: false }, actor)), 'RULE_VIOLATION');

  const p = await product('Attr Tee', { attributes: [{ name: 'Fabric Weight', values: ['240 GSM'], displayType: 'pill', swatchHex: {} }] });
  const details = async () => (await c.getStorefrontCatalog()).products.find((x) => x.productId === p.id)!.details;
  assert.ok((await details()).includes('Fabric Weight: 240 GSM'));
  await c.updateAttribute({ id: def.id, showOnPdp: false }, actor);
  assert.equal((await details()).some((d) => d.startsWith('Fabric Weight')), false, 'the toggle really hides it');
  assert.equal(await code(c.deleteAttribute(def.id, actor)), 'RULE_VIOLATION');
  assert.equal(await code(c.removeAttributeValue(def.id, '240 GSM', actor)), 'RULE_VIOLATION');
  await c.addAttributeValue(def.id, '300 GSM', actor);
  lib = await c.removeAttributeValue(def.id, '300 GSM', actor);
  assert.deepEqual(lib.find((a) => a.id === def.id)!.values, ['240 GSM']);
});

test('size charts: rules, ranges, link to products, delete guarded', { skip }, async () => {
  const chart = (o: Record<string, unknown>) => S.sizeChartFields.parse({ name: 'Tops', columns: ['Shoulder', 'Chest', 'Height'], rows: [{ size: 'S', measures: { Chest: 96, Height: '76–86', Shoulder: 44 } }], ...o });
  let charts = await c.saveSizeChart(chart({}), actor);
  const tops = charts.find((x) => x.name === 'Tops')!;
  assert.equal(await code(c.saveSizeChart(chart({ name: 'TOPS' }), actor)), 'CONFLICT');
  assert.equal(await code(c.saveSizeChart(chart({ name: 'Dup', rows: [{ size: 'M', measures: {} }, { size: 'm', measures: {} }] }), actor)), 'VALIDATION_FAILED');
  assert.equal(S.sizeChartFields.safeParse({ name: 'X', rows: [{ size: 'S', measures: { Chest: -1 } }] }).success, false);
  assert.equal(S.sizeChartFields.safeParse({ name: 'X', rows: [{ size: 'S', measures: { Chest: 'wide' } }] }).success, false);
  const p = await product('Chart Tee', { sizeChartId: tops.id });
  const live = await c.getStorefrontCatalog();
  assert.equal(live.products.find((x) => x.productId === p.id)!.sizeChartId, tops.id);
  assert.deepEqual(live.sizeCharts.find((x) => x.id === tops.id)!.columns, ['Shoulder', 'Chest', 'Height'], 'column order survives jsonb');
  assert.equal(await code(c.deleteSizeChart(tops.id, actor)), 'RULE_VIOLATION');
  assert.equal(await code(product('Ghost Chart', { sizeChartId: '00000000-0000-7000-8000-000000000999' })), 'VALIDATION_FAILED');
  charts = await c.saveSizeChart({ id: tops.id, name: 'Tops', columns: ['Chest'], rows: [{ size: 'L', measures: { Chest: 100 } }] }, actor);
  assert.equal(charts.find((x) => x.id === tops.id)!.rows[0]!.size, 'L');
});

test('editor fields: exchange policy saved; gift-card kind stays off the catalog', { skip }, async () => {
  const p = await product('Policy Tee', { exchangePolicy: 'exchangeable' });
  assert.equal((await c.adminGetProduct(p.id)).exchangePolicy, 'exchangeable');
  assert.equal(S.productFields.safeParse({ name: 'X', partner: 'Custom Atelier', publicationStatus: 'draft', price: 1, exchangePolicy: 'anything' }).success, false);
  const g = await product('Gift Voucher', { productKind: 'gift_card' });
  assert.equal((await c.getStorefrontCatalog()).products.some((x) => x.productId === g.id), false);
});

test('partner SKUs: exact cost, duplicates and foreign variants refused, blank removes, never public', { skip }, async () => {
  const a = await product('Map A');
  const b = await product('Map B');
  const rows = a.variants.map((v, i) => ({ variantId: v.id, providerSku: `v-a${i}`, unitCost: 310.5, payload: { printTypeId: 1 } }));
  let m = await c.saveMappings({ productId: a.id, rows }, actor);
  assert.equal(m.provider, 'qikink');
  assert.equal(m.variants[0]!.providerSku, 'v-a0');
  assert.equal(m.variants[0]!.unitCost, 310.5);
  assert.deepEqual(m.variants[0]!.payload, { printTypeId: 1 });
  assert.equal(await code(c.saveMappings({ productId: a.id, rows: [{ variantId: b.variants[0]!.id, providerSku: 'x', payload: {} }] }, actor)), 'VALIDATION_FAILED');
  assert.equal(await code(c.saveMappings({ productId: a.id, rows: [{ ...rows[0]!, providerSku: 'same' }, { ...rows[1]!, providerSku: 'SAME' }] }, actor)), 'VALIDATION_FAILED');
  assert.equal(await code(c.saveMappings({ productId: b.id, rows: [{ variantId: b.variants[0]!.id, providerSku: 'V-A0', payload: {} }] }, actor)), 'CONFLICT');
  m = await c.saveMappings({ productId: a.id, rows: [{ variantId: a.variants[0]!.id, providerSku: '', payload: {} }] }, actor);
  assert.equal(m.variants.find((v) => v.variantId === a.variants[0]!.id)!.providerSku, '');
  assert.equal(JSON.stringify((await c.getStorefrontCatalog()).products).includes('v-a1'), false, 'partner SKUs stay staff-only');
  assert.equal(await code(c.saveMappings({ productId: '00000000-0000-7000-8000-000000000999', rows: [] }, actor)), 'NOT_FOUND');
});

test('reviews: only after delivery, one per person, hidden until approved, no emails', { skip }, async () => {
  const p = await product('Review Tee');
  const s = await auth.register({ email: 'asha.review@example.com', password: 'customer pass 1', firstName: 'Asha', lastName: 'Rao' }, meta);
  const other = await auth.register({ email: 'other.review@example.com', password: 'customer pass 1', firstName: 'Ben', lastName: 'Lee' }, meta);
  const user = s.claims.sub;
  const good = { productId: p.id, rating: 4, title: 'Nice', body: 'Soft and holds the print well.' };
  assert.equal(await code(c.submitReview(user, good)), 'FORBIDDEN', 'no order, no review');
  assert.equal((await c.myReviewState(user, p.id)).canReview, false);

  const order = async (status: string) => {
    const { rows: [m] } = await db().execute<{ profile_id: string; household_id: string }>(sql`SELECT hm.profile_id, hm.household_id FROM household_members hm JOIN profiles pr ON pr.id = hm.profile_id WHERE pr.user_id = ${user} AND hm.left_at IS NULL`);
    const id = uuidv7();
    await db().execute(sql`INSERT INTO orders (id, placed_by_user_id, for_profile_id, for_household_id, order_number, status, subtotal, grand_total, shipping_address, billing_address)
      VALUES (${id}, ${user}, ${m!.profile_id}, ${m!.household_id}, ${`T-${id.slice(-10)}`}, ${status}, 999, 999, '{}', '{}')`);
    await db().execute(sql`INSERT INTO order_items (id, order_id, product_id, product_name, sku, unit_price, qty, line_total) VALUES (${uuidv7()}, ${id}, ${p.id}, 'Review Tee', 'SKU', 999, 1, 999)`);
  };
  await order('shipped');
  assert.equal(await code(c.submitReview(user, good)), 'FORBIDDEN', 'shipped is not received');
  await order('delivered');
  await c.submitReview(user, good);
  assert.equal(await code(c.submitReview(other.claims.sub, good)), 'FORBIDDEN', "someone else's order does not count");
  assert.equal((await c.approvedReviews(p.id)).count, 0, 'pending reviews stay hidden');
  assert.equal((await c.myReviewState(user, p.id)).mine!.approved, false);

  const [row] = await c.adminListReviews();
  await c.adminModerateReview(row!.id, true, actor);
  let live = await c.approvedReviews(p.id);
  assert.equal(live.count, 1);
  assert.equal(live.average, 4);
  assert.equal(live.distribution[4], 1);
  assert.equal(live.reviews[0]!.author, 'Asha R.');
  assert.equal(JSON.stringify(live).includes('example.com'), false, 'no emails in public data');

  await c.submitReview(user, { ...good, rating: 2, body: 'Changed my mind after a wash.' });
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM reviews WHERE product_id = ${p.id}`), 1, 'still one row');
  live = await c.approvedReviews(p.id);
  assert.equal(live.count, 0, 'an edited review goes back for approval');
  for (const bad of [{ rating: 0 }, { rating: 6 }, { rating: 4.5 }, { title: ' ' }, { body: 'short' }]) assert.equal(S.reviewSubmit.safeParse({ ...good, ...bad }).success, false);
  await c.adminDeleteReview(row!.id, actor);
  assert.equal(await code(c.adminDeleteReview(row!.id, actor)), 'NOT_FOUND');
});
