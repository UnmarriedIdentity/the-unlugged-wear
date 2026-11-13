import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { PRODUCTS_TAG } from '@tuw/heart/modules/catalog';
import type { Collection, Product } from '@storefront/lib/types';
import { getCatalog } from './catalog';

/**
 * Handle for one collection's cache entry. Not yet referenced by an admin
 * action — it is the hook a future "refresh this collection" button will use;
 * today every catalogue change already revalidates `products`, which every
 * collection read is also tagged with.
 */
export const collectionTag = (slug: string) => `collection:${slug}`;

export interface CollectionPage {
  collection: Collection;
  /** Member products in the merchandising order from `collection_products`. */
  products: Product[];
}

/** Published collections, in the order the catalogue reads them. */
export async function getCollections(): Promise<Collection[]> {
  'use cache';
  cacheTag(PRODUCTS_TAG);
  cacheLife('hours');
  const { collections } = await getCatalog();
  return collections;
}

/**
 * One collection with its products already ordered. Membership lives in the
 * database, so this is the single source for both the page and its metadata.
 * Returns null for an unknown slug; the route's layout turns that into a 404.
 */
export async function getCollectionPage(slug: string): Promise<CollectionPage | null> {
  'use cache';
  cacheTag(PRODUCTS_TAG, collectionTag(slug));
  cacheLife('hours');
  const { collections, products } = await getCatalog();
  const collection = collections.find((c) => c.slug === slug);
  if (!collection) return null;
  const byId = new Map(products.map((p) => [p.id, p]));
  return {
    collection,
    // A member can vanish between reads (unpublished between the two queries);
    // dropping it keeps the grid honest rather than rendering a placeholder.
    products: collection.productIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
  };
}
