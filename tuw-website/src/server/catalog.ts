import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { approvedReviews, getStorefrontCatalog, searchProducts, PRODUCTS_TAG, REVIEWS_TAG, type ReviewSummary, type SearchResult } from '@tuw/heart/modules/catalog';
import type { Collection, Product, SizeChartData } from '@storefront/lib/types';

export interface Catalog {
  products: Product[];
  collections: Collection[];
  /** Category slugs staff hid from the storefront menu. */
  hiddenCategories: string[];
  sizeCharts: SizeChartData[];
}

// The published catalog (cache-components skill): same for everyone, part
// of the static shell, expired by the admin through POST /api/revalidate
// ('products') or hourly. Unlike settings there is no silent fallback — an
// empty shop would be a lie; the error page tells the truth instead.
export async function getCatalog(): Promise<Catalog> {
  'use cache';
  cacheTag(PRODUCTS_TAG);
  cacheLife('hours');
  const catalog = await getStorefrontCatalog();
  return {
    // The module returns the storefront's Product shape; only the string
    // unions (category, product type) are narrowed here.
    products: catalog.products as unknown as Product[],
    collections: catalog.collections,
    hiddenCategories: catalog.categories.filter((c) => !c.showInMegamenu).map((c) => c.slug),
    sizeCharts: catalog.sizeCharts,
  };
}

/** Product by slug or old slug (renamed products keep resolving). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? products.find((p) => p.aliases?.includes(slug)) ?? null;
}

/** Ranked search, cached per term for a few minutes and expired with the catalog. */
export async function cachedSearch(term: string): Promise<SearchResult> {
  'use cache';
  cacheTag(PRODUCTS_TAG);
  cacheLife('minutes');
  return searchProducts(term);
}

/** Approved reviews for one product (same for everyone). */
export async function cachedReviews(productId: string): Promise<ReviewSummary> {
  'use cache';
  cacheTag(REVIEWS_TAG);
  cacheLife('hours');
  return approvedReviews(productId);
}
