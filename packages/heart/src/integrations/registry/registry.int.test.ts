// Break-it tests for the integration registry (stress-testing skill). Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../../modules/auth/index.ts');
const r = await import('./index.ts');
const payments = await import('../payments/index.ts');
const { getDb } = await import('../../platform/db/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let adminId = '';
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const active = async (category: string) => (await getDb().execute<{ slug: string }>(sql`SELECT slug FROM integration_providers WHERE category = ${category} AND is_active ORDER BY slug`)).rows.map((x) => x.slug);

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  adminId = (await auth.bootstrapAdmin({ email: 'registry-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('lists the seeded providers with adapter state; demo gateway is the active one', { skip }, async () => {
  const list = await r.listProviders('payment');
  assert.deepEqual(list.map((p) => p.slug).sort(), ['mock', 'razorpay', 'stripe']);
  const mock = list.find((p) => p.slug === 'mock')!;
  assert.equal(mock.isActive, true);
  assert.equal(mock.hasAdapter, true);
  assert.equal(mock.liveReady, false);
  assert.equal(list.find((p) => p.slug === 'razorpay')!.hasAdapter, false);
  assert.equal((await payments.getPaymentGateway()).slug, 'mock');
});

test('no adapter → cannot switch on; no live keys → cannot go live; unknown → NOT_FOUND', { skip }, async () => {
  assert.equal(await code(r.updateProvider('razorpay', { isActive: true }, adminId)), 'RULE_VIOLATION');
  assert.equal(await code(r.updateProvider('mock', { environment: 'live' }, adminId)), 'RULE_VIOLATION');
  assert.equal(await code(r.updateProvider('qikink', { environment: 'live' }, adminId)), 'RULE_VIOLATION');
  assert.equal(await code(r.updateProvider('nope', { isActive: true }, adminId)), 'NOT_FOUND');
  assert.deepEqual(await active('payment'), ['mock']);
});

test('payment keeps exactly one active provider; the last one cannot be switched off', { skip }, async () => {
  assert.equal(await code(r.updateProvider('mock', { isActive: false }, adminId)), 'RULE_VIOLATION');
  assert.deepEqual(await active('payment'), ['mock']);
});

test('fulfilment: simulator switches on in sandbox; in-house atelier may run live; parallel toggles stay consistent', { skip }, async () => {
  await r.updateProvider('qikink', { isActive: true }, adminId);
  await r.updateProvider('custom_atelier', { isActive: true }, adminId);
  assert.deepEqual(await active('fulfillment'), ['custom_atelier', 'qikink']);
  await Promise.all(Array.from({ length: 6 }, (_, i) => r.updateProvider('qikink', { isActive: i % 2 === 0 }, adminId)));
  const [row] = (await getDb().execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM integration_providers WHERE slug = 'qikink'`)).rows;
  assert.equal(row!.n, 1);
  const audits = (await getDb().execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'integration.update'`)).rows[0]!.n;
  assert.ok(audits >= 2, 'every real change is audited');
});

test('email: one active sender, no secrets in the registry rows', { skip }, async () => {
  assert.deepEqual(await active('email'), ['mock_email']);
  assert.equal(await code(r.updateProvider('mock_email', { isActive: false }, adminId)), 'RULE_VIOLATION');
  const { rows } = await getDb().execute<{ settings: unknown }>(sql`SELECT settings FROM integration_providers`);
  assert.equal(JSON.stringify(rows).match(/secret|api_key|token|password/i), null);
});
