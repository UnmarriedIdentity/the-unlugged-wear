// Break-it tests: bag, merge on sign-in, personalised lines, wishlist. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('../catalog/index.ts');
const cart = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
const users: string[] = [];
const S = c.catalogSchemas;
const db = () => getDb();
const meta = { origin: 'https://shop.example.com' };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const one = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db().execute<T>(q)).rows[0]!;
const guest = () => ({ sessionId: uuidv7().replace(/-/g, '') });

let seq = 0;
async function product(stocks: Record<string, number>, over: Record<string, unknown> = {}) {
  seq += 1;
  const sizes = Object.keys(stocks);
  const p = await c.adminCreateProduct(S.productFields.parse({ name: `Bag Tee ${seq}`, slug: `bag-tee-${seq}`, category: 'Tees', price: 999, colors: ['Black', 'White'], sizes, partner: 'Custom Atelier', publicationStatus: 'published', description: 'd',
    images: ['/a.png'], variants: sizes.flatMap((size) => ['Black', 'White'].map((color) => ({ color, size, price: size === 'XL' ? 1099 : 999, stock: stocks[size] }))), ...over }), actor);
  return p;
}

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'cart-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
  for (const name of ['asha', 'ben']) {
    await auth.register({ email: `${name}.bag@example.com`, password: 'shopper pass 12', firstName: name, lastName: 'Bag' }, meta);
    users.push((await one<{ id: string }>(sql`SELECT id FROM users WHERE email = ${`${name}.bag@example.com`}`)).id);
  }
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('add: the database sets the price, a re-add joins the line and refreshes what it shows', { skip }, async () => {
  const p = await product({ M: 10, XL: 10 });
  const g = guest();
  let bag = await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 2 });
  assert.equal(bag.lines.length, 1);
  assert.equal(bag.lines[0]!.unitPaise, 99_900);
  assert.equal(bag.lines[0]!.variantLabel, 'Black / M');
  assert.equal(bag.lines[0]!.image, '/a.png');
  bag = await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'XL', qty: 1 });
  assert.equal(bag.lines.find((l) => l.size === 'XL')!.unitPaise, 109_900, 'each size keeps its own price');

  await db().execute(sql`UPDATE product_variants SET price = 899 WHERE product_id = ${p.id}`);
  assert.equal((await cart.getCart(g)).lines.find((l) => l.size === 'M')!.unitPaise, 99_900, 'no silent price change');
  bag = await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 1 });
  const m = bag.lines.find((l) => l.size === 'M')!;
  assert.deepEqual([m.qty, m.unitPaise], [3, 89_900], 'a re-add refreshes the snapshot');
  assert.equal(bag.lines.length, 2);
});

test('add: stock caps, sold out, bad quantities, drafts and unknown options are refused', { skip }, async () => {
  const p = await product({ M: 3, L: 0 });
  const g = guest();
  await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 2 });
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 2 })), 'STOCK_INSUFFICIENT');
  assert.equal((await cart.getCart(g)).lines[0]!.qty, 2, 'a refused add changes nothing');
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'L', qty: 1 })), 'STOCK_INSUFFICIENT');
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 0 })), 'VALIDATION_FAILED');
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 1.5 })), 'VALIDATION_FAILED');
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'XXXL', qty: 1 })), 'NOT_FOUND');
  assert.equal(await code(cart.addLine(g, { productRef: p.id, qty: 1 })), 'VALIDATION_FAILED', 'several variants, nothing chosen');
  assert.equal(await code(cart.addLine(g, { productRef: uuidv7(), size: 'M', qty: 1 })), 'NOT_FOUND');
  const draft = await product({ M: 5 }, { publicationStatus: 'draft' });
  assert.equal(await code(cart.addLine(g, { productRef: draft.id, color: 'Black', size: 'M', qty: 1 })), 'NOT_FOUND');
  assert.equal(cart.cartSchemas.addLine.safeParse({ productId: 'x', qty: 1, priceINR: 1 }).data && 'priceINR' in cart.cartSchemas.addLine.parse({ productId: 'x', qty: 1, priceINR: 1 }), false, 'a client price is dropped');
  assert.equal(cart.cartSchemas.addLine.safeParse({ productId: 'x', qty: 101 }).success, false);
});

test('print-to-order items cap at 100 per line and need a ready partner', { skip }, async () => {
  const p = await product({ M: 0 }, { partner: 'Qikink Direct API' });
  await db().execute(sql`UPDATE products SET partner_availability = 'ready_to_print' WHERE id = ${p.id}`);
  const g = guest();
  await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 100 });
  assert.equal(await code(cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 1 })), 'STOCK_INSUFFICIENT');
  await db().execute(sql`UPDATE products SET partner_availability = 'discontinued' WHERE id = ${p.id}`);
  const bag = await cart.getCart(g);
  assert.equal(bag.lines[0]!.maxQty, 0);
  assert.equal(cart.checkoutBlockers(bag).length, 1, 'checkout must refuse what can no longer be printed');
});

test('parallel clicks: one cart, one line, every unit counted', { skip, timeout: 240_000 }, async () => {
  const p = await product({ M: 50 });
  const g = guest();
  await Promise.all(Array.from({ length: 6 }, () => cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 1 })));
  const bag = await cart.getCart(g);
  assert.equal(bag.lines.length, 1);
  assert.equal(bag.lines[0]!.qty, 6);
  assert.equal((await one<{ n: number }>(sql`SELECT count(*)::int AS n FROM carts WHERE session_id = ${g.sessionId}`)).n, 1);
});

test('lines belong to their owner; quantity and variant changes follow the rules', { skip }, async () => {
  const p = await product({ M: 4, L: 4 });
  const mine = guest();
  const theirs = guest();
  let bag = await cart.addLine(mine, { productRef: p.id, color: 'Black', size: 'M', qty: 2 });
  const line = bag.lines[0]!;
  assert.equal(await code(cart.setLineQty(theirs, line.id, 1)), 'NOT_FOUND');
  assert.equal(await code(cart.setLineQty({ userId: users[1]! }, line.id, 1)), 'NOT_FOUND');
  await cart.removeLines(theirs, [line.id]);
  assert.equal((await cart.getCart(mine)).lines.length, 1, 'someone else\'s removal is ignored');

  assert.equal(await code(cart.setLineQty(mine, line.id, 5)), 'STOCK_INSUFFICIENT');
  await db().execute(sql`UPDATE product_variants SET stock = 1 WHERE id = ${line.variantId}`);
  bag = await cart.setLineQty(mine, line.id, 1);
  assert.equal(bag.lines[0]!.qty, 1, 'lowering is always allowed');
  bag = await cart.setLineQty(mine, line.id, 0);
  assert.equal(bag.lines.length, 0);

  await db().execute(sql`UPDATE product_variants SET stock = 4 WHERE id = ${line.variantId}`);
  const a = (await cart.addLine(mine, { productRef: p.id, color: 'Black', size: 'M', qty: 1 })).lines[0]!;
  await cart.addLine(mine, { productRef: p.id, color: 'Black', size: 'L', qty: 2 });
  bag = await cart.changeLineVariant(mine, a.id, { size: 'L' });
  assert.deepEqual(bag.lines.map((l) => [l.size, l.qty]), [['L', 3]], 'swapping onto an identical line joins them');
  bag = await cart.changeLineVariant(mine, bag.lines[0]!.id, { color: 'White' });
  assert.deepEqual(bag.lines.map((l) => [l.color, l.size, l.variantLabel]), [['White', 'L', 'White / L']]);
  assert.equal(await code(cart.changeLineVariant(mine, bag.lines[0]!.id, { size: 'XXXL' })), 'NOT_FOUND');
});

test('sign-in merge: quantities add up to what can be bought, the guest cart is kept as converted, a rerun changes nothing', { skip, timeout: 240_000 }, async () => {
  const p = await product({ M: 5, L: 5, S: 0 });
  const userId = users[0]!;
  const g = guest();
  await cart.addLine({ userId }, { productRef: p.id, color: 'Black', size: 'M', qty: 3 });
  await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 4 });
  await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'L', qty: 2 });
  await db().execute(sql`UPDATE product_variants v SET stock = 0 FROM product_variant_attribute_values x JOIN attribute_values av ON av.id = x.value_id
    WHERE x.variant_id = v.id AND v.product_id = ${p.id} AND av.value = 'L'`);
  const guestCart = (await cart.getCart(g)).id!;

  await Promise.all([cart.mergeGuestCart(g.sessionId, userId), cart.mergeGuestCart(g.sessionId, userId)]);
  let bag = await cart.getCart({ userId });
  assert.deepEqual(bag.lines.map((l) => [l.size, l.qty]), [['M', 5]], 'capped at stock; the sold-out line is left behind');
  assert.equal((await one<{ status: string }>(sql`SELECT status FROM carts WHERE id = ${guestCart}`)).status, 'converted');
  assert.equal((await one<{ n: number }>(sql`SELECT count(*)::int AS n FROM cart_items WHERE cart_id = ${guestCart}`)).n, 2, 'guest lines kept for abandonment numbers');
  await cart.mergeGuestCart(g.sessionId, userId);
  bag = await cart.getCart({ userId });
  assert.equal(bag.lines[0]!.qty, 5);
  assert.deepEqual((await cart.getCart(g)).lines, [], 'the guest starts clean');

  const fresh = guest();
  await cart.addLine(fresh, { productRef: p.id, color: 'White', size: 'M', qty: 1 });
  bag = await cart.mergeGuestCart(fresh.sessionId, users[1]!);
  assert.deepEqual(bag.lines.map((l) => [l.color, l.qty]), [['White', 1]], 'an account with no bag gets the guest\'s');
  assert.deepEqual((await cart.mergeGuestCart(guest().sessionId, userId)).lines.length, 1, 'nothing to merge leaves the account bag alone');
});

test('personalised lines: allowed only where offered, need a preview, approval resets when the print changes', { skip }, async () => {
  const plain = await product({ M: 5 });
  const mono = await product({ M: 5, L: 5 }, { monogram: { enabled: true, maxChars: 3, upcharge: 0 } });
  const g = guest();
  assert.equal(await code(cart.addLine(g, { productRef: plain.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'UK' }, previewImageUrl: '/p.png' })), 'RULE_VIOLATION');
  assert.equal(await code(cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'ABCD' }, previewImageUrl: '/p.png' })), 'VALIDATION_FAILED');
  assert.equal(await code(cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'UK' } })), 'VALIDATION_FAILED');
  assert.equal(cart.cartSchemas.addLine.safeParse({ productId: 'x', qty: 1, previewImageUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(cart.cartSchemas.addLine.safeParse({ productId: 'x', qty: 1, previewImageUrl: 'http://evil.example/p.png' }).success, false);

  let bag = await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'UK' }, previewImageUrl: '/uk.png' });
  await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'RS' }, previewImageUrl: '/rs.png' });
  bag = await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1 });
  assert.equal(bag.lines.length, 3, 'two monograms and a plain one are three lines');
  const uk = bag.lines.find((l) => l.personalization?.monogram === 'UK')!;
  assert.equal(cart.checkoutBlockers(bag).filter((b) => b.reason.includes('preview')).length, 2);

  bag = await cart.approvePreview(g, uk.id);
  assert.equal(bag.lines.find((l) => l.id === uk.id)!.previewApproved, true);
  bag = await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'UK' }, previewImageUrl: '/uk.png' });
  assert.equal(bag.lines.find((l) => l.id === uk.id)!.previewApproved, true, 'same preview keeps the approval');
  bag = await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1, personalization: { monogram: 'UK' }, previewImageUrl: '/uk-v2.png' });
  assert.equal(bag.lines.find((l) => l.id === uk.id)!.previewApproved, false, 'a new preview needs a new yes');
  await cart.approvePreview(g, uk.id);
  bag = await cart.changeLineVariant(g, uk.id, { size: 'L' });
  assert.equal(bag.lines.find((l) => l.id === uk.id)!.previewApproved, false, 'a different garment needs a new yes');
  const plainLine = bag.lines.find((l) => !l.personalization)!;
  assert.equal(await code(cart.approvePreview(g, plainLine.id)), 'RULE_VIOLATION');
  assert.equal(await code(cart.approvePreview(guest(), uk.id)), 'NOT_FOUND');
});

test('a bag holds at most the line limit', { skip }, async () => {
  const mono = await product({ M: 500 }, { monogram: { enabled: true, maxChars: 3, upcharge: 0 } });
  const g = guest();
  const bag = await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1 });
  const variant = bag.lines[0]!.variantId!;
  await db().execute(sql`INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, unit_price, product_name, personalization, preview_image_url)
    SELECT gen_random_uuid(), ${bag.id}, ${mono.id}, ${variant}, 1, 999, 'x', jsonb_build_object('monogram', n::text), '/p.png' FROM generate_series(1, ${cart.MAX_CART_LINES - 1}) n`);
  assert.equal(await code(cart.addLine(g, { productRef: mono.id, color: 'White', size: 'M', qty: 1 })), 'RULE_VIOLATION');
  assert.equal((await cart.addLine(g, { productRef: mono.id, color: 'Black', size: 'M', qty: 1 })).lines.length, cart.MAX_CART_LINES, 'adding to an existing line still works');
});

test('wishlist: customers only, one entry per product, hidden products drop out', { skip }, async () => {
  const a = await product({ M: 1 });
  const b = await product({ M: 1 });
  const userId = users[0]!;
  await Promise.all([cart.setWishlisted(userId, a.id, true), cart.setWishlisted(userId, a.id, true)]);
  assert.deepEqual(await cart.listWishlist(userId), [a.id]);
  assert.deepEqual(await cart.setWishlisted(userId, b.id, true), [b.id, a.id], 'newest first');
  assert.deepEqual(await cart.setWishlisted(userId, a.id, false), [b.id]);
  assert.deepEqual(await cart.setWishlisted(userId, a.id, false), [b.id], 'removing twice is fine');
  assert.equal(await code(cart.setWishlisted(userId, uuidv7(), true)), 'NOT_FOUND');
  await c.adminSetProductsStatus([b.id], 'draft', actor);
  assert.deepEqual(await cart.listWishlist(userId), []);
  assert.deepEqual(await cart.listWishlist(users[1]!), [], 'lists are private');
});
