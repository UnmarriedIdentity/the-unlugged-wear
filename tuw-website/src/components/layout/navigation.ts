// Shared navigation model for the desktop mega-menu and the mobile drawer.
// Image tiles reference catalog products by slug; Header resolves them from
// the store so tile names, photos and prices always match the live catalog.
// Lifestyle photos only appear on editorial tiles (journal, story), never as a product.

export interface NavLink {
  label: string;
  href: string;
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
}

const ACID_WASH_HREF = '/search?q=acid%20wash';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Men',
    href: '/shop?category=men',
    columns: [
      {
        title: 'Shop Men',
        links: [
          { label: 'View All Men', href: '/shop?category=men' },
          { label: 'Hoodies & Sweats', href: '/shop?audience=men&category=hoodies' },
          { label: 'T-Shirts & Polos', href: '/shop?audience=men&category=tees' },
          { label: 'Joggers & Sweatpants', href: '/shop?audience=men&category=pants' },
        ],
      },
      {
        title: 'Collections',
        links: [
          { label: 'Acid Wash Collection', href: ACID_WASH_HREF },
          { label: 'Hoodies & Sweats', href: '/collections/hoodies-and-sweats' },
          { label: 'Everyday Tees', href: '/collections/everyday-tees' },
        ],
      },
    ],
    features: [{ productSlug: 'everyday-pullover-hoodie' }],
  },
  {
    label: 'Women',
    href: '/shop?category=women',
    columns: [
      {
        title: 'Shop Women',
        links: [
          { label: 'View All Women', href: '/shop?category=women' },
          { label: 'Hoodies & Sweats', href: '/shop?audience=women&category=hoodies' },
          { label: 'Tees & Tops', href: '/shop?audience=women&category=tees' },
          { label: 'Joggers & Sweatpants', href: '/shop?audience=women&category=pants' },
        ],
      },
      {
        title: 'Collections',
        links: [
          { label: 'Acid Wash Collection', href: ACID_WASH_HREF },
          { label: 'Hoodies & Sweats', href: '/collections/hoodies-and-sweats' },
          { label: 'Everyday Tees', href: '/collections/everyday-tees' },
        ],
      },
    ],
    features: [
      { productSlug: 'cropped-hoodie' },
      { productSlug: 'everyday-crop-top', imagePosition: '50% 0%' },
    ],
  },
  {
    label: 'Kids',
    href: '/shop?category=kids',
    columns: [
      {
        title: 'Shop Kids',
        links: [
          { label: 'View All Kids', href: '/shop?category=kids' },
          { label: 'Kids Pullover Hoodie', href: '/products/kids-pullover-hoodie' },
        ],
      },
      {
        title: 'Help',
        links: [{ label: 'Size Guide', href: '/size-guide' }],
      },
    ],
    features: [{ productSlug: 'kids-pullover-hoodie' }],
  },
  {
    label: 'New Collection',
    href: '/collections',
    columns: [
      {
        title: 'Collections',
        links: [
          { label: 'All Collections', href: '/collections' },
          { label: 'Hoodies & Sweats', href: '/collections/hoodies-and-sweats' },
          { label: 'Everyday Tees', href: '/collections/everyday-tees' },
          { label: 'Objects', href: '/collections/objects' },
        ],
      },
      {
        title: 'Featured',
        links: [
          { label: 'New In', href: '/shop' },
          { label: 'Acid Wash Collection', href: ACID_WASH_HREF },
        ],
      },
    ],
    features: [
      {
        productSlug: 'everyday-pullover-hoodie',
        title: 'Hoodies & Sweats',
        caption: 'Shop the collection',
        href: '/collections/hoodies-and-sweats',
      },
      {
        productSlug: 'oversized-classic-tee',
        title: 'Everyday Tees',
        caption: 'Shop the collection',
        href: '/collections/everyday-tees',
      },
      {
        productSlug: 'black-coffee-mug',
        title: 'Objects',
        caption: 'Shop the collection',
        href: '/collections/objects',
      },
    ],
  },
  {
    label: 'About',
    href: '/about',
    columns: [
      {
        title: 'The Brand',
        links: [
          { label: 'Our Story', href: '/about' },
          { label: 'Sustainability', href: '/about/sustainability' },
          { label: 'Journal', href: '/journal' },
        ],
      },
      {
        title: 'Help',
        links: [
          { label: 'FAQs', href: '/faq' },
          { label: 'Size Guide', href: '/size-guide' },
          { label: 'Shipping', href: '/policies/shipping' },
          { label: 'Returns & Exchanges', href: '/policies/returns' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    ],
    features: [
      {
        image: '/images/about/our-story-couple.webp',
        title: 'Our Story',
        caption: 'Why we print to order',
        href: '/about',
      },
    ],
  },
];
