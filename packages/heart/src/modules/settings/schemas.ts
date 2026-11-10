import { z } from 'zod';

// Action inputs. Field-level rules live in keys.ts (one per setting).
export const group = z.enum(['general', 'brand', 'shipping', 'taxes', 'policies', 'notifications']);
export const save = z.object({ group, values: z.record(z.string(), z.unknown()) });
