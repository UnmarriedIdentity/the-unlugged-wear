// Break-it tests: the staff spotlight's product search. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('./index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
const S = c.catalogSchemas;
const make = (name: string, over: Record<string, unknown> = {}) => c.adminCreateProduct(S.productFields.parse({ name, slug: '', category: 'Tees', price: 999, colors: ['Black'], sizes: ['M'], partner: 'Custom Atelier', publicationStatus: 'published', description: 'd', ...over }), actor);

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'spotlight@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('staff product search: names, style codes, SKUs and drafts; exact names first; wildcards are text', { skip, timeout: 240_000 }, async () => {
  const hoodie = await make('Linen Hoodie');
  const exact = await make('Hoodie');
  const draft = await make('Draft Hoodie Sample', { publicationStatus: 'draft', styleCode: 'DH-77' });
  await make('100% Cotton Tee');
  const names = async (q: string) => (await c.adminSearchProducts(q)).map((h) => h.name);
  assert.deepEqual((await names('hoodie'))[0], 'Hoodie', 'the exact name leads');
  assert.ok((await names('hoodie')).includes('Linen Hoodie'));
  assert.ok((await names('hoodie')).includes('Draft Hoodie Sample'), 'staff see drafts');
  assert.deepEqual(await names('dh-77'), ['Draft Hoodie Sample'], 'style code');
  assert.deepEqual(await names(hoodie.variants[0]!.sku.toLowerCase()), ['Linen Hoodie'], 'variant SKU');
  assert.deepEqual(await names('100%'), ['100% Cotton Tee']);
  assert.deepEqual(await names('%'), [], 'one character is too short');
  assert.deepEqual(await names('_%'), [], '% and _ never act as wildcards');
  assert.equal((await c.adminSearchProducts('hoodie', 1)).length, 1, 'the limit holds');
  const hit = (await c.adminSearchProducts('Draft Hoodie'))[0]!;
  assert.deepEqual([hit.id, hit.status, hit.pricePaise, hit.category], [draft.id, 'draft', 99_900, 'Tees']);
  await c.adminDeleteProducts([exact.id], actor);
  assert.equal((await names('hoodie')).includes('Hoodie'), false, 'deleted products are gone');
});
