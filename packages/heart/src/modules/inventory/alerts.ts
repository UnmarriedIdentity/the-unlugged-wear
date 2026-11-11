import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { processClaimed, type JobResult } from '../../platform/jobs/index.ts';
import { getEmailSender } from '../../integrations/email/index.ts';
import { MADE_TO_ORDER_PARTNERS } from './stock.ts';

// "Notify me when back in stock" (DOC/backend/22). Requests are rows and the
// job reads them, so a crash between a restock and an email loses nothing.

/** Stops one address being signed up for the whole catalogue. */
export const MAX_WAITING_PER_EMAIL = 25;

const JOB_BATCH = 50;
const NO_VARIANT = '00000000-0000-0000-0000-000000000000';
const PARTNERS = MADE_TO_ORDER_PARTNERS.map((p) => `'${p}'`).join(', ');

/** Is this product (or one variant of it) buyable right now? `s` aliases the row holding variant_id. */
const availableSql = (variantRef: string) => `
  CASE WHEN p.partner_provider IN (${PARTNERS})
    THEN p.partner_availability = 'ready_to_print' AND EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active AND (${variantRef} IS NULL OR v.id = ${variantRef}))
    ELSE EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.is_active AND v.stock > 0 AND (${variantRef} IS NULL OR v.id = ${variantRef}))
  END`;

export interface BackInStockRequest { productId: string; variantId: string | null; email: string; userId?: string | null }

/** The answer is the same whether or not this address was already waiting. */
export async function requestBackInStock(input: BackInStockRequest): Promise<void> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const { rows } = await db.execute<{ available: boolean }>(sql`
    SELECT (${sql.raw(availableSql('x.variant_id'))}) AS available
    FROM products p CROSS JOIN (SELECT ${input.variantId}::uuid AS variant_id) x
    WHERE p.id = ${input.productId} AND p.status = 'active' AND p.deleted_at IS NULL`);
  if (!rows[0]) throw new AppError('NOT_FOUND', 'That product is not available.');
  if (rows[0].available) throw new AppError('RULE_VIOLATION', 'Good news: this is in stock now.');
  const { rows: waiting } = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM stock_alert_subscriptions WHERE lower(email) = ${email} AND status = 'waiting'`);
  if (waiting[0]!.n >= MAX_WAITING_PER_EMAIL) throw new AppError('RATE_LIMITED', 'This email is already waiting on a lot of items.');
  await db.execute(sql`INSERT INTO stock_alert_subscriptions (id, product_id, variant_id, user_id, email)
    VALUES (${uuidv7()}, ${input.productId}, ${input.variantId}, ${input.userId ?? null}, ${email})
    ON CONFLICT (lower(email), product_id, COALESCE(variant_id, ${sql.raw(`'${NO_VARIANT}'::uuid`)})) WHERE status = 'waiting' DO NOTHING`);
}

/** Job `inventory.notifyRestocked`: safe to run twice, and from two runners at once. */
export function notifyRestocked(): Promise<JobResult> {
  return processClaimed<{ id: string; email: string; name: string; slug: string }>(
    `SELECT s.id, s.email, p.name, p.slug
       FROM stock_alert_subscriptions s JOIN products p ON p.id = s.product_id
      WHERE s.status = 'waiting' AND p.status = 'active' AND p.deleted_at IS NULL AND (${availableSql('s.variant_id')})
      ORDER BY s.created_at LIMIT $1 FOR UPDATE OF s SKIP LOCKED`,
    [JOB_BATCH],
    async (row, client) => {
      await getEmailSender().send({
        to: row.email,
        subject: `${row.name} is back in stock`.slice(0, 255),
        template: 'stock.back_in_stock',
        link: `${process.env.STOREFRONT_URL ?? ''}/products/${row.slug}`,
        dedupeKey: `stock.back:${row.id}`,
      });
      await client.query(`UPDATE stock_alert_subscriptions SET status = 'notified', notified_at = now(), updated_at = now() WHERE id = $1`, [row.id]);
    },
  );
}
