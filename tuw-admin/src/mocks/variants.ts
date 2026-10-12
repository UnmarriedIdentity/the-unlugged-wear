import type { ProductItem, ProductVariant } from './fixtures';

/** Deterministic SKU: product id + color index + size (e.g. PRD-01-0-M).
 * Stable for a given product shape — the matrix and tests rely on it. */
export function buildVariantSku(productId: string, colorIdx: number, size: string): string {
  return `${productId}-${colorIdx}-${size}`;
}

/** Even stock distribution (floor + remainder to the first rows).
 * Conserves the total exactly: sum == stock always. */
export function distributeStock(stock: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(stock / count);
  const remainder = stock % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Synthesize the full color×size matrix from flat product fields.
 * Used when a product carries no explicit variants[] (all current
 * fixtures) — deterministic, so renders and tests are stable. */
export function synthesizeVariants(p: {
  id: string;
  price: number;
  stock: number;
  colors: string[];
  sizes: string[];
}): ProductVariant[] {
  const combos: Array<{ color: string; colorIdx: number; size: string }> = [];
  p.colors.forEach((color, colorIdx) => {
    p.sizes.forEach((size) => {
      combos.push({ color, colorIdx, size });
    });
  });
  const stocks = distributeStock(p.stock, combos.length);
  return combos.map((c, i) => ({
    id: `${p.id}-V${i + 1}`,
    color: c.color,
    size: c.size,
    sku: buildVariantSku(p.id, c.colorIdx, c.size),
    price: p.price,
    stock: stocks[i],
  }));
}

/** Source of truth accessor: explicit variants win, otherwise synthesize.
 * Callers never branch on variants? themselves. */
export function resolveVariants(p: ProductItem): ProductVariant[] {
  return p.variants ?? synthesizeVariants(p);
}

/** Display lists stay derived from the same matrix — no dual source. */
export function deriveColors(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.color))];
}

export function deriveSizes(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.size))];
}

/** Inventory invariant probe: matrix stock must equal product stock. */
export function variantStockTotal(variants: ProductVariant[]): number {
  return variants.reduce((n, v) => n + v.stock, 0);
}
