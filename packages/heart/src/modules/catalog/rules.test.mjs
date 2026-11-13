// Tests for the shared catalog rules — real imports, no mirrored copies.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCompareAtPrice, normalizeAttributeDisplayType, attributeDisplayLabel, collectionCount, resolveCollectionProducts,
  slugify, isValidSlug, isSlugTaken, normalizeCollection, nextCollectionId, uniqueSlug,
} from './rules.ts';

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

describe('Collections Model', () => {
  describe('collectionCount', () => {
    test('counts the ordered product ids', () => {
      assert.equal(collectionCount({ productIds: ['PRD-02', 'PRD-03', 'PRD-04', 'PRD-05'] }), 4);
      assert.equal(collectionCount({ productIds: ['PRD-06'] }), 1);
    });

    test('is zero for empty or missing ids (legacy rows)', () => {
      assert.equal(collectionCount({ productIds: [] }), 0);
      assert.equal(collectionCount({}), 0);
    });
  });

  describe('resolveCollectionProducts', () => {
    const products = [
      { id: 'PRD-01', name: 'Urbanist Heavyweight Tee' },
      { id: 'PRD-02', name: 'Signature Boxy Hoodie' },
      { id: 'PRD-03', name: 'Minimalist Relaxed Cargo Pant' },
    ];

    test('preserves the author-chosen order', () => {
      const resolved = resolveCollectionProducts({ productIds: ['PRD-03', 'PRD-01', 'PRD-02'] }, products);
      assert.deepEqual(
        resolved.map((p) => p.id),
        ['PRD-03', 'PRD-01', 'PRD-02']
      );
    });

    test('drops unknown ids (deleted products)', () => {
      const resolved = resolveCollectionProducts({ productIds: ['PRD-02', 'PRD-99'] }, products);
      assert.deepEqual(
        resolved.map((p) => p.id),
        ['PRD-02']
      );
    });

    test('returns an empty list for empty or missing ids', () => {
      assert.deepEqual(resolveCollectionProducts({ productIds: [] }, products), []);
      assert.deepEqual(resolveCollectionProducts({}, products), []);
    });
  });

  describe('slugify', () => {
    test('turns display names into url slugs', () => {
      assert.equal(slugify('Autumn/Winter Urban Minimal'), 'autumn-winter-urban-minimal');
      assert.equal(slugify('Core Heavyweight Basics'), 'core-heavyweight-basics');
    });

    test('collapses whitespace and strips punctuation', () => {
      assert.equal(slugify('  Summer   Archival  '), 'summer-archival');
      assert.equal(slugify('Unplugged — 127'), 'unplugged-127');
    });

    test('strips diacritics', () => {
      assert.equal(slugify('Été Édition'), 'ete-edition');
    });

    test('returns an empty string when nothing is slug-worthy', () => {
      assert.equal(slugify('***'), '');
      assert.equal(slugify(''), '');
    });
  });

  describe('isValidSlug', () => {
    test('accepts lowercase kebab case', () => {
      assert.equal(isValidSlug('aw-urban-minimal'), true);
      assert.equal(isValidSlug('summer-archival-2'), true);
      assert.equal(isValidSlug('monochrome'), true);
    });

    test('rejects malformed slugs', () => {
      for (const bad of ['', 'A B', '-x', 'x-', 'a--b', 'Under_score', 'UPPER']) {
        assert.equal(isValidSlug(bad), false, `expected "${bad}" to be invalid`);
      }
    });
  });

  describe('isSlugTaken', () => {
    const collections = [
      { id: 'COL-01', slug: 'aw-urban-minimal' },
      { id: 'COL-02', slug: 'core-heavyweight-basics' },
    ];

    test('flags existing slugs (case/space-insensitive)', () => {
      assert.equal(isSlugTaken('aw-urban-minimal', collections), true);
      assert.equal(isSlugTaken('  AW-Urban-Minimal ', collections), true);
    });

    test('ignores the excluded collection when editing', () => {
      assert.equal(isSlugTaken('aw-urban-minimal', collections, 'COL-01'), false);
      assert.equal(isSlugTaken('aw-urban-minimal', collections, 'COL-02'), true);
    });

    test('returns false for a fresh slug', () => {
      assert.equal(isSlugTaken('summer-archival', collections), false);
    });
  });

  describe('normalizeCollection (hydration migration)', () => {
    const legacyRow = {
      id: 'COL-09',
      name: 'Legacy Drop',
      slug: 'legacy-drop',
      season: 'AW26',
      visibility: 'draft',
      updatedAt: '01 Apr 2026',
      description: 'Persisted before productIds existed.',
      productCount: 24,
    };

    test('legacy rows: drops productCount and never fabricates links', () => {
      const normalized = normalizeCollection(legacyRow);
      assert.deepEqual(normalized.productIds, []);
      assert.equal('productCount' in normalized, false);
      assert.equal(normalized.name, 'Legacy Drop');
    });

    test('dedupes ids and keeps the first-seen order', () => {
      const normalized = normalizeCollection({
        ...legacyRow,
        productIds: ['PRD-02', 'PRD-02', 'PRD-01', 'PRD-02'],
      });
      assert.deepEqual(normalized.productIds, ['PRD-02', 'PRD-01']);
    });

    test('prunes ids that no longer exist when a valid set is provided', () => {
      const normalized = normalizeCollection(
        { ...legacyRow, productIds: ['PRD-01', 'PRD-99', 'PRD-03'] },
        new Set(['PRD-01', 'PRD-03'])
      );
      assert.deepEqual(normalized.productIds, ['PRD-01', 'PRD-03']);
    });

    test('keeps modern rows untouched', () => {
      const normalized = normalizeCollection({
        ...legacyRow,
        productIds: ['PRD-06', 'PRD-07'],
        productCount: undefined,
      });
      assert.deepEqual(normalized.productIds, ['PRD-06', 'PRD-07']);
      assert.equal('productCount' in normalized, false);
    });
  });

  describe('nextCollectionId', () => {
    test('starts at COL-01 when no collections exist', () => {
      assert.equal(nextCollectionId([]), 'COL-01');
    });

    test('increments past the highest numeric id', () => {
      assert.equal(nextCollectionId([{ id: 'COL-01' }, { id: 'COL-03' }, { id: 'COL-02' }]), 'COL-04');
    });

    test('ignores non-numeric ids', () => {
      assert.equal(nextCollectionId([{ id: 'LEGACY' }, { id: 'COL-07' }, { id: 'DRAFT-X' }]), 'COL-08');
    });
  });
});

