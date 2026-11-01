// Product helpers shared by the product page, cards and size guide. Pure functions only.
import type { Product, ProductType } from './types';

export const RETURN_WINDOW_DAYS = 14;
export const FREE_SHIPPING_THRESHOLD_INR = 3000;

/** Shopper-facing name for each category (breadcrumbs, eyebrows). */
export const CATEGORY_LABELS: Record<Product['category'], string> = {
  hoodies: 'Hoodies & Sweats',
  tees: 'T-shirts & Tops',
  pants: 'Joggers & Bottoms',
  jackets: 'Jackets',
  kids: 'Kids',
  mugs: 'Drinkware',
  accessories: 'Accessories',
  capsules: 'Capsules',
};

/** Layout family for a product; hand-written products fall back to their category. */
export function productTypeOf(product: Product): ProductType {
  if (product.productType) return product.productType;
  if (product.category === 'kids') return 'kids-apparel';
  if (product.category === 'mugs' || product.slug.includes('mug')) return 'drinkware';
  if (product.category === 'accessories') return product.slug.includes('tote') ? 'bag' : 'home';
  return 'apparel';
}

export const isWearable = (type: ProductType) =>
  type === 'apparel' || type === 'kids-apparel' || type === 'pet';

/** Label for the size/variant picker. */
export function variantLabelOf(product: Product): string {
  if (product.variantLabel) return product.variantLabel;
  const type = productTypeOf(product);
  if (type === 'kids-apparel') return 'Age';
  if (type === 'drinkware') return 'Capacity';
  return isWearable(type) ? 'Size' : 'Option';
}

/** Which size chart applies, if any. */
export type SizeChartKind = 'tops' | 'bottoms' | 'kids';
export function sizeChartOf(product: Product): SizeChartKind | null {
  const type = productTypeOf(product);
  if (type === 'kids-apparel') return 'kids';
  if (type !== 'apparel') return null;
  if (product.category === 'pants' || /skirt|legging/i.test(product.title)) return 'bottoms';
  return 'tops';
}

/** Images on the page are sample shots until real product photography exists. */
export const isPlaceholderImage = (alt: string) => /^placeholder/i.test(alt);

/**
 * Up to `count` products to show beside this one: same category first, then the
 * same audience, then anything; pieces with photos ahead of those without.
 */
export function relatedProductsFor(product: Product, catalogue: Product[], count = 4): Product[] {
  const others = catalogue.filter((p) => p.id !== product.id && p.publicationStatus !== 'draft');
  const score = (p: Product) =>
    (p.category === product.category ? 4 : 0) +
    (p.audience?.some((a) => product.audience?.includes(a)) ? 2 : 0) +
    (p.images.length > 0 ? 1 : 0);
  return others
    .map((p, idx) => ({ p, s: score(p), idx }))
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .slice(0, count)
    .map(({ p }) => p);
}

const addBusinessDays = (from: Date, days: number) => {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) added += 1; // print floor works Monday–Saturday
  }
  return date;
};

/**
 * Demo delivery window for a 6-digit Indian PIN: 2–3 business days to print,
 * then 3–6 days with the courier. Same window everywhere until live courier
 * serviceability is connected. Returns null for an invalid PIN.
 */
export function deliveryEstimate(pin: string, today = new Date()) {
  if (!/^[1-8]\d{5}$/.test(pin)) return null;
  return {
    earliest: addBusinessDays(today, 2 + 3),
    latest: addBusinessDays(today, 3 + 6),
  };
}

/** A shop listing filter; the menu, shop page and collections share it. */
export interface ShopFilter {
  audience?: 'men' | 'women' | 'kids';
  category?: Product['category'];
  type?: ProductType;
  /** Case-insensitive words; a product matches if its title contains any of them. */
  q?: string[];
  isNew?: boolean;
}

export function matchesShopFilter(product: Product, filter: ShopFilter): boolean {
  if (product.publicationStatus === 'draft') return false;
  if (filter.audience) {
    const forKids = filter.audience === 'kids' && product.category === 'kids';
    if (!forKids && !product.audience?.includes(filter.audience)) return false;
  }
  if (filter.category && product.category !== filter.category) return false;
  if (filter.type && productTypeOf(product) !== filter.type) return false;
  if (filter.isNew && !product.isNew) return false;
  if (filter.q?.length) {
    const title = product.title.toLowerCase();
    if (!filter.q.some((word) => title.includes(word.toLowerCase()))) return false;
  }
  return true;
}

/** Shop URL for a filter, e.g. /shop?audience=men&category=hoodies. */
export function shopHref(filter: ShopFilter): string {
  const params = new URLSearchParams();
  if (filter.audience) params.set('audience', filter.audience);
  if (filter.category) params.set('category', filter.category);
  if (filter.type) params.set('type', filter.type);
  if (filter.q?.length) params.set('q', filter.q.join(','));
  if (filter.isNew) params.set('new', '1');
  const query = params.toString();
  return query ? `/shop?${query}` : '/shop';
}
