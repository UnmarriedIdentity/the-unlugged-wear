// Break-it tests for the settings module (stress-testing skill). Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const s = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
let adminId = '';
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const fields = async (p: Promise<unknown>) => { try { await p; return []; } catch (e) { return ((e as { details?: { field?: string }[] }).details ?? []).map((d) => d.field); } };
const rows = async () => (await getDb().execute<{ key: string; value: unknown }>(sql`SELECT key, value FROM store_settings ORDER BY key`)).rows;

before(async () => {
  if (skip) return;
  drop = (await createTestDatabase()).drop;
  adminId = (await auth.bootstrapAdmin({ email: 'settings-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' })).userId;
}, { timeout: 180_000 });
after(async () => { await drop?.(); });

test('seed and registry agree: every seeded key is known and valid, every key is seeded', { skip }, async () => {
  const seeded = await rows();
  const known = Object.keys(s.SETTING_KEYS);
  assert.deepEqual(seeded.map((r) => r.key).sort(), [...known].sort());
  for (const r of seeded) {
    const parsed = s.SETTING_KEYS[r.key as keyof typeof s.SETTING_KEYS].schema.safeParse(r.value);
    assert.ok(parsed.success, `seeded value for ${r.key} must parse`);
  }
  const pub = await s.getPublicSettings();
  assert.equal(pub.shipping.freeThresholdPaise, 300000);
  assert.equal(pub.shipping.standardFeePaise, 15000);
  assert.equal(pub.currency, 'INR');
  assert.equal(JSON.stringify(pub).includes('seller'), false, 'staff-only keys never reach the storefront shape');
});

test('money: rupees in, paise out, stored as a decimal string — hostile amounts refused', { skip }, async () => {
  const saved = await s.updateSettings('shipping', { 'shipping.standard_fee': '₹1,49.50', 'shipping.free_threshold': 2999 }, adminId);
  assert.equal(saved.values['shipping.standard_fee'], 14950);
  assert.equal(saved.values['shipping.free_threshold'], 299900);
  const stored = (await rows()).find((r) => r.key === 'shipping.standard_fee')!.value;
  assert.equal(stored, '149.50', 'never a JSON float');
  for (const bad of ['-1', '150.005', '1e3', 'NaN', '', '100000.01', 'Infinity', null, true]) {
    assert.equal(await code(s.updateSettings('shipping', { 'shipping.cod_fee': bad }, adminId)), 'VALIDATION_FAILED', `rejects ${String(bad)}`);
  }
  assert.equal(await s.getSetting('shipping.cod_fee'), 0, 'a refused save changes nothing');
});

test('refuses unknown keys, keys from another tab, read-only keys — and reports every field', { skip }, async () => {
  assert.deepEqual(await fields(s.updateSettings('general', { 'store.currency': 'USD' }, adminId)), ['store.currency']);
  assert.deepEqual(await fields(s.updateSettings('general', { 'shipping.cod_fee': '10' }, adminId)), ['shipping.cod_fee']);
  assert.deepEqual(await fields(s.updateSettings('general', { 'qikink.api_key': 'sk_live_x', '__proto__': 1 }, adminId)), ['qikink.api_key']);
  assert.deepEqual(
    (await fields(s.updateSettings('general', { 'store.support_email': 'nope', 'store.timezone': 'Mars/Olympus', 'store.name': '   ' }, adminId))).sort(),
    ['store.name', 'store.support_email', 'store.timezone'],
  );
  assert.equal((await rows()).some((r) => r.key === 'qikink.api_key'), false, 'no secret-looking key ever lands');
});

test('policies, taxes and brand rules', { skip }, async () => {
  for (const [k, v] of [['orders.cancel_window_minutes', 1441], ['exchange.window_days', -1], ['gift_card.validity_months', 0], ['inventory.low_stock_threshold', 2.5]] as const) {
    assert.equal(await code(s.updateSettings('policies', { [k]: v }, adminId)), 'VALIDATION_FAILED', `${k}=${v}`);
  }
  await s.updateSettings('policies', { 'exchange.window_days': '10' }, adminId);
  assert.equal(await s.getSetting('exchange.window_days'), 10);
  assert.equal(await code(s.updateSettings('taxes', { 'invoice.seller_gstin': '24ABCDE1234F1Z' }, adminId)), 'VALIDATION_FAILED');
  await s.updateSettings('taxes', { 'invoice.seller_gstin': '24abcde1234f1z5', 'tax.included': 'false' }, adminId);
  assert.equal(await s.getSetting('invoice.seller_gstin'), '24ABCDE1234F1Z5');
  assert.equal(await s.getSetting('tax.included'), false);
  await s.updateSettings('taxes', { 'invoice.seller_gstin': '' }, adminId);
  assert.equal(await s.getSetting('invoice.seller_gstin'), null, 'blank clears it');
  assert.equal(await code(s.updateSettings('brand', { 'brand.color': 'red' }, adminId)), 'VALIDATION_FAILED');
});

test('audit: one row per real change with only the changed keys; a no-op save writes nothing', { skip }, async () => {
  const count = async () => (await getDb().execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'settings.update'`)).rows[0]!.n;
  const before = await count();
  const same = await s.updateSettings('general', { 'store.name': 'The Unplugged Wear' }, adminId);
  assert.deepEqual(same.changed, []);
  assert.equal(await count(), before);
  const res = await s.updateSettings('general', { 'store.name': 'The Unplugged Wear', 'store.support_email': 'HELLO@Example.com' }, adminId);
  assert.deepEqual(res.changed, ['store.support_email']);
  const [row] = (await getDb().execute<{ diff: Record<string, { from: unknown; to: unknown }>; actor_id: string }>(sql`SELECT diff, actor_id FROM audit_logs WHERE action = 'settings.update' ORDER BY created_at DESC LIMIT 1`)).rows;
  assert.deepEqual(Object.keys(row!.diff), ['store.support_email']);
  assert.equal(row!.diff['store.support_email']!.to, 'hello@example.com');
  assert.equal(row!.actor_id, adminId);
});

test('concurrent saves of different keys never clobber each other', { skip }, async () => {
  await Promise.all([
    s.updateSettings('shipping', { 'shipping.standard_fee': '99' }, adminId),
    s.updateSettings('shipping', { 'shipping.cod_fee': '49' }, adminId),
    s.updateSettings('policies', { 'gift_card.validity_months': 12 }, adminId),
  ]);
  const all = await s.getSettings();
  assert.equal(all['shipping.standard_fee'], 9900);
  assert.equal(all['shipping.cod_fee'], 4900);
  assert.equal(all['gift_card.validity_months'], 12);
});

test('reads survive a corrupt or missing row (fallback, never a crash)', { skip }, async () => {
  await getDb().execute(sql`UPDATE store_settings SET value = '"lots"'::jsonb WHERE key = 'exchange.window_days'`);
  await getDb().execute(sql`DELETE FROM store_settings WHERE key = 'store.timezone'`);
  const pub = await s.getPublicSettings();
  assert.equal(pub.exchangeWindowDays, 7);
  assert.equal(pub.timezone, 'Asia/Kolkata');
  assert.deepEqual(s.fallbackPublicSettings().shipping, { freeThresholdPaise: 300000, standardFeePaise: 15000, codFeePaise: 0, expressFeePaise: 25000 });
});
