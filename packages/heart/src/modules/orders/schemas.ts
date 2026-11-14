import { z } from 'zod';

const phone = z.string().trim().transform((v) => v.replace(/[\s-]/g, '')).refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), 'Enter a 10-digit Indian mobile number');

export const shippingAddress = z.object({
  fullName: z.string().trim().min(1, 'Enter the name for delivery').max(150),
  line1: z.string().trim().min(3, 'Enter the street address').max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, 'Enter the city').max(100),
  state: z.string().trim().min(2, 'Enter the state').max(100),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a 6-digit PIN code'),
  country: z.literal('India', { errorMap: () => ({ message: 'We deliver within India only' }) }),
  phone,
});
export type ShippingAddress = z.infer<typeof shippingAddress>;

/** Checkout form. Lines come from the bag on the server, never from here. */
export const placeOrder = z.object({
  /** One per checkout attempt, reused on retries: the same key returns the same order. */
  checkoutKey: z.string().uuid('Reload the page and try again'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(255).optional(),
  shippingAddress,
  speed: z.enum(['standard', 'express']).default('standard'),
  method: z.enum(['card', 'upi', 'cod']),
  discountCode: z.string().trim().toUpperCase().max(50).optional(),
  /** Demo gateway only: exercise the decline path. */
  simulate: z.literal('decline').optional(),
});
export type PlaceOrderInput = z.infer<typeof placeOrder>;

export const discountPreview = z.object({ code: z.string().trim().toUpperCase().min(1, 'Enter a code').max(50) });
export const orderRef = z.object({ orderNumber: z.string().trim().max(30) });
export const receiptRef = orderRef.extend({ receipt: z.string().max(64).optional() });

const status = z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded']);
export const adminList = z.object({
  q: z.string().trim().max(100).optional(),
  tab: z.enum(['all', 'unfulfilled', 'unpaid', 'cancelled', 'finished']).default('all'),
  page: z.number().int().min(1).max(100_000).default(1),
  perPage: z.number().int().min(1).max(5000).default(20),
});
export const adminStatus = z.object({ orderNumber: z.string().trim().max(30), to: status, note: z.string().trim().max(500).optional() });
export const adminBulkStatus = z.object({ orderNumbers: z.array(z.string().trim().max(30)).min(1).max(200), to: status });
export const trackOrder = z.object({ orderNumber: z.string().trim().min(5, 'Enter your order number').max(30), email: z.string().trim().email('Enter the email used for the order').max(255) });

const rupees = z.number().finite().min(0).max(10_000_000).refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Use at most 2 decimal places');
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date');
export const discountCreate = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{2,49}$/, 'Use 3–50 letters, numbers, dashes or underscores'),
  discountType: z.enum(['percent', 'fixed']),
  value: rupees.refine((v) => v > 0, 'The value must be above zero'),
  minOrderAmount: rupees.nullable().optional(),
  maxUses: z.number().int().min(1).max(10_000_000).nullable().optional(),
  startsAt: isoDate.nullable().optional(),
  endsAt: isoDate.nullable().optional(),
  isActive: z.boolean().default(true),
});
export const discountToggle = z.object({ id: z.string().uuid(), isActive: z.boolean() });
export const discountRef = z.object({ id: z.string().uuid() });

export const refundIssue = z.object({
  orderNumber: z.string().trim().max(30),
  amount: rupees.refine((v) => v > 0, 'Enter an amount above zero'),
  reason: z.string().trim().min(3, 'Give a reason for the refund').max(255),
  method: z.enum(['source', 'upi', 'bank_transfer']),
  /** UPI id or bank account for a cash-on-delivery payout; only a masked copy is stored. */
  destination: z.string().trim().max(60).optional(),
  /** One per staff intent, reused on retries. (The guards reserve the name idempotencyKey.) */
  refundKey: z.string().uuid(),
});
export const refundComplete = z.object({ refundId: z.string().uuid(), payoutReference: z.string().trim().max(30) });
export const refundReject = z.object({ refundId: z.string().uuid(), note: z.string().trim().max(500) });
export const moneyList = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.string().trim().max(20).optional(),
  page: z.number().int().min(1).max(100_000).default(1),
  perPage: z.number().int().min(1).max(5000).default(20),
});

