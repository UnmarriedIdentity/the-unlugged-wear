// Shared storefront types for The Unplugged Wear

export type ProductColor = {
  name: string;
  hex: string;
  value: string;
};

export type ProductSize = {
  size: string;
  inStock: boolean;
  stockCount: number;
  /** Set only when sizes are priced differently (partner price tiers). */
  priceINR?: number;
  priceMinorINR?: number;
};


// Polymorphic Table Types
export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface ProductSpecTable {
  title: string;
  eyebrow?: string;
  description?: string;
  columns: TableColumn[];
  rows: Record<string, string | number>[];
  unitToggle?: {
    units: { id: string; label: string }[];
    metricRows?: Record<string, string | number>[];
    imperialRows?: Record<string, string | number>[];
  };
  sideScale?: {
    eyebrow?: string;
    title: string;
    description?: string;
    minLabel: string;
    midLabel: string;
    maxLabel: string;
    indicatorPosition?: 'left' | 'center' | 'right';
    footerNote?: string;
  };
}

// Dynamic Radio Option Types
export interface ProductRadioOption {
  id: string;
  label: string;
  description?: string;
  priceDeltaINR?: number;
  badge?: string;
}

export interface ProductRadioGroup {
  groupKey: string;
  label: string;
  description?: string;
  options: ProductRadioOption[];
  defaultValue?: string;
}

// Dynamic FAQ Types
export interface ProductFaqItem {
  id: string;
  question: string;
  answer: string;
}

export type Product = {
  id: string;
  /** Database id (the public `id` keeps the legacy demo id for saved bags/wishlists). */
  productId?: string;
  /** Linked size chart (see SizeChartData); none means no size guide. */
  sizeChartId?: string;
  slug: string;
  aliases?: string[];
  title: string;
  subtitle: string;
  category: 'hoodies' | 'tees' | 'jackets' | 'pants' | 'accessories' | 'capsules' | 'mugs' | 'kids';
  /** Who the piece is cut for; drives the Men / Women / Kids navigation. */
  audience?: ('men' | 'women' | 'kids')[];
  /** Print-partner base style code (e.g. Qikink "UH83"); fulfilment only, never rendered. */
  partnerStyleCode?: string;
  priceINR: number;
  priceMinorINR?: number; // Integer minor-unit INR paise (e.g. 389900 = ₹3,899)
  compareAtPriceINR?: number;
  compareAtPriceMinorINR?: number;
  images: {
    url: string;
    alt: string;
    color?: string;
    label?: string;
  }[];
  colors: ProductColor[];
  sizes: ProductSize[];
  radioGroups?: ProductRadioGroup[];
  specTable?: ProductSpecTable | null;
  faqs?: ProductFaqItem[];
  description: string;
  details: string[];
  careInstructions: string[];
  composition: string;
  publicationStatus?: 'published' | 'draft' | 'archived';
  partnerProvider?: 'Qikink Direct API' | 'Printrove Hub' | 'Custom Atelier';
  partnerAvailability?: 'ready_to_print' | 'partner_delayed' | 'discontinued';
  sustainabilityBadge?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  videoUrl?: string;
  /** Page layout family; defaults from category when missing (see productTypeOf). */
  productType?: ProductType;
  /** Label for the variant picker, e.g. "Size", "Phone model", "Age". */
  variantLabel?: string;
  /** Retail price not yet confirmed by the owner; shown with a draft notice. */
  priceIsDraft?: boolean;
  /** Print areas offered by the print partner (verbatim from their sheet). */
  printAreas?: string[];
  weightGrams?: number;
  taxRatePercent?: number;
  hsnCode?: string;
};

export type ProductType =
  | 'apparel'
  | 'kids-apparel'
  | 'pet'
  | 'drinkware'
  | 'wall-art'
  | 'phone-case'
  | 'bag'
  | 'stationery'
  | 'home';

export type SizeChartData = {
  id: string;
  name: string;
  /** Measurement names, in display order. */
  columns: string[];
  rows: { size: string; measures: Record<string, number | string> }[];
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  productCount: number;
  tagline: string;
  /** Member product ids in merchandising order (from collection_products). */
  productIds: string[];
};

export type CartItem = {
  id: string;
  productId: string;
  title: string;
  color: string;
  size: string;
  priceINR: number;
  priceMinorINR?: number;
  quantity: number;
  image: string;
  /** How many this line may hold right now (from the server; 0 = no longer available). */
  maxQty?: number;
  selectedRadioOptions?: {
    groupKey: string;
    groupLabel: string;
    optionId: string;
    optionLabel: string;
    priceDeltaINR?: number;
  }[];
};

export type Address = {
  id: string;
  /** Customer's name for the address, e.g. "Home", "Work", "Friend". */
  label?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
};

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type FulfillmentStatus = 'queued' | 'printing' | 'shipped' | 'delivered' | 'submission_failed';

export type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Confirmed' | 'Printing' | 'Shipped' | 'Delivered' | 'Returned' | 'Failed' | 'Refunded' | 'Cancelled';
  /** The database status (SQL vocabulary), when the order came from the database. */
  sqlStatus?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'refunded';
  /** End of the free-cancel window (ISO). */
  cancellableUntil?: string;
  /** True while the account that placed it may still cancel. */
  canCancel?: boolean;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  items: CartItem[];
  subtotalINR: number;
  shippingINR: number;
  discountINR: number;
  totalINR: number;
  refundAmountINR?: number;
  shippingAddress: Address;
  paymentMethod: 'UPI' | 'Card' | 'COD (Demo)';
  partnerOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingEvents?: {
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }[];
};

export type DemoScenario = 'normal' | 'loading' | 'empty' | 'error' | 'long_content';

export type ReturnRequest = {
  id: string;
  orderNumber: string;
  itemTitle: string;
  variant: string;
  reason: string;
  condition: string;
  status: 'Requested' | 'Approved' | 'Pickup Scheduled' | 'Received & Restocked' | 'Rejected';
  createdAt: string;
};

export type JournalArticle = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: 'Craft' | 'Slow Living' | 'Sustainability' | 'Design';
  coverImage: string;
  /** CSS object-position for the 16:10 cover crop, so portrait photos keep the face in frame. */
  coverPosition?: string;
  author: string;
  readTime: string;
  publishedAt: string;
  content: string[];
};

export type FaqItem = {
  id: string;
  category: 'Ordering & Sizing' | 'Shipping & Tracking' | 'Sustainable POD' | 'Returns & Care';
  question: string;
  answer: string;
};

export interface ReviewItem {
  id: string;
  author: string;
  role: string;
  verified: boolean;
  rating: number;
  date: string;
  title: string;
  content: string;
  variant: string;
}
