import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emit, subscribe, clearSubscribers } from './index.ts';

test('subscribers run in order and one failure does not stop the rest', async () => {
  clearSubscribers();
  const seen: string[] = [];
  subscribe('platform.ping', () => { seen.push('a'); });
  subscribe('platform.ping', () => { throw new Error('boom'); });
  const off = subscribe('platform.ping', async ({ at }) => { seen.push(`c:${at}`); });
  const res = await emit('platform.ping', { at: 't1' });
  assert.deepEqual(seen, ['a', 'c:t1']);
  assert.equal(res.delivered, 2);
  assert.equal(res.failures.length, 1);
  off();
  await emit('platform.ping', { at: 't2' });
  assert.deepEqual(seen, ['a', 'c:t1', 'a']);
});
