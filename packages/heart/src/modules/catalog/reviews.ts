import 'server-only';
import { sql } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb, withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import type { reviewSubmit } from './schemas.ts';

// Reviews. Only people who received the product may write one (a delivered
// order containing it), one per person per product, and nothing shows until
// staff approve it. No seeded or invented reviews, ever.

export interface PublicReview { id: string; author: string; rating: number; title: string; body: string; date: string }
export interface ReviewSummary { count: number; average: number; distribution: Record<1 | 2 | 3 | 4 | 5, number>; reviews: PublicReview[] }

const hasDelivered = (userId: string, productId: string) => sql`
  EXISTS (SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
          WHERE o.placed_by_user_id = ${userId} AND oi.product_id = ${productId} AND o.status = 'delivered')`;

/** "Asha R." — never a full name or an email. */
const displayName = (first: string | null, last: string | null) => `${first?.trim() || 'Customer'}${last?.trim() ? ` ${last.trim().charAt(0).toUpperCase()}.` : ''}`;

export async function approvedReviews(productId: string): Promise<ReviewSummary> {
  const { rows } = await getDb().execute<{ id: string; rating: number; title: string | null; body: string | null; created_at: string; first_name: string | null; last_name: string | null }>(sql`
    SELECT r.id, r.rating, r.title, r.body, r.created_at, pr.first_name, pr.last_name
    FROM reviews r LEFT JOIN profiles pr ON pr.user_id = r.user_id WHERE r.product_id = ${productId} AND r.is_approved ORDER BY r.created_at DESC`);
  const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) distribution[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
  return {
    count: rows.length,
    average: rows.length ? Math.round((rows.reduce((n, r) => n + r.rating, 0) / rows.length) * 10) / 10 : 0,
    distribution,
    reviews: rows.slice(0, 50).map((r) => ({ id: r.id, author: displayName(r.first_name, r.last_name), rating: r.rating, title: r.title ?? '', body: r.body ?? '', date: new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) })),
  };
}

export async function myReviewState(userId: string, productId: string): Promise<{ canReview: boolean; mine: { rating: number; title: string; body: string; approved: boolean } | null }> {
  const db = getDb();
  const [eligible, mine] = await Promise.all([
    db.execute<{ ok: boolean }>(sql`SELECT ${hasDelivered(userId, productId)} AS ok`),
    db.execute<{ rating: number; title: string | null; body: string | null; is_approved: boolean }>(sql`SELECT rating, title, body, is_approved FROM reviews WHERE product_id = ${productId} AND user_id = ${userId}`),
  ]);
  const m = mine.rows[0];
  return { canReview: Boolean(eligible.rows[0]?.ok), mine: m ? { rating: m.rating, title: m.title ?? '', body: m.body ?? '', approved: m.is_approved } : null };
}

/** Editing an approved review sends it back for approval. */
export async function submitReview(userId: string, input: z.infer<typeof reviewSubmit>): Promise<void> {
  await withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ ok: boolean }>(sql`SELECT ${hasDelivered(userId, input.productId)} AS ok FROM products p WHERE p.id = ${input.productId} AND p.deleted_at IS NULL`);
    if (!rows[0]) throw new AppError('NOT_FOUND', 'That product does not exist.');
    if (!rows[0].ok) throw new AppError('FORBIDDEN', 'Reviews are open to customers who have received this product.');
    await tx.execute(sql`INSERT INTO reviews (id, product_id, user_id, rating, title, body) VALUES (${uuidv7()}, ${input.productId}, ${userId}, ${input.rating}, ${input.title}, ${input.body})
      ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title, body = EXCLUDED.body, is_approved = false`);
  });
}

export interface AdminReview { id: string; productId: string; productName: string; author: string; email: string; rating: number; title: string; body: string; approved: boolean; date: string }

export async function adminListReviews(): Promise<AdminReview[]> {
  const { rows } = await getDb().execute<{ id: string; product_id: string; name: string; rating: number; title: string | null; body: string | null; is_approved: boolean; created_at: string; email: string; first_name: string | null; last_name: string | null }>(sql`
    SELECT r.id, r.product_id, p.name, r.rating, r.title, r.body, r.is_approved, r.created_at, u.email, pr.first_name, pr.last_name
    FROM reviews r JOIN products p ON p.id = r.product_id JOIN users u ON u.id = r.user_id LEFT JOIN profiles pr ON pr.user_id = r.user_id
    ORDER BY r.is_approved, r.created_at DESC LIMIT 500`);
  return rows.map((r) => ({ id: r.id, productId: r.product_id, productName: r.name, author: displayName(r.first_name, r.last_name), email: r.email, rating: r.rating, title: r.title ?? '', body: r.body ?? '', approved: r.is_approved, date: new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) }));
}

export async function adminModerateReview(id: string, approved: boolean, actorId: string): Promise<AdminReview[]> {
  await withTransaction(async (tx) => {
    const { rowCount } = await tx.execute(sql`UPDATE reviews SET is_approved = ${approved} WHERE id = ${id}`);
    if (!rowCount) throw new AppError('NOT_FOUND', 'That review does not exist.');
    await recordAudit(tx, { actorId, action: approved ? 'review.approve' : 'review.unapprove', entity: 'reviews', entityId: id, diff: { is_approved: { from: !approved, to: approved } } });
  });
  return adminListReviews();
}

export async function adminDeleteReview(id: string, actorId: string): Promise<AdminReview[]> {
  await withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ title: string | null }>(sql`DELETE FROM reviews WHERE id = ${id} RETURNING title`);
    if (!rows[0]) throw new AppError('NOT_FOUND', 'That review does not exist.');
    await recordAudit(tx, { actorId, action: 'review.delete', entity: 'reviews', entityId: id, diff: { title: { from: rows[0].title, to: null } } });
  });
  return adminListReviews();
}
