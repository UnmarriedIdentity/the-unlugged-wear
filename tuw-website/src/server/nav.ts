import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getStorefrontNavigation, PRODUCTS_TAG, type StorefrontCategory } from '@tuw/heart/modules/catalog';

export const NAV_TAG = 'nav';

export interface Navigation {
  categories: StorefrontCategory[];
  /** Category slugs staff hid from the storefront menu. */
  hiddenCategories: string[];
  /** Category slugs allowed in the top-level navigation. */
  navbarCategories: string[];
}

// Menu visibility is its own cached read: the header needs category flags only,
// not the catalogue. Tagged 'nav' (POST /api/revalidate) and 'products', because
// saving a category in the admin already refreshes the catalogue tag. The menu
// structure itself lives in navigation.ts until the CMS editor (TL-BE-13.06).
export async function getNavigation(): Promise<Navigation> {
  'use cache';
  cacheTag(NAV_TAG, PRODUCTS_TAG);
  cacheLife('hours');
  const categories = await getStorefrontNavigation();
  return {
    categories,
    hiddenCategories: categories.filter((c) => !c.showInMegamenu).map((c) => c.slug),
    navbarCategories: categories.filter((c) => c.showInNavbar && c.showInMegamenu).map((c) => c.slug),
  };
}
