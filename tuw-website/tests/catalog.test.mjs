import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Products now come from the database (TL-BE-05). The import, pricing and
// read-model rules are tested in packages/heart (catalog.int.test.ts,
// planner.test.ts); this file guards what the storefront still owns.

const root = new URL('..', import.meta.url).pathname;
const curated = JSON.parse(readFileSync(join(root, '../db/seed/catalog/curated-products.json'), 'utf8'));
const listing = JSON.parse(readFileSync(join(root, 'data/qikink-listing.json'), 'utf8'));

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(ts|tsx)$/.test(name)) yield path;
  }
}
const source = [...files(join(root, 'src'))].map((f) => [f, readFileSync(f, 'utf8')]);

test('the generated catalogue is gone and nothing imports it', () => {
  assert.equal(existsSync(join(root, 'src/storefront/mocks/catalog.generated.ts')), false);
  for (const [file, text] of source) assert.ok(!/catalog\.generated|STORE_PRODUCTS\b.*from|STORE_COLLECTIONS/.test(text), `${file} still reads the static catalogue`);
});

test('supplier costs never reach storefront source', () => {
  for (const [file, text] of source) assert.ok(!/basePriceINR|base_price|costPaise/.test(text), `${file} mentions partner cost`);
});

test('curated seed: unique slugs and aliases, positive whole-rupee prices, sellable variants', () => {
  const urls = curated.flatMap((p) => [p.slug, ...(p.aliases ?? [])]);
  assert.equal(new Set(urls).size, urls.length, 'slugs and aliases must never collide');
  assert.equal(new Set(curated.map((p) => p.id)).size, curated.length);
  for (const p of curated) {
    assert.ok(Number.isInteger(p.priceINR) && p.priceINR > 0, `${p.slug} price`);
    assert.ok(p.colors.length > 0 && p.sizes.length > 0, `${p.slug} variants`);
    assert.ok(p.images.length > 0 && p.images.every((i) => i.url.startsWith('/') && i.alt), `${p.slug} images need a local url + alt`);
  }
});

test('listing input keeps the import contract (style, gender, price, sizes)', () => {
  assert.ok(listing.length > 300);
  for (const r of listing) assert.ok(r.style && r.basePriceINR > 0 && r.sizes, `row ${r.qikinkId}`);
});
