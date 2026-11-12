import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { accountEmail } from '../auth/index.ts';
import { getMyHousehold, profileIdForUser } from '../customers/index.ts';
import { getOrderForViewer, type OrderView } from './read.ts';
import { signReceipt } from '../auth/tokens.ts';

// Guests: track an order with its number and email, and move their guest
// orders into an account once they prove they own that email.

const NOT_FOUND = 'We could not find an order with that number and email.';

/**
 * Order number + email. A wrong pair and an unknown number give the same
 * answer, so the form cannot be used to learn who ordered what. The caller
 * rate-limits it.
 */
export async function trackOrder(orderNumber: string, email: string): Promise<OrderView> {
  const { rows: [o] } = await getDb().execute<{ id: string; order_number: string }>(sql`
    SELECT o.id, o.order_number FROM orders o LEFT JOIN users u ON u.id = o.placed_by_user_id
    WHERE upper(o.order_number) = upper(${orderNumber.trim()}) AND lower(COALESCE(o.guest_email, u.email)) = lower(${email.trim()})`);
  if (!o) throw new AppError('NOT_FOUND', NOT_FOUND);
  return getOrderForViewer(o.order_number, { userId: null, receipt: signReceipt(o.id) });
}

/** How many guest orders wait for this account, and whether it may take them. */
export async function claimableGuestOrders(userId: string): Promise<{ count: number; verified: boolean }> {
  const account = await accountEmail(userId);
  if (!account) return { count: 0, verified: false };
  const { rows: [n] } = await getDb().execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM orders WHERE placed_by_user_id IS NULL AND lower(guest_email) = lower(${account.email})`);
  return { count: n!.n, verified: account.verified };
}

/**
 * Turns every guest order placed with the account's verified email into an
 * account order: buyer, own profile and household set, guest fields cleared
 * (the address snapshot keeps the delivery details). Running it twice
 * changes nothing the second time.
 */
export async function claimGuestOrders(userId: string): Promise<{ claimed: string[] }> {
  const account = await accountEmail(userId);
  if (!account) throw new AppError('NOT_FOUND', 'Your account could not be found.');
  if (!account.verified) throw new AppError('RULE_VIOLATION', 'Verify your email first, so we know these orders are yours.');
  return withTransaction(async (tx) => {
    const profileId = await profileIdForUser(userId, tx);
    const householdId = (await getMyHousehold(profileId, tx)).householdId;
    const { rows } = await tx.execute<{ id: string; order_number: string; status: string }>(sql`
      UPDATE orders SET placed_by_user_id = ${userId}, for_profile_id = ${profileId}, for_household_id = ${householdId},
             guest_email = NULL, guest_name = NULL, guest_phone = NULL, updated_at = now()
      WHERE placed_by_user_id IS NULL AND lower(guest_email) = lower(${account.email})
      RETURNING id, order_number, status`);
    for (const r of rows) {
      await tx.execute(sql`INSERT INTO order_status_history (id, order_id, from_status, to_status, note, actor)
        VALUES (${uuidv7()}, ${r.id}, ${r.status}, ${r.status}, 'Guest order added to the customer account', ${userId})`);
    }
    return { claimed: rows.map((r) => r.order_number) };
  });
}
