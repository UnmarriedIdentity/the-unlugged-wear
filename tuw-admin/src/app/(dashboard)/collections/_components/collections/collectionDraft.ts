// Pure create/edit draft helpers for the collections form drawer.
// No React, no storage — mirrored by tests/collections.test.mjs.

import type { CollectionItem, ProductItem } from '@/mocks/fixtures';
import { isValidSlug, isSlugTaken, slugify } from '@/lib/collections';
import type { SearchableSelectOption } from '@/components/ui';

export type CollectionVisibility = CollectionItem['visibility'];

export interface CollectionDraft {
  name: string;
  slug: string;
  /** True once the user edits the slug directly (or the draft was seeded
   * from an existing collection) — name edits stop rewriting it. */
  slugTouched: boolean;
  season: string;
  visibility: CollectionVisibility;
  description: string;
  productIds: string[];
}

export interface CollectionDraftErrors {
  name?: string;
  slug?: string;
  season?: string;
}

export function emptyDraft(): CollectionDraft {
  return {
    name: '',
    slug: '',
    slugTouched: false,
    season: 'AW26',
    visibility: 'published',
    description: '',
    productIds: [],
  };
}

/** Seeds an edit draft from a stored collection, dropping links to products
 * that no longer exist. Editing marks the slug as touched so the stored URL
 * never silently changes. */
export function draftFromCollection(
  collection: CollectionItem,
  products: ProductItem[],
): CollectionDraft {
  const validProductIds = new Set(products.map((product) => product.id));
  return {
    name: collection.name,
    slug: collection.slug,
    slugTouched: true,
    season: collection.season,
    visibility: collection.visibility,
    description: collection.description,
    productIds: collection.productIds.filter((id) => validProductIds.has(id)),
  };
}

/** Title change — auto-derives the slug until it has been touched. */
export function withName(draft: CollectionDraft, name: string): CollectionDraft {
  return { ...draft, name, slug: draft.slugTouched ? draft.slug : slugify(name) };
}

export function withSlug(draft: CollectionDraft, slug: string): CollectionDraft {
  return { ...draft, slug, slugTouched: true };
}

export function validateDraft(
  draft: CollectionDraft,
  collections: CollectionItem[],
  excludeId?: string,
): CollectionDraftErrors {
  const errors: CollectionDraftErrors = {};
  const slug = draft.slug.trim();
  if (!draft.name.trim()) errors.name = 'Collection title is required.';
  if (!slug) errors.slug = 'URL slug is required.';
  else if (!isValidSlug(slug)) errors.slug = 'Use lowercase letters, numbers, and single dashes only.';
  else if (isSlugTaken(slug, collections, excludeId)) {
    errors.slug = 'Another collection already uses this slug.';
  }
  if (!draft.season.trim()) errors.season = 'Season is required.';
  return errors;
}

export function draftToPayload(draft: CollectionDraft): Omit<CollectionItem, 'id' | 'updatedAt'> {
  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    season: draft.season.trim(),
    visibility: draft.visibility,
    description: draft.description.trim(),
    productIds: [...draft.productIds],
  };
}

/** Picker options for the product multi-select — selection order is the
 * stored `productIds` order. Prices use the catalog's rupee floats. */
export function toProductOptions(products: ProductItem[]): SearchableSelectOption[] {
  return products.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.category,
    meta: `₹${product.price.toFixed(2)}`,
    keywords: `${product.id} ${product.slug} ${product.category}`,
  }));
}
