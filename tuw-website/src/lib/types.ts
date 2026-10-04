// Shared storefront types for The Unplugged Wear

export type ProductColor = {
  name: string;
  hex: string;
  value: string;
};

export type ProductSize = {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  inStock: boolean;
  stockCount: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'hoodies' | 'tees' | 'jackets' | 'pants' | 'accessories' | 'capsules';
  priceINR: number;
  priceMinorINR?: number; // Integer minor-unit INR paise (e.g. 389900 = ₹3,899)
  compareAtPriceINR?: number;
  compareAtPriceMinorINR?: number;
  images: {
    url: string;
    alt: string;
    color?: string;
  }[];
  colors: ProductColor[];
  sizes: ProductSize[];
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
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  productCount: number;
  tagline: string;
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
};

export type Address = {
  id: string;
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
  status: 'Confirmed' | 'Printing' | 'Shipped' | 'Delivered' | 'Returned' | 'Failed' | 'Refunded';
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
