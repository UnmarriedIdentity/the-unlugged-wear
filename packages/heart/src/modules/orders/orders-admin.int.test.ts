// Break-it tests: staff order list and status changes, discount codes, guest tracking and claiming, rate limits. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('../catalog/index.ts');
const cart = await import('../cart/index.ts');
const orders = await import('./index.ts');
const { hitRateLimit } = await import('../../platform/ratelimit/index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let staff = '';
const users: { id: string; email: string }[] = [];
const S = c.catalogSchemas;
const db = () => getDb();
const meta = { origin: 'https://shop.example.com' };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const one = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db().execute<T>(q)).rows[0]!;
const guest = () => ({ sessionId: uuidv7().replace(/-/g, '') });
const address = { fullName: 'Asha Rao', line1: '12 100 Feet Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'India' as const, phone: '9876543210' };
const form = (over: Record<string, unknown> = {}) => orders.orderSchemas.placeOrder.parse({ checkoutKey: uuidv7(), email: 'walk.in@example.com', shippingAddress: address, method: 'card', ...over });
const can = { canRefund: true };

let seq = 0;
async function product(stock = 50) {
  seq += 1;
  return c.adminCreateProduct(S.productFields.parse({ name: `Staff Tee ${seq}`, slug: `staff-tee-${seq}`, category: 'Tees', price: 999, colors: ['Black'], sizes: ['M'], partner: 'Custom Atelier', publicationStatus: 'published', description: 'd',
    variants: [{ color: 'Black', size: 'M', price: 999, stock }] }), actor());
}
const actor = () => staff;
async function buy(p: { id: string }, opts: { email?: string; userId?: string; method?: 'card' | 'cod' } = {}) {
  const owner = opts.userId ? { userId: opts.userId } : guest();
  await cart.addLine(owner, { productRef: p.id, color: 'Black', size: 'M', qty: 1 });
  const buyer = opts.userId ? { userId: opts.userId, email: '' } : (owner as { sessionId: string });
  return orders.placeOrder(buyer, form({ email: opts.userId ? undefined : opts.email ?? 'walk.in@example.com', method: opts.method ?? 'card' }));
}
const stockOf = async (productId: string) => (await one<{ stock: number }>(sql`SELECT stock FROM product_variants WHERE product_id = ${productId}`)).stock;

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  staff = (await auth.bootstrapAdmin({ email: 'orders-staff@example.com', password: 'admin pass 12', firstName: 'Priya', lastName: 'Staff' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), staff);
  for (const name of ['meera', 'kabir']) {
    const email = `${name}.claim@example.com`;
    await auth.register({ email, password: 'shopper pass 12', firstName: name, lastName: 'Claim' }, meta);
    users.push({ id: (await one<{ id: string }>(sql`SELECT id FROM users WHERE email = ${email}`)).id, email });
  }
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('list: filters, search and paging run in SQL; stats count every order', { skip, timeout: 240_000 }, async () => {
  const p = await product();
  const a = await buy(p, { email: 'list.one@example.com' });
  const b = await buy(p, { email: 'list.two@example.com', method: 'cod' });
  const mine = await buy(p, { userId: users[0]!.id });
  await orders.adminSetOrderStatus({ orderNumber: a.orderNumber, to: 'cancelled' }, staff, can);

  const all = await orders.adminListOrders({ perPage: 2 });
  assert.equal(all.rows.length, 2);
  assert.equal(all.total, 3);
  assert.equal(all.stats.total, 3);
  assert.equal((await orders.adminListOrders({ page: 2, perPage: 2 })).rows.length, 1);
  assert.deepEqual((await orders.adminListOrders({ tab: 'cancelled' })).rows.map((r) => r.orderNumber), [a.orderNumber]);
  assert.deepEqual((await orders.adminListOrders({ tab: 'unpaid' })).rows.map((r) => r.orderNumber), [b.orderNumber], 'cash on delivery is unpaid; cancelled is not');
  assert.deepEqual((await orders.adminListOrders({ q: 'LIST.TWO' })).rows.map((r) => r.orderNumber), [b.orderNumber]);
  assert.deepEqual((await orders.adminListOrders({ q: 'meera' })).rows.map((r) => r.orderNumber), [mine.orderNumber], 'account orders search by name');
  assert.equal((await orders.adminListOrders({ q: '%' })).total, 0, 'a % in the search is a character, not a wildcard');
  const row = (await orders.adminListOrders({ q: a.orderNumber })).rows[0]!;
  assert.deepEqual([row.customerEmail, row.paymentStatus, row.paidPaise, row.refundedPaise], ['list.one@example.com', 'refunded', 114_900, 114_900], '₹999 + ₹150 delivery, all of it refunded');
});

test('status: only allowed moves, once under parallel clicks, every move in the history', { skip, timeout: 240_000 }, async () => {
  const p = await product();
  const o = await buy(p);
  const step = (to: Parameters<typeof orders.adminSetOrderStatus>[0]['to']) => orders.adminSetOrderStatus({ orderNumber: o.orderNumber, to, note: `to ${to}` }, staff, can);
  assert.equal(await code(step('shipped')), 'RULE_VIOLATION', 'cannot skip printing');
  assert.equal(await code(step('refunded')), 'RULE_VIOLATION', 'refunds come from the refunds flow');
  const results = await Promise.all([1, 2, 3].map(() => code(step('confirmed'))));
  assert.equal(results.filter((r) => r === 'ok').length, 1);
  await step('processing');
  await step('shipped');
  const done = await step('delivered');
  assert.deepEqual(done.allowedNext, []);
  assert.deepEqual(done.history.map((h) => h.to), ['pending', 'confirmed', 'processing', 'shipped', 'delivered']);
  assert.equal(done.history[1]!.actor, 'Priya Staff', 'history shows who');
  assert.equal(await code(step('cancelled')), 'RULE_VIOLATION', 'a delivered order is not cancelled here');
  assert.equal(await code(orders.adminSetOrderStatus({ orderNumber: 'TUW-000000-XXXXX', to: 'confirmed' }, staff, can)), 'NOT_FOUND');
});

test('staff cancel: stock back, payment refunded, and refunding needs the refund permission', { skip, timeout: 240_000 }, async () => {
  const p = await product(10);
  const paid = await buy(p);
  await orders.adminSetOrderStatus({ orderNumber: paid.orderNumber, to: 'confirmed' }, staff, can);
  assert.equal(await stockOf(p.id), 9);
  assert.equal(await code(orders.adminSetOrderStatus({ orderNumber: paid.orderNumber, to: 'cancelled' }, staff, { canRefund: false })), 'FORBIDDEN');
  assert.equal(await stockOf(p.id), 9, 'a refused cancel changes nothing');
  const d = await orders.adminSetOrderStatus({ orderNumber: paid.orderNumber, to: 'cancelled', note: 'Out of blanks' }, staff, can);
  assert.deepEqual([d.status, d.paymentStatus, d.refundedPaise], ['cancelled', 'refunded', 114_900], 'the whole payment, delivery included');
  assert.match(d.history.at(-1)!.note ?? '', /Out of blanks; payment refunded/);
  assert.equal(await stockOf(p.id), 10);
  const cod = await buy(p, { method: 'cod' });
  assert.equal((await orders.adminSetOrderStatus({ orderNumber: cod.orderNumber, to: 'cancelled' }, staff, { canRefund: false })).status, 'cancelled', 'nothing was paid, nothing to refund');
});

test('bulk: each order on its own; refusals are named, the rest still move', { skip, timeout: 240_000 }, async () => {
  const p = await product();
  const [a, b] = [await buy(p), await buy(p)];
  await orders.adminSetOrderStatus({ orderNumber: b.orderNumber, to: 'cancelled' }, staff, can);
  const res = await orders.adminSetOrdersStatus([a.orderNumber, b.orderNumber, a.orderNumber, 'TUW-NOPE'], 'confirmed', staff, can);
  assert.deepEqual(res.updated, [a.orderNumber]);
  assert.deepEqual(res.refused.map((r) => r.orderNumber), [b.orderNumber, 'TUW-NOPE']);
});

test('discount codes: rules, duplicates, kill switch, and used codes are never deleted', { skip }, async () => {
  const D = orders.orderSchemas.discountCreate;
  assert.equal(D.safeParse({ code: 'x', discountType: 'percent', value: 10 }).success, false, 'too short');
  assert.equal(D.safeParse({ code: 'SAVE 10', discountType: 'percent', value: 10 }).success, false, 'no spaces');
  assert.equal(D.safeParse({ code: 'SAVE10', discountType: 'fixed', value: 0 }).success, false);
  assert.equal(D.safeParse({ code: 'SAVE10', discountType: 'fixed', value: 10.005 }).success, false);
  assert.equal(await code(orders.adminCreateDiscount(D.parse({ code: 'BIG', discountType: 'percent', value: 101 }), staff)), 'VALIDATION_FAILED');
  assert.equal(await code(orders.adminCreateDiscount(D.parse({ code: 'BACKWARDS', discountType: 'percent', value: 5, startsAt: '2026-12-02', endsAt: '2026-12-01' }), staff)), 'VALIDATION_FAILED');
  const list = await orders.adminCreateDiscount(D.parse({ code: 'staff15', discountType: 'percent', value: 15, maxUses: 3 }), staff);
  const created = list.find((d) => d.code === 'STAFF15')!;
  assert.equal(await code(orders.adminCreateDiscount(D.parse({ code: 'STAFF15', discountType: 'fixed', value: 100 }), staff)), 'CONFLICT');
  await orders.adminSetDiscountActive(created.id, false, staff);
  const p = await product();
  const g = guest();
  await cart.addLine(g, { productRef: p.id, color: 'Black', size: 'M', qty: 1 });
  assert.equal(await code(orders.placeOrder(g, form({ discountCode: 'STAFF15' }))), 'RULE_VIOLATION', 'switched off at checkout too');
  await orders.adminSetDiscountActive(created.id, true, staff);
  await orders.placeOrder(g, form({ discountCode: 'STAFF15' }));
  assert.equal(await code(orders.adminDeleteDiscount(created.id, staff)), 'RULE_VIOLATION');
  const unused = (await orders.adminCreateDiscount(D.parse({ code: 'UNUSED1', discountType: 'fixed', value: 50 }), staff)).find((d) => d.code === 'UNUSED1')!;
  assert.equal((await orders.adminDeleteDiscount(unused.id, staff)).some((d) => d.id === unused.id), false);
  assert.equal((await one<{ n: number }>(sql`SELECT count(*)::int AS n FROM audit_logs WHERE entity = 'discount_codes'`)).n >= 4, true, 'every change is audited');
});

test('track order: the right number and email open it; anything else is one "not found"', { skip, timeout: 240_000 }, async () => {
  const p = await product();
  const o = await buy(p, { email: 'track.me@example.com' });
  const view = await orders.trackOrder(o.orderNumber.toLowerCase(), ' TRACK.ME@example.com ');
  assert.equal(view.orderNumber, o.orderNumber);
  assert.equal(view.canCancel, false);
  const wrongEmail = await orders.trackOrder(o.orderNumber, 'someone.else@example.com').catch((e) => e);
  const wrongNumber = await orders.trackOrder('TUW-000000-AAAAA', 'track.me@example.com').catch((e) => e);
  assert.equal(wrongEmail.code, 'NOT_FOUND');
  assert.equal(wrongEmail.message, wrongNumber.message, 'no hint about which half was wrong');
  const account = await buy(p, { userId: users[1]!.id });
  assert.equal((await orders.trackOrder(account.orderNumber, users[1]!.email)).orderNumber, account.orderNumber, 'account orders track by the account email');
});

test('claim: verified email only, every matching guest order moves once, nobody else\'s', { skip, timeout: 240_000 }, async () => {
  const me = users[0]!;
  const p = await product();
  const a = await buy(p, { email: me.email });
  const b = await buy(p, { email: me.email.toUpperCase() });
  const theirs = await buy(p, { email: 'stranger@example.com' });
  assert.deepEqual(await orders.claimableGuestOrders(me.id), { count: 2, verified: false });
  assert.equal(await code(orders.claimGuestOrders(me.id)), 'RULE_VIOLATION', 'unverified email');
  await db().execute(sql`UPDATE users SET email_verified_at = now() WHERE id = ${me.id}`);
  const [first, second] = await Promise.all([orders.claimGuestOrders(me.id), orders.claimGuestOrders(me.id)]);
  assert.deepEqual([...first.claimed, ...second.claimed].sort(), [a.orderNumber, b.orderNumber].sort(), 'claimed once between two parallel clicks');
  const row = await one<{ placed_by_user_id: string; guest_email: string | null; for_profile_id: string | null; for_household_id: string | null }>(sql`
    SELECT placed_by_user_id, guest_email, for_profile_id, for_household_id FROM orders WHERE order_number = ${a.orderNumber}`);
  assert.equal(row.placed_by_user_id, me.id);
  assert.equal(row.guest_email, null);
  assert.ok(row.for_profile_id && row.for_household_id);
  assert.deepEqual((await orders.claimGuestOrders(me.id)).claimed, []);
  assert.ok((await orders.listMyOrders(me.id)).some((o) => o.orderNumber === a.orderNumber));
  assert.equal((await one<{ guest_email: string }>(sql`SELECT guest_email FROM orders WHERE order_number = ${theirs.orderNumber}`)).guest_email, 'stranger@example.com');
});

test('rate limit: shared across calls, per key, the max-th attempt still passes', { skip }, async () => {
  const limits = (ip: string) => [{ key: ip, max: 3, windowSeconds: 600 }];
  for (let i = 0; i < 3; i++) await hitRateLimit('test.bucket', limits('10.0.0.1'));
  assert.equal(await code(hitRateLimit('test.bucket', limits('10.0.0.1'))), 'RATE_LIMITED');
  assert.equal(await code(hitRateLimit('test.bucket', limits('10.0.0.2'))), 'ok', 'another key is unaffected');
  assert.equal(await code(hitRateLimit('other.bucket', limits('10.0.0.1'))), 'ok', 'another bucket is unaffected');
  const stored = await one<{ raw: number }>(sql`SELECT count(*)::int AS raw FROM rate_limit_hits WHERE key_hash LIKE '%10.0.0.1%'`);
  assert.equal(stored.raw, 0, 'no raw IP is stored');
});

test('product discount schedules can be switched off from the board', { skip }, async () => {
  const p = await c.adminCreateProduct(S.productFields.parse({ name: 'Sale Tee', slug: 'sale-tee', category: 'Tees', price: 999, colors: ['Black'], sizes: ['M'], partner: 'Custom Atelier', publicationStatus: 'draft', description: 'd',
    discounts: [{ discountType: 'percent', value: 10, startsAt: '2026-11-01', endsAt: '2026-12-01', isActive: true }] }), staff);
  const row = (await c.listProductDiscounts()).find((d) => d.productId === p.id)!;
  assert.equal(row.isActive, true);
  assert.equal((await c.setProductDiscountActive(row.id, false, staff)).find((d) => d.id === row.id)!.isActive, false);
  assert.equal(await code(c.setProductDiscountActive(uuidv7(), true, staff)), 'NOT_FOUND');
});

test('customers never see staff notes on their timeline', { skip, timeout: 120_000 }, async () => {
  const p = await product();
  const o = await buy(p, { email: 'notes@example.com' });
  await orders.adminSetOrderStatus({ orderNumber: o.orderNumber, to: 'confirmed', note: 'Customer sounded difficult on the phone' }, staff, can);
  const seen = await orders.trackOrder(o.orderNumber, 'notes@example.com');
  assert.deepEqual(seen.history.map((h) => h.status), ['pending', 'confirmed']);
  assert.equal(seen.history.some((h) => (h.note ?? '').includes('difficult')), false);
  assert.match((await orders.adminGetOrder(o.orderNumber)).history.at(-1)!.note ?? '', /difficult/, 'staff still see it');
});
