import { z } from 'zod';

/** Public "notify me" form. A size and colour pick one variant; neither means any variant. */
export const backInStock = z.object({
  productId: z.string().uuid(),
  color: z.string().trim().max(150).optional(),
  size: z.string().trim().max(150).optional(),
  email: z.string().trim().email('Enter a valid email address').max(255),
});
