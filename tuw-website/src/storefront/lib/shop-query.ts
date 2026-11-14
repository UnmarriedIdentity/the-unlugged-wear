// Shop URL contract and filtering rules. Pure functions only, so the server
// renders the grid and the client toolbar builds the same URLs from the same
// source. Everything a shopper can filter by lives in the query string.

import type { Product, ProductType } from './types';
import { CATEGORY_LABELS, matchesShopFilter } from './product';

export const SHOP_PAGE_SIZE = 24;

export type ShopSort = 'featured' | 'price-high' | 'price-low' | 'newest';
export type ShopAudience = 'men' | 'women' | 'kids';

const SORTS: ShopSort[] = ['featured', 'price-high', 'price-low', 'newest'];
const AUDIENCES: ShopAudience[] = ['men', 'women', 'kids'];
const TYPES: ProductType[] = ['apparel', 'kids-apparel', 'pet', 'drinkware', 'wall-art', 'phone-case', 'bag', 'stationery', 'home'];

/** Category pills above the grid. `value` is the `category` query value. */
export const SHOP_CATEGORY_PILLS = [
  { value: '', label: 'View all' },
  { value: 'tees', label: 'T-shirts' },
  { value: 'hoodies', label: 'Hoodies & sweats' },
  { value: 'pants', label: 'Joggers' },
  { value: 'kids', label: 'Kids' },
  { value: 'accessories', label: 'Accessories' },
];

// Filter drawer options. Counts are not baked in: the grid computes the real
// number of matches from the catalogue (see shopFacetCounts).
export const FIGMA_FILTER_COLORS = [
  { value: 'black', name: 'Black', hex: '#1A1A1A' },
  { value: 'white', name: 'White', hex: '#FFFFFF' },
  { value: 'navy-blue', name: 'Navy Blue', hex: '#1D2A44' },
  { value: 'grey-melange', name: 'Grey Melange', hex: '#8A8A8E' },
  { value: 'bottle-green', name: 'Bottle Green', hex: '#1A4329' },
  { value: 'maroon', name: 'Maroon', hex: '#6A1A26' },
  { value: 'red', name: 'Red', hex: '#C82333' },
  { value: 'lavender', name: 'Lavender', hex: '#B8A9D9' },
  { value: 'light-baby-pink', name: 'Light Baby Pink', hex: '#F3C5CD' },
  { value: 'off-white', name: 'Off White', hex: '#EAE6DF' },
];

export const FIGMA_SORT_OPTIONS = [
  { value: 'featured', label: 'Novelty' },
  { value: 'price-high', label: 'Highest to Lowest Price' },
  { value: 'price-low', label: 'Lowest to Highest Price' },
];

export const FIGMA_CATEGORIES = [
  { value: 'tees', label: 'T-shirts' },
  { value: 'hoodies', label: 'Hoodies & sweats' },
  { value: 'pants', label: 'Joggers' },
  { value: 'kids', label: 'Kids' },
  { value: 'accessories', label: 'Accessories' },
];

export const FIGMA_PRICE_RANGES = [
  { value: 'under-1500', label: 'Under ₹1,500' },
  { value: '1500-3000', label: '₹1,500 – ₹3,000' },
  { value: '3000-5000', label: '₹3,000 – ₹5,000' },
  { value: 'above-5000', label: 'Above ₹5,000' },
];

export const SHOP_TYPE_LABELS: Record<ProductType, string> = {
  apparel: 'Clothing',
  'kids-apparel': 'Kids clothing',
  pet: 'For pets',
  drinkware: 'Mugs & Bottles',
  'wall-art': 'Wall art',
  'phone-case': 'Phone cases',
  bag: 'Bags & Totes',
  stationery: 'Stationery',
  home: 'Home & table',
};

const AUDIENCE_LABELS: Record<string, string> = { men: 'Men', women: 'Women', kids: 'Kids' };

/** Everything the shop page needs, parsed once on the server. */
export interface ShopQuery {
  category: string;
  size: string;
  color: string;
  price: string;
  sort: ShopSort;
  audience?: ShopAudience;
  type?: ProductType;
  q: string[];
  isNew: boolean;
  /** How many matching pieces to show (the "Load more" cursor). */
  show: number;
}

export type ShopSearchParams = Record<string, string | string[] | undefined>;

const asString = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

export const toShopSort = (value: string): ShopSort =>
  (SORTS as string[]).includes(value) ? (value as ShopSort) : 'featured';

/** Read filters from the URL, ignoring anything unrecognised. */
export function parseShopQuery(params: ShopSearchParams = {}): ShopQuery {
  const audience = asString(params.audience);
  const type = asString(params.type);
  const requestedShow = Number.parseInt(asString(params.show), 10);
  return {
    category: asString(params.category),
    size: asString(params.size),
    color: asString(params.color),
    price: asString(params.price),
    sort: toShopSort(asString(params.sort)),
    ...((AUDIENCES as string[]).includes(audience) ? { audience: audience as ShopAudience } : {}),
    ...((TYPES as string[]).includes(type) ? { type: type as ProductType } : {}),
    q: asString(params.q).split(',').map((w) => w.trim()).filter(Boolean),
    isNew: asString(params.new) === '1',
    show: Number.isFinite(requestedShow) && requestedShow > 0 ? requestedShow : SHOP_PAGE_SIZE,
  };
}

/**
 * Canonical shop URL for a query. Defaults are omitted so the same results
 * always share one address. Patching a filter returns to the first page,
 * because "Load more" only makes sense for the filters it was clicked under.
 */
export function shopQueryHref(query: ShopQuery, patch?: Partial<ShopQuery>): string {
  const next: ShopQuery = { ...query, ...patch };
  const resetPage = patch
    ? Object.keys(patch).some((key) => key !== 'show')
    : false;
  const show = resetPage ? SHOP_PAGE_SIZE : next.show;

  const params = new URLSearchParams();
  if (next.category) params.set('category', next.category);
  if (next.audience) params.set('audience', next.audience);
  if (next.type) params.set('type', next.type);
  if (next.q.length) params.set('q', next.q.join(','));
  if (next.isNew) params.set('new', '1');
  if (next.size) params.set('size', next.size);
  if (next.color) params.set('color', next.color);
  if (next.price) params.set('price', next.price);
  if (next.sort !== 'featured') params.set('sort', next.sort);
  if (show > SHOP_PAGE_SIZE) params.set('show', String(show));

  const search = params.toString();
  return search ? `/shop?${search}` : '/shop';
}

// Colour values in the URL are broad families ("navy-blue") while a product
// carries a specific name ("Slate Navy"), so match on shared words as well.
const COLOR_SYNONYMS: Record<string, string[]> = {
  black: ['black', 'carbon'],
  white: ['white', 'bone', 'ecru'],
  'navy-blue': ['navy', 'blue', 'slate'],
  'grey-melange': ['grey', 'melange', 'slate'],
  'bottle-green': ['green', 'olive'],
  maroon: ['maroon', 'burgundy'],
  red: ['red', 'maroon'],
};

function matchesColor(product: Product, selected: string[]): boolean {
  return product.colors.some((color) => {
    const value = color.value.toLowerCase();
    const name = color.name.toLowerCase();
    return selected.some((choice) => {
      const synonyms = COLOR_SYNONYMS[choice];
      if (synonyms) return synonyms.some((word) => value.includes(word) || name.includes(word));
      return value.includes(choice) || name.includes(choice) || choice.includes(value) || choice.includes(name);
    });
  });
}

function matchesPrice(product: Product, band: string): boolean {
  if (band === 'under-1500') return product.priceINR < 1500;
  if (band === '1500-3000') return product.priceINR >= 1500 && product.priceINR <= 3000;
  if (band === '3000-5000') return product.priceINR > 3000 && product.priceINR <= 5000;
  if (band === 'above-5000') return product.priceINR > 5000;
  return true;
}

/** Apply every filter in the query, then sort. Returns a new array. */
export function filterShopProducts(products: Product[], query: ShopQuery): Product[] {
  let result = [...products];

  if (query.audience || query.type || query.q.length || query.isNew) {
    result = result.filter((product) =>
      matchesShopFilter(product, {
        audience: query.audience,
        type: query.type,
        q: query.q,
        isNew: query.isNew,
      })
    );
  }

  if (query.category) {
    if (query.category === 'men' || query.category === 'women') {
      const audience = query.category;
      result = result.filter((product) => product.audience?.includes(audience));
    } else if (query.category === 'kids') {
      result = result.filter((product) => product.category === 'kids' || Boolean(product.audience?.includes('kids')));
    } else {
      result = result.filter((product) => product.category === query.category);
    }
  }

  if (query.size) {
    result = result.filter((product) => product.sizes.some((size) => size.size === query.size && size.inStock));
  }

  if (query.color) {
    const selected = query.color.toLowerCase().split(',').filter(Boolean);
    result = result.filter((product) => matchesColor(product, selected));
  }

  if (query.price) {
    result = result.filter((product) => matchesPrice(product, query.price));
  }

  if (query.sort === 'price-low') result.sort((a, b) => a.priceINR - b.priceINR);
  else if (query.sort === 'price-high') result.sort((a, b) => b.priceINR - a.priceINR);
  else if (query.sort === 'newest') result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

  return result;
}

/** Heading reads like the menu path, e.g. "Men · Hoodies & Sweats". */
export function shopHeading(query: ShopQuery): string {
  const categoryLabel =
    AUDIENCE_LABELS[query.category] ??
    CATEGORY_LABELS[query.category as Product['category']] ??
    '';
  return (
    [
      query.audience ? AUDIENCE_LABELS[query.audience] : '',
      query.isNew ? 'New in' : '',
      query.type ? SHOP_TYPE_LABELS[query.type] : '',
      query.category ? categoryLabel || 'Catalog' : '',
      query.q.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' / '),
    ]
      .filter(Boolean)
      .join(' · ') || 'All products'
  );
}

/** Match counts beside each filter option, computed once from the catalogue. */
export interface ShopFacetCounts {
  categories: Record<string, number>;
  colors: Record<string, number>;
  prices: Record<string, number>;
}

export function shopFacetCounts(products: Product[]): ShopFacetCounts {
  const categories: Record<string, number> = {};
  for (const { value } of FIGMA_CATEGORIES) {
    categories[value] = products.filter((product) =>
      value === 'kids' ? product.category === 'kids' || Boolean(product.audience?.includes('kids')) : product.category === value
    ).length;
  }

  const colors: Record<string, number> = {};
  for (const { value } of FIGMA_FILTER_COLORS) {
    colors[value] = products.filter((product) => product.colors.some((color) => color.value === value)).length;
  }

  const prices: Record<string, number> = {};
  for (const { value } of FIGMA_PRICE_RANGES) {
    prices[value] = products.filter((product) => matchesPrice(product, value)).length;
  }

  return { categories, colors, prices };
}
