export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category: 'T-Shirts' | 'Hoodies' | 'Jackets' | 'Pants' | 'Accessories';
  price: number; // in USD (or formatted display)
  compareAtPrice?: number;
  stock: number;
  publicationStatus: 'published' | 'draft' | 'archived';
  description: string;
  colors: string[];
  sizes: string[];
  partner: 'Qikink Direct API' | 'Printrove Hub' | 'Custom Atelier';
  placement: 'Chest (45mm)' | 'Back Oversized' | 'Sleeve Length' | 'Interior Hem';
  soldCount: number;
  imageBg: string;
  image?: string;
  video?: string;
  rating: number;
}

export interface OrderItemLine {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type FulfillmentStatus = 'queued' | 'printing' | 'shipped' | 'delivered' | 'submission_failed';

export interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItemLine[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  paidAmount: number;
  refundedAmount: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentMethod: string;
  carrier?: string;
  trackingNumber?: string;
  date: string;
  timeline: { title: string; time: string; note: string }[];
}

export interface ShipmentItem {
  trackingId: string;
  orderId: string;
  carrier: string;
  destination: string;
  pieces: number;
  dispatchDate: string;
  estimatedDelivery: string;
  status: 'delivered' | 'in_transit' | 'out_for_delivery' | 'exception';
  events: { time: string; location: string; description: string }[];
}

export interface RefundItem {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  amount: number;
  method: string;
  date: string;
  status: 'completed' | 'processing' | 'rejected';
}

export interface ReturnItem {
  id: string;
  orderId: string;
  customer: string;
  items: string;
  trackingNumber: string;
  carrier: string;
  stage: 'in_transit' | 'inspected' | 'restocked' | 'disputed';
  date: string;
  reason: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  tier: 'VIP Customer' | 'Active' | 'New';
  address: string;
  city: string;
  country: string;
  joinedDate: string;
  notes: string[];
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'pending' | 'resolved';
  createdAt: string;
  messages: { sender: 'customer' | 'staff'; text: string; time: string }[];
}

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  season: string;
  productCount: number;
  visibility: 'published' | 'draft' | 'scheduled';
  updatedAt: string;
  description: string;
}

export interface DesignAsset {
  id: string;
  name: string;
  category: 'Print Artwork' | 'Embroidery' | 'Typography' | 'Label Spec';
  designer: string;
  placement: string;
  dimensions: string;
  fileFormat: string;
  fileSize: string;
  status: 'approved' | 'in_review' | 'archived';
  updatedAt: string;
}

export type StaffRole = 'Owner' | 'Operations' | 'Content' | 'Read-only';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'active' | 'invited' | 'inactive';
  lastActive: string;
  avatarBg: string;
}

// -------------------------------------------------------------
// BASELINE DETERMINISTIC FIXTURES
// -------------------------------------------------------------

export const initialProducts: ProductItem[] = [
  {
    id: 'PRD-01',
    name: 'Urbanist Heavyweight Tee',
    slug: 'urbanist-heavyweight-tee',
    category: 'T-Shirts',
    price: 48.0,
    compareAtPrice: 58.0,
    stock: 42,
    publicationStatus: 'published',
    description: '280 GSM combed organic cotton with relaxed drop-shoulder silhouette and reinforced collar.',
    colors: ['Jet Black', 'Bone Chalk', 'Washed Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    partner: 'Qikink Direct API',
    placement: 'Back Oversized',
    soldCount: 492,
    imageBg: 'linear-gradient(135deg, #EBF4F8 0%, #D8EBF5 100%)',
    image: '/products/1.jpeg',
    rating: 4.9,
  },
  {
    id: 'PRD-02',
    name: 'Signature Boxy Hoodie',
    slug: 'signature-boxy-hoodie',
    category: 'Hoodies',
    price: 115.0,
    compareAtPrice: 130.0,
    stock: 18,
    publicationStatus: 'published',
    description: '460 GSM French terry cotton with structured double-layered hood and tonal embroidery.',
    colors: ['Onyx', 'Heather Grey', 'Vintage Clay'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    partner: 'Printrove Hub',
    placement: 'Chest (45mm)',
    soldCount: 369,
    imageBg: 'linear-gradient(135deg, #FAF0EB 0%, #F5E2DA 100%)',
    image: '/products/2.jpeg',
    video: '/products/2.mp4',
    rating: 4.8,
  },
  {
    id: 'PRD-03',
    name: 'Minimalist Relaxed Cargo Pant',
    slug: 'minimalist-relaxed-cargo-pant',
    category: 'Pants',
    price: 135.0,
    stock: 24,
    publicationStatus: 'published',
    description: 'Cotton ripstop engineered with gusseted knee pleats and concealed magnetic storm pockets.',
    colors: ['Dark Charcoal', 'Earth Sand'],
    sizes: ['30', '32', '34', '36'],
    partner: 'Custom Atelier',
    placement: 'Interior Hem',
    soldCount: 215,
    imageBg: 'linear-gradient(135deg, #F0F3F6 0%, #E3E7ED 100%)',
    image: '/products/3.jpeg',
    rating: 4.7,
  },
  {
    id: 'PRD-04',
    name: 'Technical Shell Bomber Jacket',
    slug: 'technical-shell-bomber-jacket',
    category: 'Jackets',
    price: 220.0,
    compareAtPrice: 250.0,
    stock: 8,
    publicationStatus: 'published',
    description: 'Water-repellent 3-layer laminated nylon with taped seams, matte two-way YKK zippers.',
    colors: ['Obsidian Black', 'Midnight Navy'],
    sizes: ['M', 'L', 'XL'],
    partner: 'Custom Atelier',
    placement: 'Sleeve Length',
    soldCount: 140,
    imageBg: 'linear-gradient(135deg, #F7EFE8 0%, #EDE1D5 100%)',
    image: '/products/1.jpeg',
    rating: 5.0,
  },
  {
    id: 'PRD-05',
    name: 'Architectural Oversized Trench',
    slug: 'architectural-oversized-trench',
    category: 'Jackets',
    price: 280.0,
    stock: 5,
    publicationStatus: 'draft',
    description: 'Double-breasted heavyweight gabardine with removable storm flap and horn buttons.',
    colors: ['Camel Khaki', 'Black'],
    sizes: ['S', 'M', 'L'],
    partner: 'Custom Atelier',
    placement: 'Interior Hem',
    soldCount: 0,
    imageBg: 'linear-gradient(135deg, #E6EEF5 0%, #D2DEEB 100%)',
    image: '/products/2.jpeg',
    video: '/products/2.mp4',
    rating: 0,
  },
  {
    id: 'PRD-06',
    name: 'Unplugged Soundwave Graphic Tee',
    slug: 'unplugged-soundwave-graphic-tee',
    category: 'T-Shirts',
    price: 52.0,
    stock: 65,
    publicationStatus: 'published',
    description: 'High-density screenprinted soundwave motif on pre-shrunk vintage wash cotton.',
    colors: ['Vintage White', 'Faded Charcoal'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    partner: 'Qikink Direct API',
    placement: 'Back Oversized',
    soldCount: 520,
    imageBg: 'linear-gradient(135deg, #FAF3F7 0%, #EFE1EB 100%)',
    image: '/products/3.jpeg',
    rating: 4.9,
  },
  {
    id: 'PRD-07',
    name: 'Brushed Cashmere Beanie',
    slug: 'brushed-cashmere-beanie',
    category: 'Accessories',
    price: 45.0,
    stock: 35,
    publicationStatus: 'published',
    description: '100% Mongolian cashmere with ribbed knit cuff and minimal engraved steel label tag.',
    colors: ['Heather Grey', 'Pure Black', 'Oatmeal'],
    sizes: ['One Size'],
    partner: 'Custom Atelier',
    placement: 'Interior Hem',
    soldCount: 198,
    imageBg: 'linear-gradient(135deg, #EBF4F8 0%, #D8EBF5 100%)',
    image: '/products/1.jpeg',
    rating: 4.8,
  },
  {
    id: 'PRD-08',
    name: 'Cordura Everyday Crossbody Bag',
    slug: 'cordura-everyday-crossbody-bag',
    category: 'Accessories',
    price: 75.0,
    stock: 29,
    publicationStatus: 'published',
    description: '500D ballistic Cordura with Fidlock magnetic buckle and waterproof seam seals.',
    colors: ['Matte Black', 'Tactical Slate'],
    sizes: ['One Size'],
    partner: 'Printrove Hub',
    placement: 'Chest (45mm)',
    soldCount: 260,
    imageBg: 'linear-gradient(135deg, #F0F3F6 0%, #E3E7ED 100%)',
    image: '/products/2.jpeg',
    video: '/products/2.mp4',
    rating: 4.9,
  },
  {
    id: 'PRD-09',
    name: 'Washed Loopback Sweatpant',
    slug: 'washed-loopback-sweatpant',
    category: 'Pants',
    price: 95.0,
    stock: 0,
    publicationStatus: 'archived',
    description: 'Heavyweight organic cotton loopback with elasticated cinch cuff and heavy drawcord.',
    colors: ['Dust Sage', 'Jet Black'],
    sizes: ['S', 'M', 'L'],
    partner: 'Qikink Direct API',
    placement: 'Chest (45mm)',
    soldCount: 310,
    imageBg: 'linear-gradient(135deg, #FAF0EB 0%, #F5E2DA 100%)',
    image: '/products/3.jpeg',
    rating: 4.6,
  },
  {
    id: 'PRD-10',
    name: 'Raw Denim Carpenter Jean',
    slug: 'raw-denim-carpenter-jean',
    category: 'Pants',
    price: 160.0,
    stock: 14,
    publicationStatus: 'published',
    description: '14.5oz Japanese selvedge denim, triple-stitched tool pocket, antique brass hardware.',
    colors: ['Raw Indigo'],
    sizes: ['30', '32', '34', '36'],
    partner: 'Custom Atelier',
    placement: 'Interior Hem',
    soldCount: 88,
    imageBg: 'linear-gradient(135deg, #F7EFE8 0%, #EDE1D5 100%)',
    image: '/products/1.jpeg',
    rating: 4.9,
  },
];

export const initialOrders: OrderItem[] = [
  {
    id: '#ORD-8820',
    customerName: 'Sophia Anderson',
    customerEmail: 'sophia.anderson@example.com',
    customerPhone: '+1 (555) 234-8901',
    shippingAddress: '482 Mercer St, Apt 4B, New York, NY 10013, USA',
    items: [
      { id: 'li-01', productId: 'PRD-01', productName: 'Urbanist Heavyweight Tee', variant: 'Jet Black / L', quantity: 2, price: 48.0 },
      { id: 'li-02', productId: 'PRD-07', productName: 'Brushed Cashmere Beanie', variant: 'Pure Black / One Size', quantity: 1, price: 45.0 },
    ],
    subtotal: 141.0,
    shippingFee: 7.5,
    tax: 0.0,
    total: 148.5,
    paidAmount: 148.5,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'Credit Card (Visa ending in 4242)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489102834',
    date: '16 Apr 2026, 14:32',
    timeline: [
      { title: 'Order Placed', time: '16 Apr, 14:32', note: 'Customer completed checkout via Visa' },
      { title: 'Payment Captured', time: '16 Apr, 14:33', note: 'Stripe webhook verified settlement' },
      { title: 'Fulfillment Queued', time: '16 Apr, 14:40', note: 'Sent to warehouse batch printer' },
      { title: 'Dispatched via DHL', time: '16 Apr, 16:10', note: 'Tracking # DHL-489102834 generated' },
    ],
  },
  {
    id: '#ORD-8819',
    customerName: 'Liam Miller',
    customerEmail: 'liam.miller@example.com',
    customerPhone: '+1 (555) 345-6789',
    shippingAddress: '782 Kingsway, London, WC2B 6AH, UK',
    items: [
      { id: 'li-03', productId: 'PRD-02', productName: 'Signature Boxy Hoodie', variant: 'Heather Grey / M', quantity: 1, price: 115.0 },
    ],
    subtotal: 115.0,
    shippingFee: 12.0,
    tax: 0.0,
    total: 127.0,
    paidAmount: 127.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'printing',
    paymentMethod: 'Apple Pay (Mastercard)',
    date: '16 Apr 2026, 14:15',
    timeline: [
      { title: 'Order Placed', time: '16 Apr, 14:15', note: 'Apple Pay authorization passed' },
      { title: 'Sent to Floor', time: '16 Apr, 14:25', note: 'Qikink station printing garment' },
    ],
  },
  {
    id: '#ORD-8818',
    customerName: 'Emma Watson',
    customerEmail: 'emma.watson@example.com',
    customerPhone: '+1 (555) 456-7890',
    shippingAddress: '124 Rue de Rivoli, 75001 Paris, France',
    items: [
      { id: 'li-04', productId: 'PRD-04', productName: 'Technical Shell Bomber Jacket', variant: 'Obsidian Black / L', quantity: 1, price: 220.0 },
    ],
    subtotal: 220.0,
    shippingFee: 15.0,
    tax: 0.0,
    total: 235.0,
    paidAmount: 235.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Credit Card (Amex ending in 1004)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489101192',
    date: '16 Apr 2026, 13:48',
    timeline: [
      { title: 'Delivered', time: '17 Apr, 11:20', note: 'Signed for by recipient at front desk' },
    ],
  },
  {
    id: '#ORD-8817',
    customerName: 'Oliver Davis',
    customerEmail: 'oliver.davis@example.com',
    customerPhone: '+1 (555) 567-8901',
    shippingAddress: '310 Collins St, Melbourne VIC 3000, Australia',
    items: [
      { id: 'li-05', productId: 'PRD-06', productName: 'Unplugged Soundwave Graphic Tee', variant: 'Vintage White / XL', quantity: 1, price: 52.0 },
    ],
    subtotal: 52.0,
    shippingFee: 10.0,
    tax: 0.0,
    total: 62.0,
    paidAmount: 62.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'submission_failed',
    paymentMethod: 'Credit Card (Visa)',
    date: '16 Apr 2026, 13:12',
    timeline: [
      { title: 'Partner Sync Error', time: '16 Apr, 13:15', note: 'Print partner webhook timed out: HTTP 504 Gateway Timeout' },
    ],
  },
  {
    id: '#ORD-8816',
    customerName: 'Ava Wilson',
    customerEmail: 'ava.wilson@example.com',
    customerPhone: '+1 (555) 678-9012',
    shippingAddress: '900 Wilshire Blvd, Los Angeles, CA 90017, USA',
    items: [
      { id: 'li-06', productId: 'PRD-08', productName: 'Cordura Everyday Crossbody Bag', variant: 'Matte Black / One Size', quantity: 1, price: 75.0 },
    ],
    subtotal: 75.0,
    shippingFee: 8.0,
    tax: 0.0,
    total: 83.0,
    paidAmount: 0.0,
    refundedAmount: 0.0,
    paymentStatus: 'pending',
    fulfillmentStatus: 'queued',
    paymentMethod: 'Bank Transfer (Awaiting confirmation)',
    date: '16 Apr 2026, 12:55',
    timeline: [
      { title: 'Awaiting Bank Wire', time: '16 Apr, 12:55', note: 'Wire reference generated #TUW-WIRE-8816' },
    ],
  },
  {
    id: '#ORD-8815',
    customerName: 'Lucas Taylor',
    customerEmail: 'lucas.taylor@example.com',
    customerPhone: '+1 (555) 789-0123',
    shippingAddress: '240 Bay St, Toronto, ON M5R 2A5, Canada',
    items: [
      { id: 'li-07', productId: 'PRD-03', productName: 'Minimalist Relaxed Cargo Pant', variant: 'Dark Charcoal / 32', quantity: 1, price: 135.0 },
    ],
    subtotal: 135.0,
    shippingFee: 12.0,
    tax: 0.0,
    total: 147.0,
    paidAmount: 147.0,
    refundedAmount: 147.0,
    paymentStatus: 'refunded',
    fulfillmentStatus: 'queued',
    paymentMethod: 'Credit Card (Visa)',
    date: '16 Apr 2026, 12:20',
    timeline: [
      { title: 'Full Refund Issued', time: '16 Apr, 12:45', note: 'Customer requested cancellation prior to print floor' },
    ],
  },
  {
    id: '#ORD-8814',
    customerName: 'Mia Brown',
    customerEmail: 'mia.brown@example.com',
    customerPhone: '+1 (555) 890-1234',
    shippingAddress: '42 Kurfürstendamm, 10707 Berlin, Germany',
    items: [
      { id: 'li-08', productId: 'PRD-01', productName: 'Urbanist Heavyweight Tee', variant: 'Bone Chalk / M', quantity: 1, price: 48.0 },
    ],
    subtotal: 48.0,
    shippingFee: 8.0,
    tax: 0.0,
    total: 56.0,
    paidAmount: 0.0,
    refundedAmount: 0.0,
    paymentStatus: 'failed',
    fulfillmentStatus: 'queued',
    paymentMethod: 'Credit Card (Declined: Insufficient Funds)',
    date: '16 Apr 2026, 11:45',
    timeline: [
      { title: 'Payment Attempt Failed', time: '16 Apr, 11:45', note: 'Issuer declined charge' },
    ],
  },
  {
    id: '#ORD-8813',
    customerName: 'Noah Johnson',
    customerEmail: 'noah.johnson@example.com',
    customerPhone: '+1 (555) 901-2345',
    shippingAddress: '100 Queen St, Brisbane QLD 4000, Australia',
    items: [
      { id: 'li-09', productId: 'PRD-02', productName: 'Signature Boxy Hoodie', variant: 'Vintage Clay / L', quantity: 1, price: 115.0 },
      { id: 'li-10', productId: 'PRD-10', productName: 'Raw Denim Carpenter Jean', variant: 'Raw Indigo / 34', quantity: 1, price: 160.0 },
    ],
    subtotal: 275.0,
    shippingFee: 15.0,
    tax: 0.0,
    total: 290.0,
    paidAmount: 290.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'PayPal Express',
    carrier: 'FedEx Priority',
    trackingNumber: 'FDX-771209381',
    date: '16 Apr 2026, 11:10',
    timeline: [
      { title: 'In Transit', time: '16 Apr, 14:00', note: 'Departed distribution facility' },
    ],
  },
  {
    id: '#ORD-8812',
    customerName: 'Isabella Garcia',
    customerEmail: 'isabella.garcia@example.com',
    customerPhone: '+1 (555) 012-3456',
    shippingAddress: '55 Calle Serrano, 28001 Madrid, Spain',
    items: [
      { id: 'li-11', productId: 'PRD-06', productName: 'Unplugged Soundwave Graphic Tee', variant: 'Vintage White / M', quantity: 1, price: 52.0 },
    ],
    subtotal: 52.0,
    shippingFee: 9.0,
    tax: 0.0,
    total: 61.0,
    paidAmount: 61.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Google Pay (Visa)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489102999',
    date: '16 Apr 2026, 10:35',
    timeline: [
      { title: 'Delivered', time: '17 Apr, 09:30', note: 'Delivered to resident' },
    ],
  },
  {
    id: '#ORD-8811',
    customerName: 'Ethan Martinez',
    customerEmail: 'ethan.martinez@example.com',
    customerPhone: '+1 (555) 123-4567',
    shippingAddress: '88 Michigan Ave, Chicago, IL 60603, USA',
    items: [
      { id: 'li-12', productId: 'PRD-07', productName: 'Brushed Cashmere Beanie', variant: 'Oatmeal / One Size', quantity: 1, price: 45.0 },
    ],
    subtotal: 45.0,
    shippingFee: 5.0,
    tax: 0.0,
    total: 50.0,
    paidAmount: 50.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'queued',
    paymentMethod: 'Credit Card (Visa)',
    date: '16 Apr 2026, 09:50',
    timeline: [
      { title: 'In Queue', time: '16 Apr, 09:50', note: 'Allocated warehouse stock slot' },
    ],
  },
  {
    id: '#ORD-8810',
    customerName: 'Charlotte White',
    customerEmail: 'charlotte.white@example.com',
    customerPhone: '+1 (555) 234-5678',
    shippingAddress: '15 Piazza del Duomo, 20121 Milan, Italy',
    items: [
      { id: 'li-13', productId: 'PRD-01', productName: 'Urbanist Heavyweight Tee', variant: 'Washed Olive / S', quantity: 2, price: 48.0 },
    ],
    subtotal: 96.0,
    shippingFee: 10.0,
    tax: 0.0,
    total: 106.0,
    paidAmount: 106.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'printing',
    paymentMethod: 'Credit Card (Mastercard)',
    date: '15 Apr 2026, 19:20',
    timeline: [
      { title: 'Printing garment', time: '16 Apr, 08:30', note: 'Batch run 42' },
    ],
  },
  {
    id: '#ORD-8809',
    customerName: 'Benjamin Scott',
    customerEmail: 'benjamin.scott@example.com',
    customerPhone: '+1 (555) 345-6780',
    shippingAddress: '34 Market St, San Francisco, CA 94105, USA',
    items: [
      { id: 'li-14', productId: 'PRD-04', productName: 'Technical Shell Bomber Jacket', variant: 'Midnight Navy / M', quantity: 1, price: 220.0 },
    ],
    subtotal: 220.0,
    shippingFee: 0.0,
    tax: 0.0,
    total: 220.0,
    paidAmount: 220.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'Apple Pay (Amex)',
    carrier: 'UPS Ground',
    trackingNumber: 'UPS-102938472',
    date: '15 Apr 2026, 17:10',
    timeline: [
      { title: 'In Transit', time: '16 Apr, 07:00', note: 'Departed sorting hub Oakland CA' },
    ],
  },
  {
    id: '#ORD-8808',
    customerName: 'Harper Lee',
    customerEmail: 'harper.lee@example.com',
    customerPhone: '+1 (555) 456-7891',
    shippingAddress: '12 Gangnam-daero, Seoul, South Korea',
    items: [
      { id: 'li-15', productId: 'PRD-08', productName: 'Cordura Everyday Crossbody Bag', variant: 'Tactical Slate / One Size', quantity: 2, price: 75.0 },
    ],
    subtotal: 150.0,
    shippingFee: 18.0,
    tax: 0.0,
    total: 168.0,
    paidAmount: 168.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'submission_failed',
    paymentMethod: 'Credit Card (Visa)',
    date: '15 Apr 2026, 15:45',
    timeline: [
      { title: 'Address Validation Required', time: '15 Apr, 16:00', note: 'Postal code format requires manual review' },
    ],
  },
  {
    id: '#ORD-8807',
    customerName: 'Daniel Harris',
    customerEmail: 'daniel.harris@example.com',
    customerPhone: '+1 (555) 567-8902',
    shippingAddress: '55 George St, Edinburgh EH2 2HT, UK',
    items: [
      { id: 'li-16', productId: 'PRD-02', productName: 'Signature Boxy Hoodie', variant: 'Onyx / XL', quantity: 1, price: 115.0 },
    ],
    subtotal: 115.0,
    shippingFee: 8.0,
    tax: 0.0,
    total: 123.0,
    paidAmount: 123.0,
    refundedAmount: 50.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Credit Card (Visa)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489102711',
    date: '15 Apr 2026, 14:10',
    timeline: [
      { title: 'Partial Refund Applied', time: '16 Apr, 10:00', note: 'Goodwill discount ₹50 applied for late arrival' },
    ],
  },
  {
    id: '#ORD-8806',
    customerName: 'Chloe Zhao',
    customerEmail: 'chloe.zhao@example.com',
    customerPhone: '+1 (555) 678-9013',
    shippingAddress: '88 Harbour St, Sydney NSW 2000, Australia',
    items: [
      { id: 'li-17', productId: 'PRD-03', productName: 'Minimalist Relaxed Cargo Pant', variant: 'Earth Sand / 30', quantity: 1, price: 135.0 },
    ],
    subtotal: 135.0,
    shippingFee: 14.0,
    tax: 0.0,
    total: 149.0,
    paidAmount: 149.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    paymentMethod: 'Credit Card (Mastercard)',
    carrier: 'FedEx Priority',
    trackingNumber: 'FDX-771209555',
    date: '15 Apr 2026, 11:30',
    timeline: [
      { title: 'Out for Delivery', time: '16 Apr, 08:00', note: 'Courier van dispatched' },
    ],
  },
  {
    id: '#ORD-8805',
    customerName: 'Alexander Wright',
    customerEmail: 'alex.wright@example.com',
    customerPhone: '+1 (555) 789-0124',
    shippingAddress: '740 Park Ave, New York, NY 10021, USA',
    items: [
      { id: 'li-18', productId: 'PRD-01', productName: 'Urbanist Heavyweight Tee', variant: 'Jet Black / M', quantity: 3, price: 48.0 },
      { id: 'li-19', productId: 'PRD-02', productName: 'Signature Boxy Hoodie', variant: 'Onyx / M', quantity: 1, price: 115.0 },
    ],
    subtotal: 259.0,
    shippingFee: 0.0,
    tax: 0.0,
    total: 259.0,
    paidAmount: 259.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'printing',
    paymentMethod: 'Apple Pay (Visa)',
    date: '14 Apr 2026, 16:40',
    timeline: [
      { title: 'Printing', time: '15 Apr, 09:00', note: 'Screenprint curing station' },
    ],
  },
  {
    id: '#ORD-8804',
    customerName: 'Grace Kim',
    customerEmail: 'grace.kim@example.com',
    customerPhone: '+1 (555) 890-1235',
    shippingAddress: '23 Omotesando, Shibuya, Tokyo, Japan',
    items: [
      { id: 'li-20', productId: 'PRD-07', productName: 'Brushed Cashmere Beanie', variant: 'Pure Black / One Size', quantity: 2, price: 45.0 },
    ],
    subtotal: 90.0,
    shippingFee: 16.0,
    tax: 0.0,
    total: 106.0,
    paidAmount: 106.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Credit Card (Visa)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489100124',
    date: '14 Apr 2026, 13:15',
    timeline: [
      { title: 'Delivered', time: '16 Apr, 15:45', note: 'Package left at secure locker' },
    ],
  },
  {
    id: '#ORD-8803',
    customerName: 'Henry Cooper',
    customerEmail: 'henry.cooper@example.com',
    customerPhone: '+1 (555) 901-2346',
    shippingAddress: '12 Deansgate, Manchester M3 2NH, UK',
    items: [
      { id: 'li-21', productId: 'PRD-10', productName: 'Raw Denim Carpenter Jean', variant: 'Raw Indigo / 32', quantity: 1, price: 160.0 },
    ],
    subtotal: 160.0,
    shippingFee: 8.0,
    tax: 0.0,
    total: 168.0,
    paidAmount: 0.0,
    refundedAmount: 0.0,
    paymentStatus: 'pending',
    fulfillmentStatus: 'queued',
    paymentMethod: 'Klarna Pay Later',
    date: '14 Apr 2026, 11:00',
    timeline: [
      { title: 'Klarna Verification Pending', time: '14 Apr, 11:00', note: 'Credit approval check in progress' },
    ],
  },
  {
    id: '#ORD-8802',
    customerName: 'Alex Rivera',
    customerEmail: 'alex.rivera@example.com',
    customerPhone: '+1 (555) 012-3457',
    shippingAddress: '55 Ocean Dr, Miami Beach, FL 33139, USA',
    items: [
      { id: 'li-22', productId: 'PRD-01', productName: 'Urbanist Heavyweight Tee', variant: 'Jet Black / M', quantity: 2, price: 48.0 },
    ],
    subtotal: 96.0,
    shippingFee: 6.0,
    tax: 0.0,
    total: 102.0,
    paidAmount: 102.0,
    refundedAmount: 0.0,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Credit Card (Mastercard)',
    carrier: 'DHL Express',
    trackingNumber: 'DHL-489101999',
    date: '13 Apr 2026, 18:20',
    timeline: [
      { title: 'Return Initiated', time: '16 Apr, 10:15', note: 'Customer requested size exchange RET-1092' },
    ],
  },
  {
    id: '#ORD-8801',
    customerName: 'Liam O\'Connor',
    customerEmail: 'liam.oconnor@example.com',
    customerPhone: '+1 (555) 123-4568',
    shippingAddress: '40 Grafton St, Dublin 2, Ireland',
    items: [
      { id: 'li-23', productId: 'PRD-03', productName: 'Minimalist Relaxed Cargo Pant', variant: 'Dark Charcoal / 32', quantity: 1, price: 135.0 },
    ],
    subtotal: 135.0,
    shippingFee: 12.0,
    tax: 0.0,
    total: 147.0,
    paidAmount: 147.0,
    refundedAmount: 147.0,
    paymentStatus: 'refunded',
    fulfillmentStatus: 'delivered',
    paymentMethod: 'Apple Pay (Visa)',
    carrier: 'UPS Standard',
    trackingNumber: 'UPS-102938111',
    date: '12 Apr 2026, 15:10',
    timeline: [
      { title: 'Return Restocked', time: '15 Apr, 14:00', note: 'Inspected and added back to inventory. Refund ₹147 processed.' },
    ],
  },
];

export const initialShipments: ShipmentItem[] = [
  {
    trackingId: 'DHL-489102834',
    orderId: '#ORD-8820',
    carrier: 'DHL Express Worldwide',
    destination: 'Brooklyn, NY, USA',
    pieces: 2,
    dispatchDate: '16 Apr 2026',
    estimatedDelivery: '18 Apr 2026',
    status: 'in_transit',
    events: [
      { time: '16 Apr 2026, 16:10', location: 'New York Gateway', description: 'Shipment received at origin facility' },
      { time: '16 Apr 2026, 21:40', location: 'Cincinnati Hub', description: 'Processed through transit facility' },
      { time: '17 Apr 2026, 06:15', location: 'Brooklyn Delivery Facility', description: 'Arrived at delivery facility' },
    ],
  },
  {
    trackingId: 'FDX-771209381',
    orderId: '#ORD-8813',
    carrier: 'FedEx Priority',
    destination: 'Brisbane QLD, Australia',
    pieces: 2,
    dispatchDate: '16 Apr 2026',
    estimatedDelivery: '19 Apr 2026',
    status: 'in_transit',
    events: [
      { time: '16 Apr 2026, 14:00', location: 'Melbourne Depot', description: 'Departed distribution facility' },
      { time: '17 Apr 2026, 02:30', location: 'Sydney Transit Hub', description: 'International export customs cleared' },
    ],
  },
  {
    trackingId: 'UPS-102938472',
    orderId: '#ORD-8809',
    carrier: 'UPS Ground',
    destination: 'San Francisco, CA, USA',
    pieces: 1,
    dispatchDate: '15 Apr 2026',
    estimatedDelivery: '17 Apr 2026',
    status: 'out_for_delivery',
    events: [
      { time: '15 Apr 2026, 17:10', location: 'Los Angeles Facility', description: 'Origin scan completed' },
      { time: '16 Apr 2026, 07:00', location: 'Oakland Hub', description: 'Departed sorting hub' },
      { time: '17 Apr 2026, 08:15', location: 'San Francisco Hub', description: 'Out for delivery with courier' },
    ],
  },
  {
    trackingId: 'DHL-489101192',
    orderId: '#ORD-8818',
    carrier: 'DHL Express Worldwide',
    destination: 'Paris, France',
    pieces: 1,
    dispatchDate: '15 Apr 2026',
    estimatedDelivery: '17 Apr 2026',
    status: 'delivered',
    events: [
      { time: '15 Apr 2026, 14:00', location: 'Frankfurt Airport Hub', description: 'Departed facility' },
      { time: '16 Apr 2026, 10:00', location: 'Paris Roissy Hub', description: 'Customs cleared' },
      { time: '17 Apr 2026, 11:20', location: 'Paris 75001', description: 'Delivered and signed by recipient' },
    ],
  },
  {
    trackingId: 'DHL-489101999',
    orderId: '#ORD-8802',
    carrier: 'DHL Express Worldwide',
    destination: 'Miami Beach, FL, USA',
    pieces: 1,
    dispatchDate: '13 Apr 2026',
    estimatedDelivery: '15 Apr 2026',
    status: 'exception',
    events: [
      { time: '14 Apr 2026, 12:00', location: 'Miami Gateway', description: 'Customer requested address correction' },
    ],
  },
];

export const initialRefunds: RefundItem[] = [
  {
    id: 'REF-2041',
    orderId: '#ORD-8815',
    customer: 'Lucas Taylor',
    reason: 'Customer cancellation prior to printing',
    amount: 147.0,
    method: 'Original Payment (Visa)',
    date: '16 Apr 2026',
    status: 'completed',
  },
  {
    id: 'REF-2040',
    orderId: '#ORD-8807',
    customer: 'Daniel Harris',
    reason: 'Carrier delay goodwill compensation',
    amount: 50.0,
    method: 'Original Payment (Visa)',
    date: '16 Apr 2026',
    status: 'completed',
  },
  {
    id: 'REF-2039',
    orderId: '#ORD-8801',
    customer: 'Liam O\'Connor',
    reason: 'RMA restock completion',
    amount: 147.0,
    method: 'Apple Pay (Visa)',
    date: '15 Apr 2026',
    status: 'completed',
  },
  {
    id: 'REF-2038',
    orderId: '#ORD-8762',
    customer: 'Michael Chang',
    reason: 'Defective hem stitching on sleeve',
    amount: 84.5,
    method: 'Store Credit',
    date: '14 Apr 2026',
    status: 'processing',
  },
];

export const initialReturns: ReturnItem[] = [
  {
    id: 'RET-1092',
    orderId: '#ORD-8802',
    customer: 'Alex Rivera',
    items: 'Urbanist Heavyweight Tee (M) × 2',
    trackingNumber: 'TRK-99281726',
    carrier: 'DHL Express',
    stage: 'in_transit',
    date: '16 Apr 2026',
    reason: 'Size exchange needed (requested L)',
  },
  {
    id: 'RET-1091',
    orderId: '#ORD-8780',
    customer: 'Chloe Zhao',
    items: 'Signature Boxy Hoodie (L)',
    trackingNumber: 'TRK-99281512',
    carrier: 'FedEx Ground',
    stage: 'inspected',
    date: '15 Apr 2026',
    reason: 'Color differs from studio photography',
  },
  {
    id: 'RET-1090',
    orderId: '#ORD-8801',
    customer: 'Liam O\'Connor',
    items: 'Relaxed Cargo Pant (32)',
    trackingNumber: 'TRK-99280911',
    carrier: 'UPS Standard',
    stage: 'restocked',
    date: '14 Apr 2026',
    reason: 'Did not match sizing chart fit expectation',
  },
  {
    id: 'RET-1089',
    orderId: '#ORD-8704',
    customer: 'Marcus Bennett',
    items: 'Core Crewneck Sweatshirt (XL)',
    trackingNumber: 'TRK-99279820',
    carrier: 'USPS Priority',
    stage: 'disputed',
    date: '12 Apr 2026',
    reason: 'Returned garment exhibits perfume odor and tag removal',
  },
];

export const initialCustomers: CustomerItem[] = [
  {
    id: 'CUST-01',
    name: 'Sophia Anderson',
    email: 'sophia.anderson@example.com',
    phone: '+1 (555) 234-8901',
    totalOrders: 14,
    totalSpent: 1840.5,
    tier: 'VIP Customer',
    address: '482 Mercer St, Apt 4B',
    city: 'New York, NY',
    country: 'United States',
    joinedDate: 'Jan 12, 2025',
    notes: ['Prefers minimal packaging with zero plastic.', 'Member of private preview club.'],
  },
  {
    id: 'CUST-02',
    name: 'Jessica Smith',
    email: 'jessichasmith94@gmail.com',
    phone: '+1 (555) 345-6789',
    totalOrders: 8,
    totalSpent: 920.0,
    tier: 'Active',
    address: '104 W 14th St',
    city: 'New York, NY',
    country: 'United States',
    joinedDate: 'Mar 04, 2025',
    notes: ['Requested size notification for Cargo Pants in Charcoal.'],
  },
  {
    id: 'CUST-03',
    name: 'Michael Chang',
    email: 'm.chang@outlook.com',
    phone: '+1 (555) 456-7890',
    totalOrders: 5,
    totalSpent: 640.2,
    tier: 'Active',
    address: '88 King St E',
    city: 'Toronto, ON',
    country: 'Canada',
    joinedDate: 'Jun 19, 2025',
    notes: ['Enjoys oversized fit. Usually orders L/XL.'],
  },
  {
    id: 'CUST-04',
    name: 'Elena Rostova',
    email: 'elena.rostova@design.co',
    phone: '+44 20 7946 0912',
    totalOrders: 19,
    totalSpent: 2780.0,
    tier: 'VIP Customer',
    address: '22 Kensington High St',
    city: 'London',
    country: 'United Kingdom',
    joinedDate: 'Nov 02, 2024',
    notes: ['VIP architect client. Send seasonal lookbook hardcopy.'],
  },
  {
    id: 'CUST-05',
    name: 'David Kim',
    email: 'david.kim@studio.kr',
    phone: '+82 2 3456 7890',
    totalOrders: 2,
    totalSpent: 210.0,
    tier: 'New',
    address: '15 Teheran-ro',
    city: 'Seoul',
    country: 'South Korea',
    joinedDate: 'Apr 02, 2026',
    notes: ['First international order arrived on time.'],
  },
];

export const initialSupportTickets: SupportTicket[] = [
  {
    id: 'TICK-401',
    customerName: 'Marcus Bennett',
    customerEmail: 'marcus.bennett@example.com',
    subject: 'RMA dispute regarding tag removal on Core Crewneck',
    priority: 'high',
    status: 'open',
    createdAt: '16 Apr 2026, 11:20',
    messages: [
      { sender: 'customer', text: 'I received an email stating my return was rejected due to missing tags. The tag was loose in the bag.', time: '16 Apr, 11:20' },
      { sender: 'staff', text: 'Hi Marcus, thank you for reaching out. We are inspecting the item again with the QA shift supervisor.', time: '16 Apr, 12:05' },
    ],
  },
  {
    id: 'TICK-402',
    customerName: 'Ava Wilson',
    customerEmail: 'ava.wilson@example.com',
    subject: 'Bank transfer wire instructions verification',
    priority: 'medium',
    status: 'pending',
    createdAt: '16 Apr 2026, 13:00',
    messages: [
      { sender: 'customer', text: 'I completed the bank wire for #ORD-8816. Could you confirm receipt?', time: '16 Apr, 13:00' },
    ],
  },
  {
    id: 'TICK-403',
    customerName: 'Oliver Davis',
    customerEmail: 'oliver.davis@example.com',
    subject: 'Inquiry regarding partner sync delay for #ORD-8817',
    priority: 'medium',
    status: 'open',
    createdAt: '16 Apr 2026, 14:10',
    messages: [
      { sender: 'customer', text: 'My order has been sitting in submission failed status. Is everything alright with my items?', time: '16 Apr, 14:10' },
    ],
  },
  {
    id: 'TICK-404',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@design.co',
    subject: 'Private preview request for Autumn/Winter drop',
    priority: 'low',
    status: 'resolved',
    createdAt: '15 Apr 2026, 09:30',
    messages: [
      { sender: 'customer', text: 'Hello, when will the AW26 lookbook look passcodes be sent out?', time: '15 Apr, 09:30' },
      { sender: 'staff', text: 'Hi Elena, the invitations have been scheduled for dispatch this Thursday. Thank you for being a valued VIP member!', time: '15 Apr, 10:15' },
    ],
  },
];

export const initialCollections: CollectionItem[] = [
  {
    id: 'COL-01',
    name: 'Autumn/Winter Urban Minimal',
    slug: 'aw-urban-minimal',
    season: 'AW26',
    productCount: 24,
    visibility: 'published',
    updatedAt: '16 Apr 2026',
    description: 'Structured silhouettes in heavyweight cottons, gabardine wools, and muted slate palettes.',
  },
  {
    id: 'COL-02',
    name: 'Core Heavyweight Basics',
    slug: 'core-heavyweight-basics',
    season: 'Perennial',
    productCount: 18,
    visibility: 'published',
    updatedAt: '12 Apr 2026',
    description: 'High-density French terry and combed jersey fundamentals designed to last seasons.',
  },
  {
    id: 'COL-03',
    name: 'Unplugged Monochrome Series',
    slug: 'unplugged-monochrome',
    season: 'Limited Edition',
    productCount: 12,
    visibility: 'scheduled',
    updatedAt: '10 Apr 2026',
    description: 'Experimental audio-visual soundwave screenprints in pitch black and optical white.',
  },
  {
    id: 'COL-04',
    name: 'Summer Archival Restock',
    slug: 'summer-archival',
    season: 'SS26',
    productCount: 9,
    visibility: 'draft',
    updatedAt: '05 Apr 2026',
    description: 'Archived lightweight resort silhouettes and relaxed drop-shoulder linen blends.',
  },
];

export const initialDesigns: DesignAsset[] = [
  {
    id: 'DSN-301',
    name: 'Unplugged Soundwave Motif',
    category: 'Print Artwork',
    designer: 'Sora Tanaka',
    placement: 'Back Chest / Oversized Screenprint',
    dimensions: '380mm × 460mm',
    fileFormat: 'Vector SVG (Pantone Black 6C)',
    fileSize: '4.8 MB',
    status: 'approved',
    updatedAt: '16 Apr 2026',
  },
  {
    id: 'DSN-302',
    name: 'Minimal Monogram TUW 26',
    category: 'Embroidery',
    designer: 'Sora Tanaka',
    placement: 'Left Chest (45mm)',
    dimensions: '45mm × 45mm (8,400 stitches)',
    fileFormat: 'DST / PES Digitized',
    fileSize: '1.2 MB',
    status: 'approved',
    updatedAt: '14 Apr 2026',
  },
  {
    id: 'DSN-303',
    name: 'Metropolitan Gradient Typo',
    category: 'Typography',
    designer: 'Elena Rostova',
    placement: 'Sleeve Length Print',
    dimensions: '60mm × 320mm',
    fileFormat: 'Adobe Illustrator (AI)',
    fileSize: '12.4 MB',
    status: 'in_review',
    updatedAt: '12 Apr 2026',
  },
  {
    id: 'DSN-304',
    name: 'Organic Cotton Care Label V2',
    category: 'Label Spec',
    designer: 'Ronan Vance',
    placement: 'Interior Hem Woven Label',
    dimensions: '30mm × 65mm',
    fileFormat: 'Vector PDF',
    fileSize: '820 KB',
    status: 'approved',
    updatedAt: '08 Apr 2026',
  },
  {
    id: 'DSN-305',
    name: 'Geometric Grid Distortion',
    category: 'Print Artwork',
    designer: 'Sora Tanaka',
    placement: 'Front Chest (220mm)',
    dimensions: '220mm × 220mm',
    fileFormat: 'Vector SVG',
    fileSize: '3.1 MB',
    status: 'in_review',
    updatedAt: '04 Apr 2026',
  },
  {
    id: 'DSN-306',
    name: 'Archival Stamp Typo Logo',
    category: 'Typography',
    designer: 'Elena Rostova',
    placement: 'Nape Collar Print',
    dimensions: '40mm × 15mm',
    fileFormat: 'Vector SVG',
    fileSize: '450 KB',
    status: 'approved',
    updatedAt: '01 Apr 2026',
  },
];

export const initialTeam: TeamMember[] = [
  {
    id: 'MEM-01',
    name: 'Ronan Vance',
    email: 'ronan@theunpluggedwear.com',
    role: 'Owner',
    status: 'active',
    lastActive: 'Just now',
    avatarBg: '#7539FF',
  },
  {
    id: 'MEM-02',
    name: 'Elena Rostova',
    email: 'elena.r@theunpluggedwear.com',
    role: 'Content',
    status: 'active',
    lastActive: '12m ago',
    avatarBg: '#187343',
  },
  {
    id: 'MEM-03',
    name: 'Tariq Mansoor',
    email: 'tariq@theunpluggedwear.com',
    role: 'Operations',
    status: 'active',
    lastActive: '1h ago',
    avatarBg: '#175CD3',
  },
  {
    id: 'MEM-04',
    name: 'Sora Tanaka',
    email: 'sora.t@theunpluggedwear.com',
    role: 'Content',
    status: 'active',
    lastActive: '3h ago',
    avatarBg: '#856300',
  },
  {
    id: 'MEM-05',
    name: 'Jessica Miller',
    email: 'jessica.m@theunpluggedwear.com',
    role: 'Read-only',
    status: 'invited',
    lastActive: 'Pending invite',
    avatarBg: '#90979F',
  },
];

export interface StoreSettings {
  storeName: string;
  legalEntity: string;
  supportEmail: string;
  defaultCurrency: string;
  timezone: string;
  brandTagline: string;
  brandColor: string;
  qikinkApiKey: string;
  qikinkEnvironment: 'sandbox' | 'production';
  stripeLiveMode: boolean;
  freeShippingThreshold: number;
  standardShippingFee: number;
  taxIncluded: boolean;
  orderNotificationEmail: string;
  showCollapsedBadgeDots: boolean;
}

export const initialSettings: StoreSettings = {
  storeName: 'The Unplugged Wear',
  legalEntity: 'The Unplugged Wear Apparel LLC',
  supportEmail: 'care@theunpluggedwear.com',
  defaultCurrency: 'USD ($)',
  timezone: 'UTC+00:00 (London, Edinburgh)',
  brandTagline: 'Unplugged Luxury & Urban Minimalism',
  brandColor: '#7539FF',
  qikinkApiKey: 'qik_live_mock_connection_89172',
  qikinkEnvironment: 'sandbox',
  stripeLiveMode: false,
  freeShippingThreshold: 150,
  standardShippingFee: 12,
  taxIncluded: true,
  orderNotificationEmail: 'orders@theunpluggedwear.com',
  showCollapsedBadgeDots: false,
};
