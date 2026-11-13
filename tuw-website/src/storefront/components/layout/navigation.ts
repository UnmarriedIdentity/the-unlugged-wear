// Shared navigation model for the desktop mega-menu and the mobile drawer.
// Links that carry a `filter` point at the shop listing for that filter, and the
// header counts matching products so empty categories are hidden automatically.
// Image tiles reference catalogue products by slug, so names, photos and prices
// always match the live catalogue.

import { shopHref, type ShopFilter } from '@storefront/lib/product';

export interface NavLink {
  label: string;
  href: string;
  /** Shop filter behind this link; used for the product count. */
  filter?: ShopFilter;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export interface NavFeature {
  /** Catalog product supplying the image (and default title, price and link). */
  productSlug?: string;
  /** Fixed image for non-product tiles (e.g. editorial). */
  image?: string;
  /** CSS object-position for the 4:5 tile crop. */
  imagePosition?: string;
  title?: string;
  caption?: string;
  href?: string;
}

export interface NavItem {
  label: string;
  href: string;
  columns?: NavColumn[];
  features?: NavFeature[];
  /** "Shop all …" link shown at the foot of the panel. */
  shopAll?: NavLink;
}

const shop = (label: string, filter: ShopFilter): NavLink => ({ label, href: shopHref(filter), filter });

const HELP_COLUMN: NavColumn = {
  title: 'Help',
  links: [
    { label: 'Size guide', href: '/size-guide' },
    { label: 'Shipping', href: '/policies/shipping' },
    { label: 'Returns & exchanges', href: '/policies/returns' },
  ],
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Men',
    href: shopHref({ audience: 'men' }),
    columns: [
      {
        title: 'Clothing',
        links: [
          shop('Hoodies & Sweats', { audience: 'men', category: 'hoodies' }),
          shop('T-shirts & Polos', { audience: 'men', category: 'tees' }),
          shop('Jackets', { audience: 'men', category: 'jackets' }),
          shop('Joggers & Shorts', { audience: 'men', category: 'pants' }),
        ],
      },
      {
        title: 'Collections',
        links: [
          { label: 'Acid Wash', href: '/collections/acid-wash' },
          shop('All-over print', { audience: 'men', q: ['AOP'] }),
          shop('New in', { audience: 'men', isNew: true }),
        ],
      },
      HELP_COLUMN,
    ],
    features: [
      { productSlug: 'everyday-pullover-hoodie' },
      { productSlug: 'classic-polo' },
    ],
    shopAll: shop('Shop all men', { audience: 'men' }),
  },
  {
    label: 'Women',
    href: shopHref({ audience: 'women' }),
    columns: [
      {
        title: 'Clothing',
        links: [
          shop('Hoodies & Sweats', { audience: 'women', category: 'hoodies' }),
          shop('Tees & Tops', { audience: 'women', category: 'tees', q: ['tee', 't-shirt', 'top', 'tank', 'polo', 'shirt'] }),
          shop('Dresses & Skirts', { audience: 'women', q: ['dress', 'skirt', 'kaftan'] }),
          shop('Jackets', { audience: 'women', category: 'jackets' }),
          shop('Joggers & Bottoms', { audience: 'women', category: 'pants' }),
        ],
      },
      {
        title: 'Collections',
        links: [
          { label: 'Acid Wash', href: '/collections/acid-wash' },
          shop('All-over print', { audience: 'women', q: ['AOP'] }),
          shop('New in', { audience: 'women', isNew: true }),
        ],
      },
      HELP_COLUMN,
    ],
    features: [
      { productSlug: 'cropped-hoodie' },
      { productSlug: 'everyday-crop-top', imagePosition: '50% 0%' },
    ],
    shopAll: shop('Shop all women', { audience: 'women' }),
  },
  {
    label: 'Kids',
    href: shopHref({ audience: 'kids' }),
    columns: [
      {
        title: 'Clothing',
        links: [
          shop('T-shirts', { audience: 'kids', q: ['t-shirt', 'tee'] }),
          shop('Hoodies & Sweatshirts', { audience: 'kids', q: ['hoodie', 'sweatshirt'] }),
          shop('Jackets', { audience: 'kids', q: ['jacket'] }),
          shop('Shorts', { audience: 'kids', q: ['shorts'] }),
          shop('Rompers', { audience: 'kids', q: ['romper'] }),
        ],
      },
      HELP_COLUMN,
    ],
    features: [{ productSlug: 'kids-pullover-hoodie' }],
    shopAll: shop('Shop all kids', { audience: 'kids' }),
  },
  {
    label: 'Objects',
    href: '/collections/objects',
    columns: [
      {
        title: 'For the home',
        links: [
          shop('Mugs & Bottles', { type: 'drinkware' }),
          shop('Wall art', { type: 'wall-art' }),
          shop('Home & table', { type: 'home' }),
        ],
      },
      {
        title: 'Everyday carry',
        links: [
          shop('Bags & Totes', { type: 'bag' }),
          shop('Phone cases', { type: 'phone-case' }),
          shop('Stationery', { type: 'stationery' }),
          shop('For pets', { type: 'pet' }),
        ],
      },
    ],
    features: [{ productSlug: 'black-coffee-mug' }, { productSlug: 'zip-tote-bag' }],
    shopAll: { label: 'Shop all objects', href: '/collections/objects' },
  },
  {
    label: 'Shop',
    href: '/shop',
    columns: [
      {
        title: 'Clothing',
        links: [
          shop('Hoodies & Sweats', { category: 'hoodies' }),
          shop('T-shirts & Tops', { category: 'tees' }),
          shop('Jackets', { category: 'jackets' }),
          shop('Joggers & Bottoms', { category: 'pants' }),
          shop('Kids', { audience: 'kids' }),
        ],
      },
      {
        title: 'Objects',
        links: [
          shop('Mugs & Bottles', { type: 'drinkware' }),
          shop('Bags & Totes', { type: 'bag' }),
          shop('Phone cases', { type: 'phone-case' }),
          shop('Wall art', { type: 'wall-art' }),
        ],
      },
      {
        title: 'Collections',
        links: [
          { label: 'Acid Wash', href: '/collections/acid-wash' },
          { label: 'Everyday Tees', href: '/collections/everyday-tees' },
          { label: 'All collections', href: '/collections' },
          shop('New in', { isNew: true }),
        ],
      },
    ],
    features: [
      { productSlug: 'everyday-pullover-hoodie' },
      { productSlug: 'acid-wash-hoodie' },
    ],
    shopAll: { label: 'Shop everything', href: '/shop' },
  },
  {
    label: 'About',
    href: '/about',
    columns: [
      {
        title: 'The brand',
        links: [
          { label: 'Our story', href: '/about' },
          { label: 'How we make things', href: '/about/sustainability' },
          { label: 'Journal', href: '/journal' },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'FAQs', href: '/faq' },
          { label: 'Size guide', href: '/size-guide' },
          { label: 'Shipping', href: '/policies/shipping' },
          { label: 'Returns & exchanges', href: '/policies/returns' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    features: [
      {
        image: '/images/about/hero-couple.avif',
        imagePosition: '50% 15%',
        title: 'Our story',
        caption: 'Why we print to order',
        href: '/about',
      },
    ],
  },
];
