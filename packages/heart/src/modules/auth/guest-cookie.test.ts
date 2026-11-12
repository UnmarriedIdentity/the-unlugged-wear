import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';
const { newGuestCookie, verifyGuestCookie } = await import('./tokens.ts');

test('guest cookie: our signature passes, anything forged or malformed is no guest', () => {
  const { id, value } = newGuestCookie();
  assert.match(id, /^[0-9a-f]{32}$/);
  assert.equal(verifyGuestCookie(value), id);
  assert.notEqual(newGuestCookie().id, id, 'ids are random');
  const [, sig] = value.split('.');
  const other = 'f'.repeat(32);
  assert.equal(verifyGuestCookie(`${other}.${sig}`), null, 'a signature does not move to another id');
  for (const bad of [undefined, null, '', id, `${id}.`, `${id}.${'A'.repeat(32)}`, `${id.toUpperCase()}.${sig}`, `${id}.${sig}x`, `../${id}.${sig}`]) {
    assert.equal(verifyGuestCookie(bad), null, String(bad));
  }
});
