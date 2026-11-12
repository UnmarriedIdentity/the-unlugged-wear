import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toPaise, toRupees } from '../../platform/money/index.ts';
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

// Staff management of codes (/discounts). A used code is history: it can be
// switched off but never deleted, so past orders keep their reason.

export interface AdminDiscountCode {
  id: string; code: string; discountType: 'percent' | 'fixed'; value: number; minOrderAmount: number | null; maxUses: number | null;
  usesCount: number; startsAt: string | null; endsAt: string | null; isActive: boolean; createdAt: string;
}

export interface DiscountInput {
  code: string; discountType: 'percent' | 'fixed'; value: number; minOrderAmount?: number | null; maxUses?: number | null;
  startsAt?: string | null; endsAt?: string | null; isActive: boolean;
}

export async function adminListDiscounts(): Promise<AdminDiscountCode[]> {
  const { rows } = await getDb().execute<{ id: string; code: string; discount_type: 'percent' | 'fixed'; value: string; min_order_amount: string | null; max_uses: number | null; uses_count: number; starts_at: string | null; ends_at: string | null; is_active: boolean; created_at: string }>(
    sql`SELECT id, code, discount_type, value, min_order_amount, max_uses, uses_count, starts_at, ends_at, is_active, created_at FROM discount_codes ORDER BY created_at DESC, id DESC`);
  return rows.map((r) => ({
    id: r.id, code: r.code, discountType: r.discount_type, value: Number(r.value), minOrderAmount: r.min_order_amount === null ? null : Number(r.min_order_amount),
    maxUses: r.max_uses, usesCount: r.uses_count, startsAt: r.starts_at ? new Date(r.starts_at).toISOString() : null, endsAt: r.ends_at ? new Date(r.ends_at).toISOString() : null,
    isActive: r.is_active, createdAt: new Date(r.created_at).toISOString(),
  }));
}

const fieldError = (field: string, message: string) => new AppError('VALIDATION_FAILED', message, [{ field, message }]);

export async function adminCreateDiscount(input: DiscountInput, actorId: string): Promise<AdminDiscountCode[]> {
  const code = input.code.trim().toUpperCase();
  if (input.discountType === 'percent' && (input.value <= 0 || input.value > 100)) throw fieldError('value', 'A percent code runs from 1 to 100.');
  if (input.startsAt && input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw fieldError('endsAt', 'The end must be after the start.');
  const id = uuidv7();
  try {
    await withTransaction(async (tx) => {
      await tx.execute(sql`INSERT INTO discount_codes (id, code, discount_type, value, min_order_amount, max_uses, starts_at, ends_at, is_active)
        VALUES (${id}, ${code}, ${input.discountType}, ${input.discountType === 'percent' ? String(input.value) : toRupees(toPaise(input.value))},
          ${input.minOrderAmount == null ? null : toRupees(toPaise(input.minOrderAmount))}, ${input.maxUses ?? null}, ${input.startsAt || null}, ${input.endsAt || null}, ${input.isActive})`);
      await recordAudit(tx, { actorId, action: 'discount.create', entity: 'discount_codes', entityId: id, diff: { code: { from: null, to: code } } });
    });
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === '23505') throw new AppError('CONFLICT', `"${code}" already exists.`, [{ field: 'code', message: 'That code already exists.' }]);
    throw error;
  }
  return adminListDiscounts();
}

export async function adminSetDiscountActive(id: string, isActive: boolean, actorId: string): Promise<AdminDiscountCode[]> {
  await withTransaction(async (tx) => {
    const { rowCount } = await tx.execute(sql`UPDATE discount_codes SET is_active = ${isActive}, updated_at = now() WHERE id = ${id}`);
    if (!rowCount) throw new AppError('NOT_FOUND', 'That code does not exist.');
    await recordAudit(tx, { actorId, action: 'discount.update', entity: 'discount_codes', entityId: id, diff: { isActive: { from: !isActive, to: isActive } } });
  });
  return adminListDiscounts();
}

export async function adminDeleteDiscount(id: string, actorId: string): Promise<AdminDiscountCode[]> {
  await withTransaction(async (tx) => {
    const { rows: [d] } = await tx.execute<{ code: string; uses_count: number; orders: number }>(sql`
      SELECT code, uses_count, (SELECT count(*)::int FROM orders WHERE discount_code_id = ${id}) AS orders FROM discount_codes WHERE id = ${id} FOR UPDATE`);
    if (!d) throw new AppError('NOT_FOUND', 'That code does not exist.');
    if (d.uses_count > 0 || d.orders > 0) throw new AppError('RULE_VIOLATION', `"${d.code}" has been used. Switch it off instead, so past orders keep their record.`);
    await tx.execute(sql`DELETE FROM discount_codes WHERE id = ${id}`);
    await recordAudit(tx, { actorId, action: 'discount.delete', entity: 'discount_codes', entityId: id, diff: { code: { from: d.code, to: null } } });
  });
  return adminListDiscounts();
}

