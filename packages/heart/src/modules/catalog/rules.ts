// Pure catalog rules shared by the admin UI and the backend — no React, no
// database, no 'server-only', so Client Components may import them
// (@tuw/heart/modules/catalog/rules). Moved from tuw-admin/src/lib (TL-BE-05.12).

export const UNCATEGORIZED_CATEGORY = 'Uncategorized';

// ---- compare-at price ----------------------------------------------------
/**
 * Product pricing helpers shared by the admin editor.
 *
 * The admin catalog model stores rupee floats (the storefront owns the
 * integer minor-unit / paise representation). Amounts are rounded to paise
 * precision here so repeated edits never accumulate float dust.
 */

export interface ParsedComparePrice {
  /** Rounded amount when the input is valid and present; omitted to clear. */
  value?: number;
  /** Validation message shown inline when the input is unusable. */
  error?: string;
}

/**
 * Parse the optional compare-at (was) price.
 *
 * Empty input clears the field. A provided amount must be a positive number
 * strictly above the selling price — a compare price at or below the selling
 * price would render a strikethrough that is not a real saving.
 */
export function parseCompareAtPrice(raw: string, sellingPrice: number): ParsedComparePrice {
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
}

// ---- attribute presentation -----------------------------------------------
export type AttributeDisplayType = 'pill' | 'swatch' | 'radio';

/** Canonical showcase options for the attribute library. The library owns
 * this choice globally; products inherit it through their linked definition. */
export const ATTRIBUTE_DISPLAY_OPTIONS: ReadonlyArray<{
  value: AttributeDisplayType;
  label: string;
}> = [
  { value: 'pill', label: 'Pill' },
  { value: 'swatch', label: 'Color swatch' },
  { value: 'radio', label: 'Radio select' },
];

/** Persisted records may predate the global showcase setting or carry a
 * stale value; anything unrecognized falls back to the safe default. */
export function normalizeAttributeDisplayType(value: unknown): AttributeDisplayType {
  return value === 'swatch' || value === 'radio' ? value : 'pill';
}

export function attributeDisplayLabel(value: AttributeDisplayType): string {
  if (value === 'swatch') return 'Color swatch';
  if (value === 'radio') return 'Radio select';
  return 'Pill';
}

// ---- collections -----------------------------------------------------------
// Collections hold an ordered productIds array; counts and product lists are
// always derived from it.


/** Legacy persisted rows stored a fabricated `productCount` instead of ids. */
export type LegacyCollection<C> = C & { productIds: string[]; productCount?: number };

/** Derived item count — the only count source; nothing stores it twice. */
export function collectionCount(collection: { productIds: string[] }): number {
  return Array.isArray(collection.productIds) ? collection.productIds.length : 0;
}

/**
 * Resolve stored ids to products, preserving the author-chosen order.
 * Unknown ids (deleted products, stale demo state) are dropped silently.
 */
export function resolveCollectionProducts<P extends { id: string }>(
  collection: { productIds: string[] },
  products: P[],
): P[] {
  if (!Array.isArray(collection.productIds) || collection.productIds.length === 0) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const resolved: P[] = [];
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
  collections: { id: string; slug: string }[],
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
export function normalizeCollection<C extends { productIds: string[] }>(
  raw: LegacyCollection<C>,
  validProductIds?: ReadonlySet<string>,
): C {
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
  return { ...rest, productIds } as unknown as C;
}

/** Next free `COL-xx` id — replaces the old random id (collision-safe). */
export function nextCollectionId(collections: { id: string }[]): string {
  const max = collections.reduce((current, c) => {
    const n = Number.parseInt(c.id.replace(/\D+/g, ''), 10);
    return Number.isFinite(n) ? Math.max(current, n) : current;
  }, 0);
  return `COL-${String(max + 1).padStart(2, '0')}`;
}

/** First free slug from a display name — appends -2, -3, … when taken. */
export function uniqueSlug(
  base: string,
  collections: { id: string; slug: string }[],
  excludeId?: string,
): string {
  const root = slugify(base) || 'collection';
  if (!isSlugTaken(root, collections, excludeId)) return root;
  let suffix = 2;
  while (isSlugTaken(`${root}-${suffix}`, collections, excludeId)) suffix += 1;
  return `${root}-${suffix}`;
}
