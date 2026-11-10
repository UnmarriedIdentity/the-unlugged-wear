import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPaise, toRupees, formatINR, percentOf, taxableFromInclusive } from './index.ts';

test('DB decimals convert to paise without float error', () => {
  assert.equal(toPaise('3899.00'), 389900);
  assert.equal(toPaise('0.1'), 10);
  assert.equal(toPaise('12.05'), 1205);
  assert.equal(toPaise(19.99), 1999);
  assert.equal(toPaise('-150.5'), -15050);
  assert.throws(() => toPaise('12.345'));
  assert.throws(() => toPaise('abc'));
});

test('paise convert back to DB decimals', () => {
  assert.equal(toRupees(389900), '3899.00');
  assert.equal(toRupees(5), '0.05');
  assert.equal(toRupees(-15050), '-150.50');
  assert.throws(() => toRupees(10.5));
  for (const p of [0, 1, 99, 100, 123456789]) assert.equal(toPaise(toRupees(p)), p);
});

test('display, percentages and inclusive GST', () => {
  assert.equal(formatINR(389900), '₹3,899');
  assert.equal(percentOf(99900, 10), 9990);
  assert.equal(taxableFromInclusive(105000, 5), 100000);
});
