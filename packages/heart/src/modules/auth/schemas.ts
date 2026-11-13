import { z } from 'zod';

// Input schemas shared by both apps' actions (the guards validate with these).
const email = z.string().trim().min(3, 'Enter your email').max(255).email('Enter a valid email');
const password = z.string().min(1, 'Enter your password').max(1024);
const name = z.string().trim().min(1, 'Required').max(100);
const safeNext = z
  .string()
  .optional()
  .transform((v) => (v && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : undefined));

export const login = z.object({ email, password, next: safeNext, remember: z.coerce.boolean().optional() });
export const register = z.object({
  email,
  password,
  firstName: name,
  lastName: z.string().trim().max(100).default(''),
  phone: z.string().trim().max(20).optional().transform((v) => v || undefined),
  next: safeNext,
});
export const forgot = z.object({ email });
export const reset = z.object({ token: z.string().min(20).max(200), password });
export const verify = z.object({ token: z.string().min(20).max(200) });
export const acceptInvite = z.object({ token: z.string().min(20).max(200), password, firstName: name, lastName: name });
export const invite = z.object({ email, role: z.enum(['admin', 'support', 'warehouse']) });
export const setRole = z.object({ userId: z.string().uuid(), role: z.enum(['admin', 'support', 'warehouse']) });
export const setStatus = z.object({ userId: z.string().uuid(), status: z.enum(['active', 'disabled']) });
export const revokeInvite = z.object({ inviteId: z.string().uuid() });
export const changePassword = z.object({ currentPassword: password, newPassword: password });
