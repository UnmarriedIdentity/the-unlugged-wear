// Break-it tests: staff refunds, cash-on-delivery payouts, retry safety, lists. Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('../catalog/index.ts');
const cart = await import('../cart/index.ts');
const orders = await import('./index.ts');
const payments = await import('../payments/index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { uuidv7 } = await import('../../platform/ids/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let staff = '';
const S = c.catalogSchemas;
const db = () => getDb();
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const one = async <T extends Record<string, unknown>>(q: ReturnType<typeof sql>) => (await db().execute<T>(q)).rows[0]!;
const address = { fullName: 'Asha Rao', line1: '12 100 Feet Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', country: 'India' as const, phone: '9876543210' };
let product: { id: string };

/** A ₹2,000 order (₹1,000 × 2, free delivery). */
async function buy(method: 'card' | 'cod' = 'card') {
  const g = { sessionId: uuidv7().replace(/-/g, '') };
  await cart.addLine(g, { productRef: product.id, color: 'Black', size: 'M', qty: 2 });
  return orders.placeOrder(g, orders.orderSchemas.placeOrder.parse({ checkoutKey: uuidv7(), email: 'refund.me@example.com', shippingAddress: address, method }));
}
const refund = (orderNumber: string, amountPaise: number, over: Partial<Parameters<typeof orders.issueRefund>[0]> = {}) =>
  orders.issueRefund({ orderNumber, amountPaise, reason: 'Goodwill for a late delivery', method: 'source', idempotencyKey: uuidv7(), ...over }, staff);
const orderPay = async (orderNumber: string) => one<{ payment_status: string; pay: string }>(sql`
  SELECT o.payment_status, p.status AS pay FROM orders o JOIN payments p ON p.order_id = o.id WHERE o.order_number = ${orderNumber}`);

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  staff = (await auth.bootstrapAdmin({ email: 'refunds-staff@example.com', password: 'admin pass 12', firstName: 'Ravi', lastName: 'Money' })).userId;
  await c.adminSaveCategory(S.categoryFields.parse({ name: 'Tees' }), staff);
  product = await c.adminCreateProduct(S.productFields.parse({ name: 'Refund Tee', slug: 'refund-tee', category: 'Tees', price: 1000, colors: ['Black'], sizes: ['M'], partner: 'Custom Atelier', publicationStatus: 'published', description: 'd',
    variants: [{ color: 'Black', size: 'M', price: 1000, stock: 500 }] }), staff);
  // Free delivery from ₹1,000 here, so every test order is exactly ₹2,000.
  await db().execute(sql`UPDATE store_settings SET value = to_jsonb('1000.00'::text) WHERE key = 'shipping.free_threshold'`);
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('masking: only part of a UPI id or account is ever kept', () => {
  assert.equal(payments.maskDestination('asha.rao@okaxis'), 'as***@okaxis');
  assert.equal(payments.maskDestination(' 1234 5678 9012 '), '••••9012');
  assert.equal(payments.maskDestination('12'), '••••');
});

test('prepaid: partial refunds add up, never past what was paid; the last rupee marks it refunded', { skip, timeout: 240_000 }, async () => {
  const o = await buy();
  const first = await refund(o.orderNumber, 50_000);
  assert.equal(first.status, 'completed');
  assert.deepEqual([first.order.refundedPaise, first.order.availablePaise], [50_000, 150_000]);
  assert.deepEqual(await orderPay(o.orderNumber), { payment_status: 'paid', pay: 'captured' }, 'a partial refund keeps it paid');
  assert.equal(await code(refund(o.orderNumber, 150_001)), 'RULE_VIOLATION', 'one paisa too many');
  assert.equal(await code(refund(o.orderNumber, 0)), 'VALIDATION_FAILED', 'nothing to refund is bad input');
  const last = await refund(o.orderNumber, 150_000);
  assert.equal(last.order.availablePaise, 0);
  assert.deepEqual(await orderPay(o.orderNumber), { payment_status: 'refunded', pay: 'refunded' });
  assert.equal(await code(refund(o.orderNumber, 1)), 'RULE_VIOLATION', 'nothing left');
  assert.equal(await code(refund(o.orderNumber, 100, { method: 'upi', destination: 'x@okaxis' })), 'RULE_VIOLATION', 'prepaid goes back to source only');
});

test('retry safety: the same key is one refund, in parallel too; a reused key with another amount is refused', { skip, timeout: 240_000 }, async () => {
  const o = await buy();
  const key = uuidv7();
  const results = await Promise.all([1, 2, 3].map(() => refund(o.orderNumber, 30_000, { idempotencyKey: key }).catch((e) => e)));
  const ok = results.filter((r) => r.refundId);
  assert.equal(new Set(ok.map((r) => r.refundId)).size, 1, 'one refund row');
  assert.equal((await one<{ n: number }>(sql`SELECT count(*)::int AS n FROM refunds r JOIN orders o ON o.id = r.order_id WHERE o.order_number = ${o.orderNumber}`)).n, 1);
  assert.equal(await code(refund(o.orderNumber, 40_000, { idempotencyKey: key })), 'IDEMPOTENCY_KEY_REUSED');
});

test('two staff racing for the remaining balance can never refund more than was paid', { skip, timeout: 240_000 }, async () => {
  const o = await buy();
  const results = await Promise.all([1, 2, 3, 4].map(() => code(refund(o.orderNumber, 80_000))));
  assert.equal(results.filter((r) => r === 'ok').length, 2, '₹800 fits twice into ₹2,000, not three times');
  const sum = await one<{ s: string }>(sql`SELECT sum(r.amount) AS s FROM refunds r JOIN orders o ON o.id = r.order_id WHERE o.order_number = ${o.orderNumber} AND r.status = 'completed'`);
  assert.equal(sum.s, '1600.00');
});

test('cash on delivery: collected first, paid out by UPI or bank with a UTR, one open payout at a time', { skip, timeout: 240_000 }, async () => {
  const o = await buy('cod');
  assert.equal(await code(refund(o.orderNumber, 10_000, { method: 'upi', destination: 'asha.rao@okaxis' })), 'RULE_VIOLATION', 'nothing collected yet');
  await orders.markCodCollected(o.orderNumber, staff);
  assert.deepEqual(await orderPay(o.orderNumber), { payment_status: 'paid', pay: 'captured' });
  assert.equal(await code(orders.markCodCollected(o.orderNumber, staff)), 'RULE_VIOLATION', 'collected once');
  assert.equal(await code(refund(o.orderNumber, 10_000)), 'RULE_VIOLATION', 'cash has no payment to reverse');
  assert.equal(await code(refund(o.orderNumber, 10_000, { method: 'upi' })), 'VALIDATION_FAILED', 'needs a destination');

  const first = await refund(o.orderNumber, 60_000, { method: 'upi', destination: 'asha.rao@okaxis' });
  assert.equal(first.status, 'processing');
  const stored = await one<{ payout_destination_masked: string; payout_reference: string | null }>(sql`SELECT payout_destination_masked, payout_reference FROM refunds WHERE id = ${first.refundId}`);
  assert.deepEqual(stored, { payout_destination_masked: 'as***@okaxis', payout_reference: null }, 'the full UPI id is never stored');
  assert.equal(first.order.availablePaise, 140_000, 'an open payout holds its amount');
  assert.equal(await code(refund(o.orderNumber, 10_000, { method: 'bank_transfer', destination: '123456789012' })), 'CONFLICT', 'one open payout at a time');

  assert.equal(await code(orders.markRefundPaid(first.refundId, 'abc', staff)), 'VALIDATION_FAILED');
  await orders.markRefundPaid(first.refundId, 'hdfc0012345678', staff);
  assert.equal(await code(orders.markRefundPaid(first.refundId, 'HDFC0012345679', staff)), 'RULE_VIOLATION', 'already completed');

  const second = await refund(o.orderNumber, 40_000, { method: 'bank_transfer', destination: '1234 5678 9012' });
  assert.equal(await code(orders.markRefundPaid(second.refundId, 'HDFC0012345678', staff)), 'CONFLICT', 'one UTR proves one payout');
  assert.equal(await code(orders.markRefundRejected(second.refundId, '', staff)), 'VALIDATION_FAILED');
  await orders.markRefundRejected(second.refundId, 'Customer gave a closed account', staff);
  const after = await orders.refundableOrder(o.orderNumber);
  assert.deepEqual([after.refundedPaise, after.openPaise, after.availablePaise, after.hasOpenRefund], [60_000, 0, 140_000, false], 'a rejected payout frees its amount');
});

test('cancelling after a partial refund sends back only what is left', { skip, timeout: 240_000 }, async () => {
  const o = await buy();
  await refund(o.orderNumber, 25_000);
  const d = await orders.adminSetOrderStatus({ orderNumber: o.orderNumber, to: 'cancelled' }, staff, { canRefund: true });
  assert.equal(d.refundedPaise, 200_000, 'refunds total exactly what was paid');
  assert.deepEqual(await orderPay(o.orderNumber), { payment_status: 'refunded', pay: 'refunded' });
});

test('a cancelled cash-on-delivery order has no cash to collect', { skip, timeout: 120_000 }, async () => {
  const o = await buy('cod');
  await orders.adminSetOrderStatus({ orderNumber: o.orderNumber, to: 'cancelled' }, staff, { canRefund: false });
  assert.equal(await code(orders.markCodCollected(o.orderNumber, staff)), 'RULE_VIOLATION');
});

test('lists: payments and refunds filter, search and count in SQL', { skip, timeout: 240_000 }, async () => {
  const pays = await orders.listPayments({ perPage: 100 });
  assert.ok(pays.total >= 6);
  assert.ok(pays.rows.every((r) => r.orderNumber && r.amountPaise > 0));
  assert.ok((await orders.listPayments({ status: 'pending' })).rows.every((r) => r.status === 'pending'));
  assert.ok(pays.stats.refundedPaise > 0);
  const refunds = await orders.listRefunds({ status: 'rejected' });
  assert.equal(refunds.rows.length, 1);
  assert.equal(refunds.rows[0]!.actorName, 'Ravi Money');
  assert.equal((await orders.listRefunds({ q: 'HDFC0012345678' })).rows.length, 1, 'search by UTR');
  assert.equal((await orders.listRefunds({ q: '%' })).total, 0, '% is a character');
  assert.ok(refunds.stats.completed >= 3 && refunds.stats.processing === 0);
  assert.equal((await one<{ n: number }>(sql`SELECT count(*)::int AS n FROM audit_logs WHERE entity = 'refunds'`)).n >= 5, true, 'refunds are audited');
});
