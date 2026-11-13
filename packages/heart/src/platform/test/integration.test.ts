// Integration tests against a throwaway schema (skipped without a database).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, hasTestDatabase, type TestDatabase } from './index.ts';
import { claim, complete, fail, hashRequest } from '../idempotency/index.ts';
import { processClaimed } from '../jobs/index.ts';
import { checkDatabase } from '../db/index.ts';
import { AppError } from '../errors/index.ts';

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let db: TestDatabase;

before(async () => { if (!skip) db = await createTestDatabase(); }, { timeout: 180_000 });
after(async () => { await db?.drop(); });

const base = { scope: 'checkout', actorRef: 'user:test-1', key: 'key-0001-abcdef', requestHash: hashRequest('checkout', { cart: 1 }) };
const errCode = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as AppError).code; } };

test('test schema is migrated and seeded', { skip }, async () => {
  const { rows } = await db.pool.query(`SELECT count(*)::int AS n FROM roles`);
  assert.equal(rows[0].n, 4);
  const health = await checkDatabase();
  assert.equal(health.ok, true);
  assert.ok(health.migrations >= 0);
});

test('idempotency: execute once, replay after completion', { skip }, async () => {
  const first = await claim(base);
  assert.equal(first.kind, 'execute');
  assert.equal(await errCode(claim(base)), 'REQUEST_IN_PROGRESS');
  await complete((first as { id: string }).id, 200, { orderNumber: 'TUW-1' });
  const again = await claim(base);
  assert.deepEqual(again, { kind: 'replay', status: 200, body: { orderNumber: 'TUW-1' } });
});

test('idempotency: same key, different body is rejected; other caller is independent', { skip }, async () => {
  assert.equal(await errCode(claim({ ...base, requestHash: hashRequest('checkout', { cart: 2 }) })), 'IDEMPOTENCY_KEY_REUSED');
  const other = await claim({ ...base, actorRef: 'user:test-2' });
  assert.equal(other.kind, 'execute');
});

test('idempotency: a 5xx failure stays retryable, a 4xx is replayed', { skip }, async () => {
  const a = await claim({ ...base, key: 'key-0002-abcdef' });
  await fail((a as { id: string }).id, 500, { error: 'x' });
  assert.equal((await claim({ ...base, key: 'key-0002-abcdef' })).kind, 'execute');
  const b = await claim({ ...base, key: 'key-0003-abcdef' });
  await fail((b as { id: string }).id, 409, { error: { code: 'STOCK_INSUFFICIENT' } });
  assert.deepEqual(await claim({ ...base, key: 'key-0003-abcdef' }), { kind: 'replay', status: 409, body: { error: { code: 'STOCK_INSUFFICIENT' } } });
  assert.equal(await errCode(claim({ ...base, key: 'bad key!' })), 'VALIDATION_FAILED');
});

test('jobs: processClaimed claims rows, isolates a failing row', { skip }, async () => {
  await db.pool.query(`CREATE TABLE job_probe (id int PRIMARY KEY, done boolean NOT NULL DEFAULT false)`);
  await db.pool.query(`INSERT INTO job_probe (id) VALUES (1), (2), (3)`);
  const result = await processClaimed<{ id: number }>(
    `SELECT id FROM job_probe WHERE NOT done ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 10`, [],
    async (row, client) => {
      if (row.id === 2) throw new Error('bad row');
      await client.query(`UPDATE job_probe SET done = true WHERE id = $1`, [row.id]);
    },
  );
  assert.deepEqual(result, { processed: 2, failed: 1 });
  const { rows } = await db.pool.query(`SELECT id FROM job_probe WHERE done ORDER BY id`);
  assert.deepEqual(rows.map((r) => r.id), [1, 3]);
});
