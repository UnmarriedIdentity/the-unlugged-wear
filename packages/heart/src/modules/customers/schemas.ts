import { z } from 'zod';

const name = z.string().trim().min(1, 'Required').max(100);
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const phone = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable()
  .transform((v) => (v ? v.replace(/[\s-]/g, '') : null))
  .refine((v) => v === null || /^(\+91)?[6-9][0-9]{9}$/.test(v), 'Enter a 10-digit Indian mobile number');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional().nullable().transform((v) => v || null);

export const profile = z.object({ firstName: name, lastName: z.string().trim().max(100).default(''), phone, dateOfBirth: date });
export const address = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['shipping', 'billing']).default('shipping'),
  label: optionalText(50),
  recipientName: z.string().trim().min(1, 'Enter the recipient name').max(120),
  phone,
  line1: z.string().trim().min(1, 'Enter the street address').max(255),
  line2: optionalText(255),
  city: z.string().trim().min(1, 'Enter the city').max(100),
  state: optionalText(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default('IN'),
  isDefault: z.coerce.boolean().optional(),
});
export const addressId = z.object({ addressId: z.string().uuid() });
export const member = z.object({ firstName: name, lastName: z.string().trim().max(100).default(''), dateOfBirth: date });
export const memberUpdate = member.extend({ profileId: z.string().uuid() });
export const memberRef = z.object({ profileId: z.string().uuid() });
export const memberRole = z.object({ profileId: z.string().uuid(), role: z.enum(['manager', 'member']) });
export const householdInvite = z.object({ email: z.string().trim().email().max(255) });
export const householdAccept = z.object({ token: z.string().min(20).max(200) });
export const inviteRef = z.object({ inviteId: z.string().uuid() });
export const customerList = z.object({ q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).max(10_000).optional(), perPage: z.coerce.number().int().min(1).max(100).optional() });
export const note = z.object({ profileId: z.string().uuid(), note: z.string().max(2000) });
