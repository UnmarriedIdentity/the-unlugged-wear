import 'server-only';
import { sql } from 'drizzle-orm';
import type { Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import type { DiscountRule } from './pricing.ts';

// Discount codes (DOC/backend/06). Checked against the database at checkout;
// a use is counted with one atomic UPDATE, so the last use cannot be spent twice.

type Db = Pick<Transaction, 'execute'>;

export interface DiscountCode { id: string; code: string; rule: DiscountRule; minOrderPaise: number | null }

const refuse = (message: string) => new AppError('RULE_VIOLATION', message, [{ field: 'discountCode', message }]);

/** A usable code, or a clear reason it is not. Codes are case-insensitive. */
export async function findDiscount(db: Db, rawCode: string, subtotalPaise: number): Promise<DiscountCode> {
  const code = rawCode.trim().toUpperCase();
  const { rows } = await db.execute<{ id: string; code: string; discount_type: 'percent' | 'fixed'; value: string; min_order_amount: string | null; max_uses: number | null; uses_count: number; starts_at: string | null; ends_at: string | null; is_active: boolean }>(
    sql`SELECT id, code, discount_type, value, min_order_amount, max_uses, uses_count, starts_at, ends_at, is_active FROM discount_codes WHERE upper(code) = ${code} LIMIT 1`);
  const d = rows[0];
  const now = Date.now();
  if (!d || !d.is_active) throw refuse('That code is not valid.');
  if (d.starts_at && new Date(d.starts_at).getTime() > now) throw refuse('That code is not active yet.');
  if (d.ends_at && new Date(d.ends_at).getTime() <= now) throw refuse('That code has expired.');
  if (d.max_uses !== null && d.uses_count >= d.max_uses) throw refuse('That code has been fully used.');
  const minOrderPaise = d.min_order_amount === null ? null : Math.round(Number(d.min_order_amount) * 100);
  if (minOrderPaise !== null && subtotalPaise < minOrderPaise) throw refuse(`That code needs an order of at least ₹${(minOrderPaise / 100).toLocaleString('en-IN')}.`);
  const rule: DiscountRule = d.discount_type === 'percent' ? { type: 'percent', percent: Number(d.value) } : { type: 'fixed', paise: Math.round(Number(d.value) * 100) };
  return { id: d.id, code: d.code, rule, minOrderPaise };
}

/** Counts one use, refusing if the last use went to someone else a moment ago. */
export async function redeemDiscount(tx: Transaction, id: string): Promise<void> {
  const { rowCount } = await tx.execute(sql`UPDATE discount_codes SET uses_count = uses_count + 1, updated_at = now()
    WHERE id = ${id} AND is_active AND (max_uses IS NULL OR uses_count < max_uses)`);
  if (!rowCount) throw refuse('That code has just been fully used.');
}
