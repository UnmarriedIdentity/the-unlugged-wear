import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors of lib/collections.ts (self-contained per this project's
// test convention): ordered `productIds` are the single source of
// truth for counts + resolved product lists; counts are never stored.
// ---------------------------------------------------------------
const collectionCount = (c) => (Array.isArray(c.productIds) ? c.productIds.length : 0);

const resolveCollectionProducts = (c, products) => {
  if (!Array.isArray(c.productIds) || c.productIds.length === 0) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved = [];
  for (const id of c.productIds) {
    const product = byId.get(id);
    if (product) resolved.push(product);
  }
  return resolved;
};

const slugify = (input) =>
  input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isValidSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

const isSlugTaken = (slug, collections, excludeId) => {
  const normalized = slug.trim().toLowerCase();
  return collections.some((c) => c.id !== excludeId && c.slug.toLowerCase() === normalized);
};

const normalizeCollection = (raw, validProductIds) => {
  const { productCount: _legacyCount, ...rest } = raw;
  const ids = Array.isArray(raw.productIds) ? raw.productIds : [];
  const seen = new Set();
  const productIds = [];
  for (const id of ids) {
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue;
    if (validProductIds && !validProductIds.has(id)) continue;
    seen.add(id);
    productIds.push(id);
  }
  return { ...rest, productIds };
};

const nextCollectionId = (collections) => {
  const max = collections.reduce((current, c) => {
    const n = Number.parseInt(c.id.replace(/\D+/g, ''), 10);
    return Number.isFinite(n) ? Math.max(current, n) : current;
  }, 0);
  return `COL-${String(max + 1).padStart(2, '0')}`;
};

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
