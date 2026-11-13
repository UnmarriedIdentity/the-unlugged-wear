// Unit tests for the mock adapters (no database).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockGateway } from './payments/adapters.ts';
import { createQikinkSimulator, mapQikinkStatus } from './fulfillment/adapters.ts';
import { createMemoryStore } from './storage/index.ts';

test('demo gateway: integer paise only, deterministic refs, decline path', async () => {
  for (const bad of [0, -100, 10.5, Number.NaN, 2 ** 60]) {
    await assert.rejects(mockGateway.createPayment({ reference: 'r1', amountPaise: bad, currency: 'INR' }));
  }
  const ok = await mockGateway.createPayment({ reference: 'pay_1', amountPaise: 389900, currency: 'INR' });
  assert.deepEqual(ok, { providerRef: 'mock_pay_pay_1', status: 'captured', providerStatus: 'captured' });
  const declined = await mockGateway.createPayment({ reference: 'pay_2', amountPaise: 100, currency: 'INR', simulate: 'decline' });
  assert.equal(declined.status, 'failed');
});

test('Qikink map: every documented word, case/space tolerant; unknown words never look happy', () => {
  assert.equal(mapQikinkStatus('Live OOS'), 'on_hold');
  assert.equal(mapQikinkStatus('  in-transit '), 'shipped');
  assert.equal(mapQikinkStatus('Partially Picklisted'), 'in_production');
  assert.equal(mapQikinkStatus('RTO Initiated'), 'rto_initiated');
  assert.equal(mapQikinkStatus('Teleported'), 'on_hold');
  assert.equal(mapQikinkStatus(''), 'on_hold');
});

test('Qikink simulator: idempotent per reference, cancel only while Live, input validated', async () => {
  const qk = createQikinkSimulator();
  const order = { reference: 'TUW-1', gateway: 'prepaid' as const, lines: [{ sku: 'v-123', quantity: 1 }], shipTo: { name: 'Asha', line1: '12 100 Feet Rd', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', phone: '9876543210' } };
  const a = await qk.createOrder(order);
  const b = await qk.createOrder(order);
  assert.equal(a.providerOrderRef, b.providerOrderRef);
  assert.equal(a.status, 'submitted');
  assert.deepEqual(await qk.cancelOrder(a.providerOrderRef), { cancelled: true, providerStatus: 'Cancelled' });
  assert.deepEqual(await qk.cancelOrder(a.providerOrderRef), { cancelled: false, providerStatus: 'Cancelled' });
  await assert.rejects(qk.createOrder({ ...order, reference: 'TUW-2', lines: [{ sku: 'v-1', quantity: 0 }] }));
  await assert.rejects(qk.createOrder({ ...order, reference: 'TUW-3', gateway: 'cod' }), /COD/);
});

test('memory store: refuses traversal and oversized objects; copies bytes', async () => {
  const store = createMemoryStore(8);
  await assert.rejects(store.put('../etc/passwd', new Uint8Array(1), 'text/plain'));
  await assert.rejects(store.put('/abs', new Uint8Array(1), 'text/plain'));
  await assert.rejects(store.put('designs/a.png', new Uint8Array(9), 'image/png'));
  const bytes = new Uint8Array([1, 2, 3]);
  await store.put('designs/a.png', bytes, 'image/png');
  bytes[0] = 9;
  assert.equal((await store.get('designs/a.png'))!.bytes[0], 1);
});
