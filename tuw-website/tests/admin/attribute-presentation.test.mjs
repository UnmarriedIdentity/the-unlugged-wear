import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors src/admin/lib/attributePresentation.ts (self-contained per this
// suite's convention). Persisted library rows are normalized at
// hydration; unknown/missing values must fall back to the safe default.
// ---------------------------------------------------------------
const normalizeAttributeDisplayType = (value) =>
  value === 'swatch' || value === 'radio' ? value : 'pill';

const attributeDisplayLabel = (value) => {
  if (value === 'swatch') return 'Color swatch';
  if (value === 'radio') return 'Radio select';
  return 'Pill';
};

describe('Attribute presentation — global showcase type', () => {
  test('keeps the three supported showcase types', () => {
    assert.equal(normalizeAttributeDisplayType('pill'), 'pill');
    assert.equal(normalizeAttributeDisplayType('swatch'), 'swatch');
    assert.equal(normalizeAttributeDisplayType('radio'), 'radio');
  });

  test('normalizes missing, legacy, and unknown values to pill', () => {
    for (const value of [undefined, null, '', 'grid', 0, {}]) {
      assert.equal(normalizeAttributeDisplayType(value), 'pill');
    }
  });

  test('labels every supported showcase type', () => {
    assert.equal(attributeDisplayLabel('pill'), 'Pill');
    assert.equal(attributeDisplayLabel('swatch'), 'Color swatch');
    assert.equal(attributeDisplayLabel('radio'), 'Radio select');
  });
});
