// Break-it tests: stock moves, staff alerts, back-in-stock. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('../catalog/index.ts');
const inv = await import('./index.ts');
const notes = await import('../notifications/index.ts');
const { getDb, withTransaction } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
let shopper = '';
let household = { profile_id: '', household_id: '' };
const S = c.catalogSchemas;
const db = () => getDb();
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const one = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db().execute<T>(q)).rows[0]!;
const count = async (q: ReturnType<typeof sql>) => (await one<{ n: number }>(q)).n;

const meta = { origin: 'https://shop.example.com' };
let seq = 0;
/** A published in-house product with one variant per size. */
async function product(stocks: Record<string, number>, over: Record<string, unknown> = {}) {
  seq += 1;
  const sizes = Object.keys(stocks);
  const input = S.productFields.parse({ name: `Stock Tee ${seq}`, slug: `stock-tee-${seq}`, category: 'Tees', price: 999, colors: ['Black'], sizes, partner: 'Custom Atelier', publicationStatus: 'published', description: 'd',
    variants: sizes.map((size) => ({ color: 'Black', size, price: 999, stock: stocks[size] })), ...over });
  const p = await c.adminCreateProduct(input, actor);
  const id = (size: string) => p.variants.find((v) => v.size === size)!.id;
  return { p, id };
}
/** A real order with one row per line, so the ledger's foreign keys hold. */
async function order(lines: { variantId: string; productId: string; qty: number }[]) {
  const id = uuidv7();
  await db().execute(sql`INSERT INTO orders (id, placed_by_user_id, for_profile_id, for_household_id, order_number, status, subtotal, grand_total, shipping_address, billing_address)
    VALUES (${id}, ${shopper}, ${household.profile_id}, ${household.household_id}, ${`T-${id.slice(-12)}`}, 'pending', 999, 999, '{}', '{}')`);
  const out = [];
  for (const l of lines) {
    const itemId = uuidv7();
    await db().execute(sql`INSERT INTO order_items (id, order_id, product_id, product_name, sku, unit_price, qty, line_total) VALUES (${itemId}, ${id}, ${l.productId}, 'Tee', 'SKU', 999, ${l.qty}, ${999 * l.qty})`);
    out.push({ orderItemId: itemId, variantId: l.variantId, qty: l.qty });
  }
  return { orderId: id, lines: out };
}
const reserve = (o: Parameters<typeof inv.reserve>[1]) => withTransaction((tx) => inv.reserve(tx, o));
const release = (o: Parameters<typeof inv.release>[1]) => withTransaction((tx) => inv.release(tx, o));
const stockOf = async (variantId: string) => (await one<{ stock: number }>(sql`SELECT stock FROM product_variants WHERE id = ${variantId}`)).stock;
const totalOf = async (productId: string) => (await one<{ stock: number }>(sql`SELECT stock FROM products WHERE id = ${productId}`)).stock;
const asInput = (d: Awaited<ReturnType<typeof c.adminGetProduct>>, over: Record<string, unknown> = {}) => S.productFields.parse({
  name: d.name, slug: d.slug, category: d.category, price: d.price, basePrice: d.basePrice, stock: d.stock, colors: d.colors, sizes: d.sizes, partner: d.partner, publicationStatus: d.publicationStatus, description: d.description, variants: d.variants, attributes: d.attributes, images: d.images, lowStockThreshold: d.lowStockThreshold, ...over,
});

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'stock-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
  await auth.register({ email: 'stock-shopper@example.com', password: 'shopper pass 12', firstName: 'Sho', lastName: 'Pper' }, meta);
  shopper = (await one<{ id: string }>(sql`SELECT id FROM users WHERE email = 'stock-shopper@example.com'`)).id;
  household = await one(sql`SELECT hm.profile_id, hm.household_id FROM household_members hm JOIN profiles pr ON pr.id = hm.profile_id WHERE pr.user_id = ${shopper} AND hm.left_at IS NULL`);
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('reserve takes stock once per line, and a retry takes nothing more', { skip }, async () => {
  const { p, id } = await product({ S: 10, M: 4 });
  const o = await order([{ variantId: id('S'), productId: p.id, qty: 3 }, { variantId: id('S'), productId: p.id, qty: 2 }, { variantId: id('M'), productId: p.id, qty: 1 }]);
  assert.deepEqual(await reserve(o), { reserved: 3, alreadyReserved: 0 });
  assert.equal(await stockOf(id('S')), 5, 'two lines of one variant both count');
  assert.equal(await stockOf(id('M')), 3);
  assert.equal(await totalOf(p.id), 8);
  assert.deepEqual(await reserve(o), { reserved: 0, alreadyReserved: 3 });
  assert.equal(await stockOf(id('S')), 5);
  const ledger = (await db().execute<{ qty_change: number; qty_after: number }>(sql`SELECT qty_change, qty_after FROM stock_movements WHERE order_id = ${o.orderId} AND variant_id = ${id('S')} ORDER BY qty_after DESC`)).rows;
  assert.deepEqual(ledger, [{ qty_change: -3, qty_after: 7 }, { qty_change: -2, qty_after: 5 }], 'the running balance is recorded per line');
});

test('one short line refuses the whole order and moves nothing', { skip }, async () => {
  const { p, id } = await product({ S: 5, M: 1 });
  const o = await order([{ variantId: id('S'), productId: p.id, qty: 2 }, { variantId: id('M'), productId: p.id, qty: 2 }]);
  assert.equal(await code(reserve(o)), 'STOCK_INSUFFICIENT');
  assert.equal(await stockOf(id('S')), 5);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE order_id = ${o.orderId}`), 0);
  // Two lines that fit alone but not together.
  const both = await order([{ variantId: id('S'), productId: p.id, qty: 3 }, { variantId: id('S'), productId: p.id, qty: 3 }]);
  assert.equal(await code(reserve(both)), 'STOCK_INSUFFICIENT');
  assert.equal(await stockOf(id('S')), 5);
});

test('bad input and unavailable items are refused', { skip }, async () => {
  const { p, id } = await product({ S: 5 });
  const line = (qty: number) => order([{ variantId: id('S'), productId: p.id, qty: 1 }]).then((o) => ({ ...o, lines: o.lines.map((l) => ({ ...l, qty })) }));
  assert.equal(await code(reserve(await line(0))), 'VALIDATION_FAILED');
  assert.equal(await code(reserve(await line(-2))), 'VALIDATION_FAILED');
  assert.equal(await code(reserve(await line(1.5))), 'VALIDATION_FAILED');
  assert.equal(await code(reserve({ orderId: uuidv7(), lines: [] })), 'VALIDATION_FAILED');
  const dup = await line(1);
  assert.equal(await code(reserve({ ...dup, lines: [dup.lines[0]!, dup.lines[0]!] })), 'VALIDATION_FAILED');
  assert.equal(await code(reserve({ orderId: dup.orderId, lines: [{ ...dup.lines[0]!, variantId: uuidv7() }] })), 'STOCK_INSUFFICIENT', 'unknown variant');
  await c.adminSetProductsStatus([p.id], 'draft', actor);
  assert.equal(await code(reserve(await line(1))), 'STOCK_INSUFFICIENT', 'a draft cannot be sold');
  assert.equal(await stockOf(id('S')), 5);
});

test('parallel orders never oversell the last units', { skip, timeout: 240_000 }, async () => {
  const { p, id } = await product({ S: 3 });
  const orders = await Promise.all(Array.from({ length: 8 }, () => order([{ variantId: id('S'), productId: p.id, qty: 1 }])));
  const results = await Promise.all(orders.map((o) => code(reserve(o))));
  assert.equal(results.filter((r) => r === 'ok').length, 3);
  assert.equal(results.filter((r) => r === 'STOCK_INSUFFICIENT').length, 5);
  assert.equal(await stockOf(id('S')), 0);
  assert.equal(await totalOf(p.id), 0);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE variant_id = ${id('S')} AND reason = 'sale'`), 3);
});

test('parallel orders across variants keep the product total right, without deadlocks', { skip, timeout: 240_000 }, async () => {
  const a = await product({ S: 10, M: 10 });
  const b = await product({ S: 10 });
  // Opposite line order is the classic deadlock.
  const orders = await Promise.all([0, 1, 2, 3].map((i) => order(i % 2
    ? [{ variantId: a.id('S'), productId: a.p.id, qty: 1 }, { variantId: b.id('S'), productId: b.p.id, qty: 1 }]
    : [{ variantId: b.id('S'), productId: b.p.id, qty: 1 }, { variantId: a.id('M'), productId: a.p.id, qty: 1 }])));
  assert.deepEqual(await Promise.all(orders.map((o) => code(reserve(o)))), ['ok', 'ok', 'ok', 'ok']);
  assert.equal(await totalOf(a.p.id), 16);
  assert.equal(await totalOf(b.p.id), 6);
});

test('a parallel retry of one line still takes stock once', { skip, timeout: 120_000 }, async () => {
  const { p, id } = await product({ S: 10 });
  const o = await order([{ variantId: id('S'), productId: p.id, qty: 2 }]);
  await Promise.all([reserve(o), reserve(o), reserve(o)]);
  assert.equal(await stockOf(id('S')), 8);
});

test('cancel restores once, including in parallel, and per line', { skip, timeout: 120_000 }, async () => {
  const { p, id } = await product({ S: 10, M: 10 });
  const o = await order([{ variantId: id('S'), productId: p.id, qty: 2 }, { variantId: id('M'), productId: p.id, qty: 3 }]);
  await reserve(o);
  assert.deepEqual(await release({ orderId: o.orderId, orderItemIds: [o.lines[0]!.orderItemId] }), { released: 1 });
  assert.equal(await stockOf(id('S')), 10);
  assert.equal(await stockOf(id('M')), 7, 'the other line stays sold');
  await Promise.all([release(o), release(o), release(o)]);
  assert.equal(await stockOf(id('M')), 10);
  assert.deepEqual(await release(o), { released: 0 });
  assert.equal(await stockOf(id('S')), 10);
  assert.equal(await totalOf(p.id), 20);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE order_id = ${o.orderId} AND reason = 'cancel'`), 2);
  assert.deepEqual(await release({ orderId: uuidv7() }), { released: 0 }, 'an order that took nothing gives nothing back');
});

test('print-to-order items move no stock, respect the cap and partner readiness', { skip }, async () => {
  const { p, id } = await product({ S: 0 }, { partner: 'Qikink Direct API' });
  await db().execute(sql`UPDATE products SET partner_availability = 'ready_to_print' WHERE id = ${p.id}`);
  const o = await order([{ variantId: id('S'), productId: p.id, qty: 5 }]);
  assert.equal((await reserve(o)).reserved, 1);
  assert.equal(await stockOf(id('S')), 0);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE order_id = ${o.orderId}`), 0);
  assert.equal(await code(reserve(await order([{ variantId: id('S'), productId: p.id, qty: inv.MADE_TO_ORDER_LINE_CAP + 1 }]))), 'STOCK_INSUFFICIENT');
  await db().execute(sql`UPDATE products SET partner_availability = 'discontinued' WHERE id = ${p.id}`);
  assert.equal(await code(reserve(await order([{ variantId: id('S'), productId: p.id, qty: 1 }]))), 'STOCK_INSUFFICIENT');
});

test('a sale made while the editor is open survives the save', { skip }, async () => {
  const { p, id } = await product({ S: 10 });
  const opened = await c.adminGetProduct(p.id);
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 1 }]));
  await c.adminUpdateProduct(p.id, asInput(opened, { description: 'edited' }), actor);
  assert.equal(await stockOf(id('S')), 9, 'saving unrelated fields must not undo the sale');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM stock_movements WHERE variant_id = ${id('S')} AND reason = 'admin_adjustment' AND order_id IS NULL AND created_at > now() - interval '1 minute' AND qty_change <> 10`), 0, 'no phantom adjustment');

  // Staff add 5 to what they saw: the change applies to the live balance.
  const add = await c.adminGetProduct(p.id);
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 2 }]));
  await c.adminUpdateProduct(p.id, asInput(add, { variants: add.variants.map((v) => ({ ...v, stock: v.stock + 5 })) }), actor);
  assert.equal(await stockOf(id('S')), 12);
  assert.equal(await totalOf(p.id), 12);

  // A cut larger than what is left stops at zero and records what moved.
  const cut = await c.adminGetProduct(p.id);
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 11 }]));
  await c.adminUpdateProduct(p.id, asInput(cut, { variants: cut.variants.map((v) => ({ ...v, stock: 0 })) }), actor);
  assert.equal(await stockOf(id('S')), 0);
  const last = await one<{ qty_change: number; qty_after: number }>(sql`SELECT qty_change, qty_after FROM stock_movements WHERE variant_id = ${id('S')} ORDER BY id DESC LIMIT 1`);
  assert.deepEqual(last, { qty_change: -1, qty_after: 0 });
});

test('staff alerts: ring once a day, per level, for every staff member', { skip }, async () => {
  const { p, id } = await product({ S: 12 });
  const ring = (key: string) => count(sql`SELECT count(*)::int AS n FROM notifications WHERE kind = 'inventory' AND dedupe_key LIKE ${`inventory.${key}:${id('S')}:%`}`);
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 1 }]));
  assert.equal(await ring('low'), 0, 'above the store-wide level of 10');
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 2 }]));
  assert.equal(await ring('low'), 1);
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 1 }]));
  assert.equal(await ring('low'), 1, 'still low today: no second ring');
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 8 }]));
  assert.equal(await ring('out'), 1);
  const mine = (await notes.listNotifications(actor)).filter((n) => n.title.includes(p.name));
  assert.equal(mine.length, 2);
  assert.equal(mine[0]!.read, false);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM notifications WHERE user_id = ${shopper}`), 0, 'customers never get staff alerts');
});

test('staff alerts: a product level beats the store level; drafts, print-to-order and refused orders stay silent', { skip }, async () => {
  const custom = await product({ S: 5 }, { lowStockThreshold: 2 });
  const rings = (v: string) => count(sql`SELECT count(*)::int AS n FROM notifications WHERE dedupe_key LIKE ${`inventory.%:${v}:%`}`);
  await reserve(await order([{ variantId: custom.id('S'), productId: custom.p.id, qty: 2 }]));
  assert.equal(await rings(custom.id('S')), 0, '3 left is above this product\'s level of 2');
  await reserve(await order([{ variantId: custom.id('S'), productId: custom.p.id, qty: 1 }]));
  assert.equal(await rings(custom.id('S')), 1);

  const refused = await product({ S: 11 });
  await assert.rejects(withTransaction(async (tx) => {
    await inv.reserve(tx, await order([{ variantId: refused.id('S'), productId: refused.p.id, qty: 11 }]));
    throw new Error('payment failed');
  }));
  assert.equal(await stockOf(refused.id('S')), 11, 'the caller\'s rollback undoes the stock');
  assert.equal(await rings(refused.id('S')), 0, 'and the alert with it');

  const draft = await product({ S: 3 }, { publicationStatus: 'draft' });
  assert.equal(await rings(draft.id('S')), 0);
  const printed = await product({ S: 0 }, { partner: 'Qikink Direct API' });
  assert.equal(await rings(printed.id('S')), 0);
});

test('bell: one person cannot read another\'s alert', { skip }, async () => {
  const { p, id } = await product({ S: 1 });
  await reserve(await order([{ variantId: id('S'), productId: p.id, qty: 1 }]));
  const row = (await notes.listNotifications(actor)).find((n) => n.title.includes(p.name))!;
  await notes.markNotificationRead(shopper, row.id);
  assert.equal((await notes.listNotifications(actor)).find((n) => n.id === row.id)!.read, false);
  await notes.markNotificationRead(actor, row.id);
  assert.equal((await notes.listNotifications(actor)).find((n) => n.id === row.id)!.read, true);
  await notes.markAllNotificationsRead(actor);
  assert.equal((await notes.listNotifications(actor)).filter((n) => !n.read).length, 0);
});

test('notify me: guests and customers, no duplicates, refused when buyable, capped per email', { skip, timeout: 240_000 }, async () => {
  const { p, id } = await product({ S: 0, M: 2 });
  const waiting = () => count(sql`SELECT count(*)::int AS n FROM stock_alert_subscriptions WHERE product_id = ${p.id} AND status = 'waiting'`);
  await inv.requestBackInStock({ productId: p.id, variantId: id('S'), email: 'Guest@Example.com' });
  await inv.requestBackInStock({ productId: p.id, variantId: id('S'), email: 'guest@example.com ' });
  await Promise.all([1, 2, 3].map(() => inv.requestBackInStock({ productId: p.id, variantId: id('S'), email: 'GUEST@example.com' })));
  assert.equal(await waiting(), 1, 'same person, same variant, any casing');
  await inv.requestBackInStock({ productId: p.id, variantId: id('S'), email: 'stock-shopper@example.com', userId: shopper });
  assert.equal(await waiting(), 2);
  assert.equal(await code(inv.requestBackInStock({ productId: p.id, variantId: id('M'), email: 'g2@example.com' })), 'RULE_VIOLATION', 'in stock now');
  assert.equal(await code(inv.requestBackInStock({ productId: uuidv7(), variantId: null, email: 'g2@example.com' })), 'NOT_FOUND');
  assert.equal(S.productFields.safeParse({}).success, false);
  assert.equal(inv.inventorySchemas.backInStock.safeParse({ productId: p.id, email: 'not-an-email' }).success, false);

  const hog = 'hog@example.com';
  const wide = await product(Object.fromEntries(Array.from({ length: inv.MAX_WAITING_PER_EMAIL }, (_, i) => [`Z${i}`, 0])));
  await db().execute(sql`INSERT INTO stock_alert_subscriptions (id, product_id, variant_id, email)
    SELECT gen_random_uuid(), ${wide.p.id}, v.id, ${hog} FROM product_variants v WHERE v.product_id = ${wide.p.id}`);
  const another = await product({ X: 0 });
  assert.equal(await code(inv.requestBackInStock({ productId: another.p.id, variantId: another.id('X'), email: hog })), 'RATE_LIMITED');
});

test('restock job: emails once, only when that variant is back, and a new request gets a new email', { skip, timeout: 240_000 }, async () => {
  const { p, id } = await product({ S: 0, M: 0 });
  const email = 'waiter@example.com';
  await inv.requestBackInStock({ productId: p.id, variantId: id('S'), email });
  const sent = () => count(sql`SELECT count(*)::int AS n FROM email_logs WHERE recipient = ${email} AND template = 'stock.back_in_stock'`);
  const state = async () => (await one<{ status: string }>(sql`SELECT status FROM stock_alert_subscriptions WHERE product_id = ${p.id} AND email = ${email} ORDER BY id DESC LIMIT 1`)).status;

  await inv.notifyRestocked();
  assert.equal(await sent(), 0, 'still sold out');

  const opened = await c.adminGetProduct(p.id);
  await c.adminUpdateProduct(p.id, asInput(opened, { variants: opened.variants.map((v) => ({ ...v, stock: v.size === 'M' ? 4 : v.stock })) }), actor);
  await inv.notifyRestocked();
  assert.equal(await sent(), 0, 'a different size came back');
  assert.equal(await state(), 'waiting');

  const again = await c.adminGetProduct(p.id);
  await c.adminUpdateProduct(p.id, asInput(again, { variants: again.variants.map((v) => ({ ...v, stock: v.size === 'S' ? 1 : v.stock })) }), actor);
  await Promise.all([inv.notifyRestocked(), inv.notifyRestocked()]);
  await inv.notifyRestocked();
  assert.equal(await sent(), 1, 'two runners, one email');
  assert.equal(await state(), 'notified');

  const sale = await order([{ variantId: id('S'), productId: p.id, qty: 1 }]);
  await reserve(sale);
  await inv.requestBackInStock({ productId: p.id, variantId: id('S'), email });
  assert.equal(await state(), 'waiting');
  await release(sale);
  await inv.notifyRestocked();
  assert.equal(await sent(), 2, 'a cancelled order brings it back too');
});

test('findVariantId: exact pick, no colour axis, unknown option', { skip }, async () => {
  const { p, id } = await product({ S: 1, M: 1 });
  assert.equal(await c.findVariantId(p.id, 'Black', 'S'), id('S'));
  assert.equal(await c.findVariantId(p.id, undefined, undefined), null, 'several variants, nothing picked');
  assert.equal(await code(c.findVariantId(p.id, 'Black', 'XXXL')), 'NOT_FOUND');
});
