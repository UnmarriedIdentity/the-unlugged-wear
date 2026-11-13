import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { resolveProductRef } from '../catalog/index.ts';

// Wishlist (DOC/backend/05): customers only, one list each. Saving twice keeps
// one entry. Unlisted products drop out of the list.

/** A list this long is a bot, not a shopper. */
export const MAX_WISHLIST_ITEMS = 500;

/** Public product ids, newest first. */
export async function listWishlist(userId: string): Promise<string[]> {
  const { rows } = await getDb().execute<{ public_id: string }>(sql`
    SELECT coalesce(p.external_id, p.id::text) AS public_id FROM wishlists w
    JOIN wishlist_items wi ON wi.wishlist_id = w.id
    JOIN products p ON p.id = wi.product_id AND p.status = 'active' AND p.deleted_at IS NULL
    WHERE w.user_id = ${userId} ORDER BY wi.added_at DESC, wi.id DESC`);
  return rows.map((r) => r.public_id);
}

export async function setWishlisted(userId: string, productRef: string, saved: boolean): Promise<string[]> {
  const product = await resolveProductRef(productRef);
  if (!product) throw new AppError('NOT_FOUND', 'That product is not available.');
  await withTransaction(async (tx) => {
    await tx.execute(sql`INSERT INTO wishlists (id, user_id) VALUES (${uuidv7()}, ${userId}) ON CONFLICT (user_id) DO NOTHING`);
    const { rows: [list] } = await tx.execute<{ id: string }>(sql`SELECT id FROM wishlists WHERE user_id = ${userId} FOR UPDATE`);
    if (!saved) {
      await tx.execute(sql`DELETE FROM wishlist_items WHERE wishlist_id = ${list!.id} AND product_id = ${product.id}`);
      return;
    }
    const { rows: [n] } = await tx.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM wishlist_items WHERE wishlist_id = ${list!.id}`);
    if (n!.n >= MAX_WISHLIST_ITEMS) throw new AppError('RULE_VIOLATION', `A wishlist can hold up to ${MAX_WISHLIST_ITEMS} pieces.`);
    await tx.execute(sql`INSERT INTO wishlist_items (id, wishlist_id, product_id) VALUES (${uuidv7()}, ${list!.id}, ${product.id}) ON CONFLICT (wishlist_id, product_id) DO NOTHING`);
  });
  return listWishlist(userId);
}
