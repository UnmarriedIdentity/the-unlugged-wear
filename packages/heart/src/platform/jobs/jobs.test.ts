import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerJob, runJob, listJobs, clearJobs } from './index.ts';

test('runJob reports success, failure and unknown jobs without throwing', async () => {
  clearJobs();
  registerJob({ name: 'demo.ok', description: 'ok', run: async () => ({ processed: 3 }) });
  registerJob({ name: 'demo.boom', description: 'fails', run: async () => { throw new Error('nope'); } });
  assert.equal(listJobs().length, 2);
  const ok = await runJob('demo.ok');
  assert.equal(ok.ok, true); assert.equal(ok.processed, 3);
  const boom = await runJob('demo.boom');
  assert.equal(boom.ok, false); assert.equal(boom.error, 'nope');
  assert.equal((await runJob('demo.missing')).error, 'Unknown job');
  assert.throws(() => registerJob({ name: 'Bad Name', description: '', run: async () => ({ processed: 0 }) }));
});
