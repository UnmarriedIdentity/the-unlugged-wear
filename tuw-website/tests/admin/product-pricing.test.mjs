import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirror of lib/productPricing.ts (self-contained per this project's
// test convention): the compare-at price is optional display copy, but
// when present it must read as a real saving — a valid amount strictly
// above the selling price, rounded to paise precision.
// ---------------------------------------------------------------
const parseCompareAtPrice = (raw, sellingPrice) => {
  const trimmed = raw.trim();
  if (trimmed === '') return {};
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Enter a valid amount, or leave it empty.' };
  }
  if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
    return { error: 'Set a valid selling price first.' };
  }
  if (amount <= sellingPrice) {
    return { error: `Must be higher than the selling price (₹${sellingPrice.toFixed(2)}).` };
  }
  return { value: Math.round(amount * 100) / 100 };
};

describe('Compare-at price parsing', () => {
  test('empty input clears the field', () => {
    assert.deepEqual(parseCompareAtPrice('', 48), {});
  });

  test('whitespace-only input clears the field', () => {
    assert.deepEqual(parseCompareAtPrice('   ', 48), {});
  });

  test('accepts an amount above the selling price', () => {
    assert.deepEqual(parseCompareAtPrice('58', 48), { value: 58 });
    assert.deepEqual(parseCompareAtPrice('58.50', 48), { value: 58.5 });
  });

  test('rejects an amount equal to the selling price', () => {
    assert.match(parseCompareAtPrice('48', 48).error, /higher than the selling price/);
  });

  test('rejects an amount below the selling price', () => {
    assert.match(parseCompareAtPrice('47.99', 48).error, /higher than the selling price/);
  });

  test('rejects zero, negative, and non-numeric input', () => {
    for (const raw of ['0', '-5', 'abc', 'Infinity']) {
      assert.equal(parseCompareAtPrice(raw, 48).error, 'Enter a valid amount, or leave it empty.');
    }
  });

  test('rejects a missing or invalid selling price', () => {
    assert.equal(parseCompareAtPrice('58', Number.NaN).error, 'Set a valid selling price first.');
    assert.equal(parseCompareAtPrice('58', -1).error, 'Set a valid selling price first.');
  });

  test('rounds valid amounts to paise precision', () => {
    assert.deepEqual(parseCompareAtPrice('58.999', 48), { value: 59 });
  });

  test('a zero selling price accepts any positive compare price', () => {
    assert.deepEqual(parseCompareAtPrice('1', 0), { value: 1 });
  });
});
