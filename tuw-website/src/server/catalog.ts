import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getStorefrontCatalog, PRODUCTS_TAG } from '@tuw/heart/modules/catalog';
import type { Collection, Product } from '@storefront/lib/types';

export interface Catalog {
  products: Product[];
  collections: Collection[];
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
  };
}

/** Product by slug or old slug (renamed products keep resolving). */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? products.find((p) => p.aliases?.includes(slug)) ?? null;
}
