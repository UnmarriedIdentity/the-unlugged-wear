import { z } from 'zod';

// Admin action inputs for the catalog module (rupee numbers at this edge,
// converted to exact strings/paise in the service).

const money = z.number({ invalid_type_error: 'Enter an amount in rupees' }).finite().min(0, 'Amounts cannot be negative').max(10_000_000, 'That amount is too large')
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use at most 2 decimal places');
const optionalText = (max: number) => z.string().trim().max(max).optional();
const slug = z.string().trim().toLowerCase().max(280).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes');
/** Local path or http(s) only — never javascript: or data: URLs. */
const imageUrl = z.string().trim().max(2048).refine((u) => /^\/(?!\/)/.test(u) || /^https?:\/\//i.test(u), 'Images must be a /path or an http(s) URL');
const uuid = z.string().uuid();

const variant = z.object({
  id: z.string().max(100).optional(),
  color: z.string().trim().max(150),
  size: z.string().trim().min(1, 'Every variant needs a size').max(150),
  sku: z.string().trim().max(64).optional(),
  price: money,
  priceOverridden: z.boolean().optional(),
  stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(1_000_000),
  /** The stock the editor loaded; the change from it is what gets applied. */
  loadedStock: z.number().int().min(0).max(1_000_000).optional(),
  weight: optionalText(30),
  shippingWeight: optionalText(30),
  dimensions: optionalText(50),
});

const attribute = z.object({
  name: z.string().trim().min(1).max(100),
  values: z.array(z.string().trim().min(1).max(150)).max(500),
  displayType: z.enum(['pill', 'swatch', 'radio']).default('pill'),
  swatchHex: z.record(z.string(), z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex colour')).default({}),
});

const discount = z.object({
  discountType: z.enum(['percent', 'fixed']),
  value: money,
  startsAt: z.string().min(1, 'Set a start date'),
  endsAt: z.string().min(1, 'Set an end date'),
  isActive: z.boolean(),
}).refine((d) => d.discountType !== 'percent' || d.value <= 100, { message: 'A percent discount cannot exceed 100', path: ['value'] })
  .refine((d) => !Number.isNaN(Date.parse(d.startsAt)) && !Number.isNaN(Date.parse(d.endsAt)) && Date.parse(d.endsAt) > Date.parse(d.startsAt), { message: 'The end date must be after the start date', path: ['endsAt'] });

export const productFields = z.object({
  name: z.string().trim().min(1, 'Enter a product name').max(255),
  slug: z.union([slug, z.literal('')]).default(''),
  category: z.string().trim().max(150).default(''),
  price: money,
  basePrice: money.optional(),
  priceAdjustments: z.record(z.string().max(300), money).optional(),
  compareAtPrice: money.optional(),
  stock: z.number().int().min(0).max(1_000_000).default(0),
  colors: z.array(z.string().trim().min(1).max(150)).max(200).default([]),
  sizes: z.array(z.string().trim().min(1).max(150)).max(200).default([]),
  partner: z.enum(['Qikink Direct API', 'Printrove Hub', 'Custom Atelier']),
  publicationStatus: z.enum(['published', 'draft', 'archived']),
  description: z.string().max(20_000).default(''),
  styleCode: optionalText(50),
  internalSerialNo: z.number().int().positive().optional(),
  weight: optionalText(30),
  shippingWeight: optionalText(30),
  dimensions: optionalText(50),
  gender: z.enum(['Female', 'Male', 'Unisex', 'Kids', 'Boy', 'Girl']).optional(),
  taxRate: z.number().min(0, 'Tax cannot be negative').max(28, 'GST cannot exceed 28%').optional(),
  hsnCode: z.string().trim().regex(/^[0-9]{4,8}$/, 'HSN must be 4–8 digits').optional(),
  photoSettings: z.object({ layout: z.enum(['grid', 'carousel', 'spotlight']), ratio: z.enum(['1:1', '4:3', '16:9']), showPhotos: z.boolean() }).optional(),
  discounts: z.array(discount).max(50).default([]),
  images: z.array(imageUrl).max(100).default([]),
  variants: z.array(variant).max(5000).optional(),
  attributes: z.array(attribute).max(50).default([]),
  fabricGsm: optionalText(255),
  cut: optionalText(255),
  modelDims: optionalText(255),
  care: optionalText(5000),
  monogram: z.object({ enabled: z.boolean(), maxChars: z.number().int().min(1).max(30), upcharge: money }).optional(),
  sizeChartId: uuid.optional(),
  exchangePolicy: z.enum(['defects_only', 'exchangeable', 'none']).default('defects_only'),
  productKind: z.enum(['physical', 'gift_card']).default('physical'),
  /** Empty uses the store-wide level. */
  lowStockThreshold: z.number().int('Use a whole number').min(0, 'Cannot be negative').max(100_000).optional(),
});
export type ProductInput = z.infer<typeof productFields>;

export const createProduct = productFields;
export const updateProduct = productFields.extend({ id: uuid, expectedUpdatedAt: z.string().optional() });
export const productRef = z.object({ id: uuid });
export const bulkStatus = z.object({ ids: z.array(uuid).min(1).max(500), status: z.enum(['published', 'draft', 'archived']) });
export const bulkDelete = z.object({ ids: z.array(uuid).min(1).max(500) });
export const importRows = z.object({ rows: z.array(z.record(z.string(), z.unknown())).min(1, 'The sheet has no rows').max(5000, 'Import at most 5,000 rows at a time') });

export const collectionFields = z.object({
  name: z.string().trim().min(1, 'Enter a collection name').max(150),
  slug,
  season: z.string().trim().max(50).default(''),
  visibility: z.enum(['published', 'draft', 'scheduled']),
  publishedAt: z.string().optional(),
  description: z.string().max(5000).default(''),
  productIds: z.array(uuid).max(5000).default([]),
}).refine((c) => c.visibility !== 'scheduled' || (c.publishedAt && !Number.isNaN(Date.parse(c.publishedAt))), { message: 'Choose the drop date', path: ['publishedAt'] });
export const saveCollection = z.object({ id: uuid.optional(), collection: collectionFields });

export const categoryFields = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, 'Enter a category name').max(150),
  slug: z.union([slug.refine((s) => s.length <= 180, 'Slug is too long'), z.literal('')]).default(''),
  isActive: z.boolean().default(true),
  showInNavbar: z.boolean().default(false),
  showInMegamenu: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

// Attribute library, size charts, partner SKUs, reviews, search.
const displayType = z.enum(['pill', 'swatch', 'radio']);
export const attributeCreate = z.object({ name: z.string().trim().min(1, 'Enter an attribute name').max(100), displayType: displayType.default('pill') });
export const attributeUpdate = z.object({ id: uuid, enabled: z.boolean().optional(), displayType: displayType.optional(), showOnPdp: z.boolean().optional(), showOnCheckout: z.boolean().optional(), showOnAdmin: z.boolean().optional() });
export const attributeValue = z.object({ id: uuid, value: z.string().trim().min(1, 'Enter a value').max(150) });

/** A measurement in cm: a number, or a range such as "76–86". */
const measure = z.union([z.number().min(0).max(1000), z.string().trim().regex(/^\d+(\.\d+)?\s*[–-]\s*\d+(\.\d+)?$/, 'Use a number or a range like 76–86')]);
export const sizeChartFields = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, 'Enter a chart name').max(150),
  /** Measurement names in display order. */
  columns: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  rows: z.array(z.object({ size: z.string().trim().min(1, 'Every row needs a size').max(50), measures: z.record(z.string().trim().min(1).max(50), measure) })).max(100).default([]),
});

export const mappingSave = z.object({
  productId: uuid,
  rows: z.array(z.object({
    variantId: uuid,
    providerSku: z.string().trim().max(100),
    unitCost: money.nullable().optional(),
    // Strategy B design fields (DOC/backend/16 §6) are stored as sent.
    payload: z.record(z.string().max(50), z.unknown()).default({}),
  })).max(5000),
});

export const reviewSubmit = z.object({
  productId: uuid,
  rating: z.number().int('Choose 1 to 5 stars').min(1, 'Choose 1 to 5 stars').max(5, 'Choose 1 to 5 stars'),
  title: z.string().trim().min(1, 'Add a short headline').max(255),
  body: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(5000),
});
export const reviewModerate = z.object({ id: uuid, approved: z.boolean() });
export const searchQuery = z.object({ q: z.string().max(200) });
