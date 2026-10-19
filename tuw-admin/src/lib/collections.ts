// Pure collection model helpers — no React, no UI, no storage.
//
// Collections persist an ordered `productIds` array; counts and product
// lists are always derived from it. These helpers are shared by the demo
// state manager (hydration migration) and the collections page.

import type { CollectionItem, ProductItem } from '@/mocks/fixtures';

/** Legacy persisted rows stored a fabricated `productCount` instead of ids. */
export type LegacyCollection = CollectionItem & { productCount?: number };

/** Derived item count — the only count source; nothing stores it twice. */
export function collectionCount(collection: Pick<CollectionItem, 'productIds'>): number {
  return Array.isArray(collection.productIds) ? collection.productIds.length : 0;
}

/**
 * Resolve stored ids to products, preserving the author-chosen order.
 * Unknown ids (deleted products, stale demo state) are dropped silently.
 */
export function resolveCollectionProducts(
  collection: Pick<CollectionItem, 'productIds'>,
  products: ProductItem[],
): ProductItem[] {
  if (!Array.isArray(collection.productIds) || collection.productIds.length === 0) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved: ProductItem[] = [];
  for (const id of collection.productIds) {
    const product = byId.get(id);
    if (product) resolved.push(product);
  }
  return resolved;
}

/** URL slug from a display name: lowercase, diacritics stripped, dashes. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function isSlugTaken(
  slug: string,
  collections: CollectionItem[],
  excludeId?: string,
): boolean {
  const normalized = slug.trim().toLowerCase();
  return collections.some((c) => c.id !== excludeId && c.slug.toLowerCase() === normalized);
}

/**
 * Hydration migration for persisted collections.
 * - keeps `productIds` only when it is an array (deduped, order kept)
 * - optional `validProductIds` prunes links to products that no longer exist
 * - always drops the legacy `productCount` key; never fabricates links
 */
export function normalizeCollection(
  raw: LegacyCollection,
  validProductIds?: ReadonlySet<string>,
): CollectionItem {
  const { productCount: _legacyCount, ...rest } = raw;
  const ids = Array.isArray(raw.productIds) ? raw.productIds : [];
  const seen = new Set<string>();
  const productIds: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue;
    if (validProductIds && !validProductIds.has(id)) continue;
    seen.add(id);
    productIds.push(id);
  }
  return { ...rest, productIds };
}

/** Next free `COL-xx` id — replaces the old random id (collision-safe). */
export function nextCollectionId(collections: Pick<CollectionItem, 'id'>[]): string {
  const max = collections.reduce((current, c) => {
    const n = Number.parseInt(c.id.replace(/\D+/g, ''), 10);
    return Number.isFinite(n) ? Math.max(current, n) : current;
  }, 0);
  return `COL-${String(max + 1).padStart(2, '0')}`;
}

/** First free slug from a display name — appends -2, -3, … when taken. */
export function uniqueSlug(
  base: string,
  collections: CollectionItem[],
  excludeId?: string,
): string {
  const root = slugify(base) || 'collection';
  if (!isSlugTaken(root, collections, excludeId)) return root;
  let suffix = 2;
  while (isSlugTaken(`${root}-${suffix}`, collections, excludeId)) suffix += 1;
  return `${root}-${suffix}`;
}
