// Break-it tests: checkout, double submit, declines, discount races, cancel window, who sees what. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('../catalog/index.ts');
const cart = await import('../cart/index.ts');
const orders = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let actor = '';
const users: { id: string; email: string }[] = [];
const S = c.catalogSchemas;
const db = () => getDb();
const meta = { origin: 'https://shop.example.com' };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const one = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db().execute<T>(q)).rows[0]!;
const count = async (q: ReturnType<typeof sql>) => (await one<{ n: number }>(q)).n;
const guest = () => ({ sessionId: uuidv7().replace(/-/g, '') });
const address = { fullName: 'Asha Rao', line1: '12 100 Feet Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'India' as const, phone: '9876543210' };
const form = (over: Record<string, unknown> = {}) => orders.orderSchemas.placeOrder.parse({ checkoutKey: uuidv7(), email: 'asha.guest@example.com', shippingAddress: address, method: 'card', ...over });

let seq = 0;
async function product(stock: number, price = 999, over: Record<string, unknown> = {}) {
  seq += 1;
  return c.adminCreateProduct(S.productFields.parse({ name: `Order Tee ${seq}`, slug: `order-tee-${seq}`, category: 'Tees', price, colors: ['Black'], sizes: ['M'], partner: 'Custom Atelier', publicationStatus: 'published', description: 'd',
    variants: [{ color: 'Black', size: 'M', price, stock }], ...over }), actor);
}
const add = (owner: Parameters<typeof cart.addLine>[0], p: { id: string }, qty = 1) => cart.addLine(owner, { productRef: p.id, color: 'Black', size: 'M', qty });
const stockOf = async (productId: string) => (await one<{ stock: number }>(sql`SELECT stock FROM product_variants WHERE product_id = ${productId}`)).stock;
async function discount(over: Record<string, unknown> = {}) {
  const row = { id: uuidv7(), code: `SAVE${++seq}`, type: 'percent', value: 10, min: null, max: null, starts: null, ends: null, ...over };
  await db().execute(sql`INSERT INTO discount_codes (id, code, discount_type, value, min_order_amount, max_uses, starts_at, ends_at)
    VALUES (${row.id}, ${row.code}, ${row.type}, ${row.value}, ${row.min}, ${row.max}, ${row.starts}, ${row.ends})`);
  return row;
}

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  actor = (await auth.bootstrapAdmin({ email: 'orders-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), actor);
  for (const name of ['asha', 'ben']) {
    const email = `${name}.order@example.com`;
    await auth.register({ email, password: 'shopper pass 12', firstName: name, lastName: 'Order' }, meta);
    users.push({ id: (await one<{ id: string }>(sql`SELECT id FROM users WHERE email = ${email}`)).id, email });
  }
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('guest checkout writes the order, lines, payment, stock and history together, and converts the bag', { skip }, async () => {
  const p = await product(5, 1600);
  const g = guest();
  await add(g, p, 2);
  const placed = await orders.placeOrder(g, form());
  assert.match(placed.orderNumber, /^TUW-\d{6}-[A-HJ-NP-Z2-9]{5}$/);
  assert.deepEqual(placed.totals, { subtotalPaise: 320_000, discountPaise: 0, shippingPaise: 0, taxPaise: 0, giftCardPaise: 0, grandTotalPaise: 320_000 });
  const o = await one<{ status: string; payment_status: string; guest_email: string; placed_by_user_id: string | null; grand_total: string; mins: number }>(sql`
    SELECT status, payment_status, guest_email, placed_by_user_id, grand_total, round(extract(epoch FROM cancellable_until - created_at) / 60)::int AS mins FROM orders WHERE id = ${placed.orderId}`);
  assert.deepEqual(o, { status: 'pending', payment_status: 'paid', guest_email: 'asha.guest@example.com', placed_by_user_id: null, grand_total: '3200.00', mins: 60 });
  assert.equal(await stockOf(p.id), 3);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM payments WHERE order_id = ${placed.orderId} AND status = 'captured' AND amount = 3200`), 1);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM order_status_history WHERE order_id = ${placed.orderId} AND to_status = 'pending'`), 1);
  const line = await one<{ sku: string; qty: number; line_total: string; options: Record<string, string>; exchange_policy: string }>(sql`SELECT sku, qty, line_total, options, exchange_policy FROM order_items WHERE order_id = ${placed.orderId}`);
  assert.deepEqual([line.qty, line.line_total, line.options, line.exchange_policy], [2, '3200.00', { Color: 'Black', Size: 'M' }, 'defects_only']);
  assert.deepEqual((await cart.getCart(g)).lines, [], 'the bag is done');

  const view = await orders.getOrderForViewer(placed.orderNumber, { userId: null, receipt: placed.receipt });
  assert.equal(view.canCancel, false, 'a receipt lets you look, not cancel');
  assert.equal(view.lines[0]!.title, p.name);
  assert.equal(await code(orders.getOrderForViewer(placed.orderNumber, { userId: null, receipt: 'x'.repeat(32) })), 'NOT_FOUND');
  assert.equal(await code(orders.getOrderForViewer(placed.orderNumber, { userId: users[0]!.id })), 'NOT_FOUND', 'another account cannot read a guest order');
});

test('double submit: the same key always returns the same order, in parallel and later', { skip, timeout: 240_000 }, async () => {
  const p = await product(10);
  const g = guest();
  await add(g, p, 1);
  const f = form();
  const results = await Promise.all([orders.placeOrder(g, f), orders.placeOrder(g, f), orders.placeOrder(g, f)]);
  assert.equal(new Set(results.map((r) => r.orderNumber)).size, 1);
  assert.equal(results.filter((r) => !r.replayed).length, 1);
  assert.equal(await stockOf(p.id), 9, 'stock taken once');
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM orders WHERE idempotency_key = ${f.checkoutKey}`), 1);
  assert.equal((await orders.placeOrder(g, f)).orderNumber, results[0]!.orderNumber, 'a retry after the bag is gone still finds it');
  assert.equal(await code(orders.placeOrder(g, form())), 'RULE_VIOLATION', 'a new attempt with an empty bag places nothing');
});

test('a declined payment leaves no order, takes no stock, spends no code and keeps the bag', { skip }, async () => {
  const p = await product(4);
  const d = await discount({ max: 5 });
  const g = guest();
  await add(g, p, 2);
  assert.equal(await code(orders.placeOrder(g, form({ simulate: 'decline', discountCode: d.code.toLowerCase() }))), 'RULE_VIOLATION');
  assert.equal(await stockOf(p.id), 4);
  assert.equal((await one<{ uses_count: number }>(sql`SELECT uses_count FROM discount_codes WHERE id = ${d.id}`)).uses_count, 0);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM orders WHERE guest_email = 'asha.guest@example.com' AND discount_code_id = ${d.id}`), 0);
  assert.equal((await cart.getCart(g)).lines[0]!.qty, 2, 'try again with the same bag');
  const ok = await orders.placeOrder(g, form({ discountCode: d.code }));
  assert.equal(ok.totals.discountPaise, 19_980);
  assert.equal((await one<{ uses_count: number }>(sql`SELECT uses_count FROM discount_codes WHERE id = ${d.id}`)).uses_count, 1);
});

test('refusals: empty bag, missing guest email, stock that ran out after adding, bad form input', { skip }, async () => {
  assert.equal(await code(orders.placeOrder(guest(), form())), 'RULE_VIOLATION');
  const p = await product(3);
  const g = guest();
  await add(g, p, 3);
  assert.equal(await code(orders.placeOrder(g, form({ email: undefined }))), 'VALIDATION_FAILED');
  await db().execute(sql`UPDATE product_variants SET stock = 2 WHERE product_id = ${p.id}`);
  assert.equal(await code(orders.placeOrder(g, form())), 'STOCK_INSUFFICIENT');
  assert.equal(await stockOf(p.id), 2);
  const bad = (o: Record<string, unknown>) => orders.orderSchemas.placeOrder.safeParse({ checkoutKey: uuidv7(), shippingAddress: address, method: 'card', ...o }).success;
  assert.equal(bad({ shippingAddress: { ...address, postalCode: '056003' } }), false);
  assert.equal(bad({ shippingAddress: { ...address, country: 'Nepal' } }), false);
  assert.equal(bad({ shippingAddress: { ...address, phone: '12345' } }), false);
  assert.equal(bad({ checkoutKey: 'not-a-uuid' }), false);
  assert.equal(bad({ method: 'crypto' }), false);
  assert.equal(bad({ simulate: 'approve-everything' }), false);
  assert.equal(bad({ shippingAddress: { ...address, phone: '+91 98765-43210' } }), true);
});

test('discount codes: rules are checked against the database and the last use goes to one buyer', { skip, timeout: 240_000 }, async () => {
  const p = await product(20, 1000);
  const ready = async () => { const g = guest(); await add(g, p, 1); return g; };
  const expired = await discount({ ends: new Date(Date.now() - 60_000).toISOString() });
  const later = await discount({ starts: new Date(Date.now() + 3_600_000).toISOString() });
  const big = await discount({ min: 5000 });
  const fixed = await discount({ type: 'fixed', value: 5000 });
  for (const [d, why] of [[expired, 'expired'], [later, 'not active yet'], [big, 'min order']] as const) {
    assert.equal(await code(orders.placeOrder(await ready(), form({ discountCode: d.code }))), 'RULE_VIOLATION', why);
  }
  assert.equal(await code(orders.previewDiscount('NOPE', 100_000)), 'RULE_VIOLATION');
  assert.equal((await orders.previewDiscount(fixed.code.toLowerCase(), 100_000)).discountPaise, 100_000, 'a fixed code never goes below zero');

  const last = await discount({ max: 1 });
  const [a, b] = [await ready(), await ready()];
  const results = await Promise.all([a, b].map((g) => code(orders.placeOrder(g, form({ discountCode: last.code })))));
  assert.deepEqual(results.sort(), ['RULE_VIOLATION', 'ok']);
  assert.equal((await one<{ uses_count: number }>(sql`SELECT uses_count FROM discount_codes WHERE id = ${last.id}`)).uses_count, 1);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM orders WHERE discount_code_id = ${last.id}`), 1);
});

test('account checkout fills the buyer, recipient and household; delivery comes from settings', { skip }, async () => {
  const me = users[0]!;
  const p = await product(10, 500);
  await add({ userId: me.id }, p, 1);
  const placed = await orders.placeOrder({ userId: me.id, email: me.email }, form({ email: undefined, speed: 'express', method: 'cod' }));
  assert.equal(placed.totals.shippingPaise, 25_000, 'express fee from store settings');
  const o = await one<{ placed_by_user_id: string; for_profile_id: string | null; for_household_id: string | null; guest_email: string | null; payment_status: string }>(sql`
    SELECT placed_by_user_id, for_profile_id, for_household_id, guest_email, payment_status FROM orders WHERE id = ${placed.orderId}`);
  assert.equal(o.placed_by_user_id, me.id);
  assert.ok(o.for_profile_id && o.for_household_id);
  assert.deepEqual([o.guest_email, o.payment_status], [null, 'pending'], 'cash on delivery is collected later');
  const mine = await orders.listMyOrders(me.id);
  assert.equal(mine[0]!.orderNumber, placed.orderNumber);
  assert.equal(mine[0]!.paymentMethod, 'cod');
  assert.equal(mine[0]!.canCancel, true);
  assert.deepEqual(await orders.listMyOrders(users[1]!.id), [], 'lists are private');
});

test('cancel: once inside the window, stock back, money back; refused after it and for anyone else', { skip, timeout: 240_000 }, async () => {
  const [me, other] = [users[0]!, users[1]!];
  const p = await product(10, 700);
  const buy = async (method: 'card' | 'cod') => {
    await add({ userId: me.id }, p, 2);
    return orders.placeOrder({ userId: me.id, email: me.email }, form({ email: undefined, method }));
  };
  const paid = await buy('card');
  assert.equal(await stockOf(p.id), 8);
  assert.equal(await code(orders.cancelOrder(other.id, paid.orderNumber)), 'NOT_FOUND');
  const results = await Promise.all([1, 2, 3].map(() => code(orders.cancelOrder(me.id, paid.orderNumber))));
  assert.equal(results.filter((r) => r === 'ok').length, 1);
  assert.equal(await stockOf(p.id), 10);
  assert.equal(await count(sql`SELECT count(*)::int AS n FROM refunds WHERE order_id = ${paid.orderId} AND status = 'completed' AND method = 'source'`), 1);
  const after = await one<{ status: string; payment_status: string }>(sql`SELECT status, payment_status FROM orders WHERE id = ${paid.orderId}`);
  assert.deepEqual(after, { status: 'cancelled', payment_status: 'refunded' });
  assert.equal(await code(orders.cancelOrder(me.id, paid.orderNumber)), 'RULE_VIOLATION');

  const cod = await buy('cod');
  assert.deepEqual(await orders.cancelOrder(me.id, cod.orderNumber), { refunded: false }, 'nothing was collected, nothing to refund');

  const late = await buy('card');
  await db().execute(sql`UPDATE orders SET cancellable_until = now() - interval '1 second' WHERE id = ${late.orderId}`);
  assert.equal((await orders.getOrderForViewer(late.orderNumber, { userId: me.id })).canCancel, false);
  assert.equal(await code(orders.cancelOrder(me.id, late.orderNumber)), 'RULE_VIOLATION');
  assert.equal(await stockOf(p.id), 8, 'the late order keeps its stock');
});

test('several buyers check out the same product at once: no deadlock, no oversell', { skip, timeout: 240_000 }, async () => {
  const p = await product(3);
  const buyers = await Promise.all(Array.from({ length: 5 }, async () => { const g = guest(); await add(g, p, 1); return g; }));
  const results = await Promise.all(buyers.map((g) => code(orders.placeOrder(g, form()))));
  assert.deepEqual(results.filter((r) => r !== 'ok').every((r) => r === 'STOCK_INSUFFICIENT'), true, results.join(', '));
  assert.equal(results.filter((r) => r === 'ok').length, 3);
  assert.equal(await stockOf(p.id), 0);
});
