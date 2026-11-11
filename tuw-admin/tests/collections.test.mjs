import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------
// Mirrors of collectionDraft.ts (self-contained per this project's test
// convention). The collection model itself is tested against the real code
// in packages/heart/src/modules/catalog/rules.test.mjs.
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

const uniqueSlug = (base, collections, excludeId) => {
  const root = slugify(base) || 'collection';
  if (!isSlugTaken(root, collections, excludeId)) return root;
  let suffix = 2;
  while (isSlugTaken(`${root}-${suffix}`, collections, excludeId)) suffix += 1;
  return `${root}-${suffix}`;
};

const emptyDraft = () => ({
  name: '',
  slug: '',
  slugTouched: false,
  season: 'AW26',
  visibility: 'published',
  description: '',
  productIds: [],
});

const draftFromCollection = (collection, products) => {
  const validProductIds = new Set(products.map((p) => p.id));
  return {
    name: collection.name,
    slug: collection.slug,
    slugTouched: true,
    season: collection.season,
    visibility: collection.visibility,
    description: collection.description,
    productIds: collection.productIds.filter((id) => validProductIds.has(id)),
  };
};

const withName = (draft, name) => ({
  ...draft,
  name,
  slug: draft.slugTouched ? draft.slug : slugify(name),
});

const withSlug = (draft, slug) => ({ ...draft, slug, slugTouched: true });

const validateDraft = (draft, collections, excludeId) => {
  const errors = {};
  const slug = draft.slug.trim();
  if (!draft.name.trim()) errors.name = 'Collection title is required.';
  if (!slug) errors.slug = 'URL slug is required.';
  else if (!isValidSlug(slug)) errors.slug = 'Use lowercase letters, numbers, and single dashes only.';
  else if (isSlugTaken(slug, collections, excludeId)) errors.slug = 'Another collection already uses this slug.';
  if (!draft.season.trim()) errors.season = 'Season is required.';
  return errors;
};

const draftToPayload = (draft) => ({
  name: draft.name.trim(),
  slug: draft.slug.trim(),
  season: draft.season.trim(),
  visibility: draft.visibility,
  description: draft.description.trim(),
  productIds: [...draft.productIds],
});

const toProductOptions = (products) =>
  products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.category,
    meta: `₹${product.price.toFixed(2)}`,
    keywords: `${product.id} ${product.slug} ${product.category}`,
  }));

describe('Collection Draft Helpers', () => {
  const existing = [
    {
      id: 'COL-01',
      name: 'Autumn/Winter Urban Minimal',
      slug: 'aw-urban-minimal',
      season: 'AW26',
      visibility: 'published',
      updatedAt: '16 Apr 2026',
      description: 'Structured silhouettes.',
      productIds: ['PRD-01'],
    },
  ];
  const productFixtures = [
    { id: 'PRD-01', name: 'Urbanist Heavyweight Tee', slug: 'urbanist-heavyweight-tee', category: 'T-Shirts', price: 48 },
    { id: 'PRD-02', name: 'Signature Boxy Hoodie', slug: 'signature-boxy-hoodie', category: 'Hoodies', price: 115 },
  ];

  describe('uniqueSlug', () => {
    test('returns the base slug when free', () => {
      assert.equal(uniqueSlug('Spring Capsule', existing), 'spring-capsule');
    });

    test('appends suffixes until free', () => {
      const all = [
        ...existing,
        { id: 'COL-02', slug: 'spring-capsule' },
        { id: 'COL-03', slug: 'spring-capsule-2' },
      ];
      assert.equal(uniqueSlug('Spring Capsule', all), 'spring-capsule-3');
    });

    test('falls back to "collection" for un-sluggable names', () => {
      assert.equal(uniqueSlug('***', existing), 'collection');
    });
  });

  describe('draft lifecycle', () => {
    test('empty draft carries sane defaults', () => {
      const draft = emptyDraft();
      assert.equal(draft.season, 'AW26');
      assert.equal(draft.visibility, 'published');
      assert.equal(draft.slugTouched, false);
      assert.deepEqual(draft.productIds, []);
    });

    test('name edits auto-derive the slug until it is touched', () => {
      let draft = emptyDraft();
      draft = withName(draft, 'Spring Capsule');
      assert.equal(draft.slug, 'spring-capsule');
      draft = withSlug(draft, 'custom-slug');
      draft = withName(draft, 'Spring Capsule Two');
      assert.equal(draft.slug, 'custom-slug');
    });

    test('edit seeds mark the slug as touched — stored URL never silently changes', () => {
      const draft = draftFromCollection(existing[0], productFixtures);
      assert.equal(draft.slugTouched, true);
      assert.equal(withName(draft, 'Renamed').slug, 'aw-urban-minimal');
    });

    test('edit seeds drop links to products that no longer exist', () => {
      const draft = draftFromCollection(
        { ...existing[0], productIds: ['PRD-02', 'PRD-99'] },
        productFixtures
      );
      assert.deepEqual(draft.productIds, ['PRD-02']);
    });
  });

  describe('validateDraft', () => {
    test('flags missing title and slug', () => {
      const errors = validateDraft(emptyDraft(), existing);
      assert.ok(errors.name);
      assert.ok(errors.slug);
    });

    test('requires a season', () => {
      const draft = { ...emptyDraft(), name: 'X', slug: 'x', season: '  ' };
      assert.ok(validateDraft(draft, existing).season);
    });

    test('rejects malformed slugs', () => {
      const draft = { ...emptyDraft(), name: 'X', slug: 'Bad Slug' };
      assert.ok(validateDraft(draft, existing).slug);
    });

    test('rejects duplicate slugs but ignores self when editing', () => {
      const draft = { ...emptyDraft(), name: 'X', slug: 'aw-urban-minimal' };
      assert.ok(validateDraft(draft, existing).slug);
      assert.equal(validateDraft(draft, existing, 'COL-01').slug, undefined);
    });

    test('a valid draft has no errors', () => {
      const draft = { ...emptyDraft(), name: 'Spring Capsule', slug: 'spring-capsule' };
      assert.deepEqual(validateDraft(draft, existing), {});
    });
  });

  describe('draftToPayload', () => {
    test('trims fields and copies the ordered productIds', () => {
      const draft = {
        ...emptyDraft(),
        name: '  Spring Capsule  ',
        slug: ' spring-capsule ',
        season: ' SS26 ',
        description: '  Copy  ',
        productIds: ['PRD-02', 'PRD-01'],
      };
      const payload = draftToPayload(draft);
      assert.equal(payload.name, 'Spring Capsule');
      assert.equal(payload.slug, 'spring-capsule');
      assert.equal(payload.season, 'SS26');
      assert.equal(payload.description, 'Copy');
      assert.deepEqual(payload.productIds, ['PRD-02', 'PRD-01']);
      assert.notEqual(payload.productIds, draft.productIds);
    });
  });

  describe('toProductOptions', () => {
    test('exposes category and rupee price meta with searchable keywords', () => {
      const options = toProductOptions(productFixtures);
      assert.equal(options[0].label, 'Urbanist Heavyweight Tee');
      assert.equal(options[0].description, 'T-Shirts');
      assert.equal(options[0].meta, '₹48.00');
      assert.ok(options[0].keywords.includes('PRD-01'));
      assert.ok(options[0].keywords.includes('T-Shirts'));
    });
  });
});
