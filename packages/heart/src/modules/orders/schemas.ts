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
