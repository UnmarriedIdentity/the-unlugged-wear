import { z } from 'zod';

const lineId = z.string().uuid();
const productRef = z.string().trim().min(1).max(100);
/** Local path or https only — a preview is shown to staff and printed from. */
const previewUrl = z.string().trim().max(2048).refine((u) => /^\/(?!\/)/.test(u) || /^https:\/\//i.test(u), 'Previews must be a /path or an https URL');

export const addLine = z.object({
  productId: productRef,
  color: z.string().trim().max(150).optional(),
  size: z.string().trim().max(150).optional(),
  qty: z.number().int('Choose a whole number').min(1, 'Choose at least 1').max(100, 'Choose at most 100'),
  personalization: z.object({ monogram: z.string().trim().max(30).optional(), placement: z.string().trim().max(50).optional() }).optional(),
  previewImageUrl: previewUrl.optional(),
});
export const setQty = z.object({ lineId, qty: z.number().int().min(0).max(100) });
export const changeVariant = z.object({ lineId, color: z.string().trim().max(150).optional(), size: z.string().trim().max(150).optional() });
export const removeLines = z.object({ lineIds: z.array(lineId).max(100) });
export const lineRef = z.object({ lineId });
export const wishlistToggle = z.object({ productId: productRef, saved: z.boolean() });
