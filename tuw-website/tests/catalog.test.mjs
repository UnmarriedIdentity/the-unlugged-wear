import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The generated catalogue is a JSON array behind a TypeScript export.
const source = readFileSync(new URL('../src/storefront/mocks/catalog.generated.ts', import.meta.url), 'utf8');
const products = JSON.parse(source.slice(source.indexOf('= [') + 2, source.lastIndexOf(';')));
const curated = readFileSync(new URL('../src/storefront/mocks/fixtures.ts', import.meta.url), 'utf8');
const curatedSlugs = [...curated.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);

test('generated catalogue: every Qikink style becomes one product with a unique slug and id', () => {
  assert.ok(products.length > 100, `expected the full sheet, got ${products.length}`);
  const slugs = [...products.map((p) => p.slug), ...curatedSlugs];
  assert.equal(new Set(slugs).size, slugs.length, 'slugs must be unique across curated + generated');
  assert.equal(new Set(products.map((p) => p.id)).size, products.length, 'ids must be unique');
});

test('generated catalogue: prices are integer paise and marked as drafts', () => {
  for (const p of products) {
    assert.ok(Number.isInteger(p.priceINR) && p.priceINR >= 299, `${p.slug} price`);
    assert.equal(p.priceMinorINR, p.priceINR * 100, `${p.slug} minor units`);
    assert.equal(p.priceIsDraft, true, `${p.slug} draft flag`);
  }
});

test('generated catalogue: supplier costs never reach the storefront bundle', () => {
  assert.ok(!/basePrice|costINR|basePriceINR/.test(source));
});

test('generated catalogue: every product has variants, colours and a product type', () => {
  for (const p of products) {
    assert.ok(p.sizes.length > 0, `${p.slug} sizes`);
    assert.ok(p.colors.length > 0, `${p.slug} colours`);
    assert.ok(p.productType, `${p.slug} productType`);
    assert.ok(p.variantLabel, `${p.slug} variantLabel`);
  }
});
