import 'server-only';
import './events.ts';
import { sql } from 'drizzle-orm';
import { withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { emit } from '../../platform/events/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toRupees } from '../../platform/money/index.ts';
import { getPaymentGateway } from '../../integrations/payments/index.ts';
import { signReceipt } from '../auth/tokens.ts';
import { checkoutBlockers, lockForCheckout, markConverted, type CartOwner } from '../cart/index.ts';
import { orderLineFacts } from '../catalog/index.ts';
import { getMyHousehold, profileIdForUser } from '../customers/index.ts';
import { release, reserve } from '../inventory/index.ts';
import { refundCancelledOrder, takePayment } from '../payments/index.ts';
import { getSettings } from '../settings/index.ts';
import { findDiscount, redeemDiscount } from './discounts.ts';
import { priceOrder, type Totals } from './pricing.ts';
import type { PlaceOrderInput } from './schemas.ts';

// Checkout (DOC/backend/06 "Transaction scopes"): one transaction writes the
// order, its lines, the stock, the discount use, the payment and the
// converted bag, or writes nothing. The same checkout key always resolves to
// the same order, even a week later.

export type Buyer = { userId: string; email: string } | { sessionId: string };

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  /** Lets a guest open their own receipt (and is harmless for an account). */
  receipt: string;
  totals: Totals;
  cancellableUntil: string;
  replayed: boolean;
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** TUW-261112-K7Q4M: the store's date plus five unambiguous characters. */
async function newOrderNumber(tx: Transaction): Promise<string> {
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(2).replace(/-/g, '');
  for (let attempt = 0; attempt < 8; attempt++) {
    const tail = Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
    const candidate = `TUW-${day}-${tail}`;
    const { rows } = await tx.execute(sql`SELECT 1 FROM orders WHERE order_number = ${candidate}`);
    if (!rows.length) return candidate;
  }
  throw new AppError('INTERNAL_ERROR', 'Could not number the order. Please try again.');
}

const buyerRef = (buyer: Buyer, guestEmail: string | undefined) => ('userId' in buyer ? buyer.userId : `guest:${guestEmail}`);

async function findByKey(db: Pick<Transaction, 'execute'>, ref: string, key: string) {
  const { rows } = await db.execute<{ id: string; order_number: string; subtotal: string; discount: string; shipping_fee: string; tax: string; gift_card_amount: string; grand_total: string; cancellable_until: string }>(sql`
    SELECT id, order_number, subtotal, discount, shipping_fee, tax, gift_card_amount, grand_total, cancellable_until FROM orders
    WHERE COALESCE(placed_by_user_id::text, 'guest:' || lower(guest_email)) = ${ref} AND idempotency_key = ${key}`);
  return rows[0] ?? null;
}

const paise = (v: string) => Math.round(Number(v) * 100);
const placedFrom = (r: NonNullable<Awaited<ReturnType<typeof findByKey>>>, replayed: boolean): PlacedOrder => ({
  orderId: r.id, orderNumber: r.order_number, receipt: signReceipt(r.id), replayed,
  cancellableUntil: new Date(r.cancellable_until).toISOString(),
  totals: { subtotalPaise: paise(r.subtotal), discountPaise: paise(r.discount), shippingPaise: paise(r.shipping_fee), taxPaise: paise(r.tax), giftCardPaise: paise(r.gift_card_amount), grandTotalPaise: paise(r.grand_total) },
});

const isKeyClash = (error: unknown) => (error as { cause?: { code?: string; constraint?: string } }).cause?.code === '23505'
  && (error as { cause?: { constraint?: string } }).cause?.constraint === 'one_order_per_idempotency_key';

export async function placeOrder(buyer: Buyer, input: PlaceOrderInput): Promise<PlacedOrder> {
  const isGuest = 'sessionId' in buyer;
  const userId = 'userId' in buyer ? buyer.userId : null;
  if (isGuest && !input.email) throw new AppError('VALIDATION_FAILED', 'Enter your email so we can send the receipt.', [{ field: 'email', message: 'Email required.' }]);
  const guestEmail = isGuest ? input.email!.toLowerCase() : undefined;
  const ref = buyerRef(buyer, guestEmail);
  const owner: CartOwner = isGuest ? { sessionId: buyer.sessionId } : { userId: buyer.userId };
  const gateway = await getPaymentGateway();

  try {
    const placed = await withTransaction(async (tx) => {
      // The bag lock serialises a double submit; the loser then finds the order.
      const bag = await lockForCheckout(tx, owner);
      const earlier = await findByKey(tx, ref, input.checkoutKey);
      if (earlier) return placedFrom(earlier, true);
      if (!bag.id || !bag.lines.length) throw new AppError('RULE_VIOLATION', 'Your bag is empty.');
      const blockers = checkoutBlockers(bag);
      if (blockers.length) throw new AppError('STOCK_INSUFFICIENT', blockers[0]!.reason, blockers.map((b) => ({ field: b.lineId, message: b.reason })));

      const facts = await orderLineFacts(tx, bag.lines.map((l) => l.variantId!));
      const subtotal = bag.lines.reduce((n, l) => n + l.unitPaise * l.qty, 0);
      const discount = input.discountCode ? await findDiscount(tx, input.discountCode, subtotal) : null;
      const settings = await getSettings(tx);
      const windowMinutes = settings['orders.cancel_window_minutes'];
      const totals = priceOrder({
        lines: bag.lines.map((l) => ({ unitPaise: l.unitPaise, qty: l.qty, taxRate: facts.get(l.variantId!)?.taxRate ?? null })),
        discount: discount?.rule ?? null,
        rates: { freeThresholdPaise: settings['shipping.free_threshold'], standardFeePaise: settings['shipping.standard_fee'], expressFeePaise: settings['shipping.express_fee'], codFeePaise: settings['shipping.cod_fee'] },
        speed: input.speed, cashOnDelivery: input.method === 'cod', taxIncluded: settings['tax.included'],
      });

      const orderId = uuidv7();
      const orderNumber = await newOrderNumber(tx);
      const address = JSON.stringify(input.shippingAddress);
      let account: { profileId: string; householdId: string } | null = null;
      if (userId) {
        const profileId = await profileIdForUser(userId, tx);
        account = { profileId, householdId: (await getMyHousehold(profileId, tx)).householdId };
      }
      const cancellableUntil = new Date(Date.now() + windowMinutes * 60_000).toISOString();
      await tx.execute(sql`INSERT INTO orders (id, placed_by_user_id, for_profile_id, for_household_id, guest_email, guest_name, guest_phone, order_number, status,
          subtotal, shipping_fee, tax, discount, gift_card_amount, grand_total, payment_status, shipping_address, billing_address, discount_code_id, idempotency_key, cancellable_until)
        VALUES (${orderId}, ${account ? userId : null}, ${account?.profileId ?? null}, ${account?.householdId ?? null},
          ${guestEmail ?? null}, ${isGuest ? input.shippingAddress.fullName : null}, ${isGuest ? input.shippingAddress.phone : null}, ${orderNumber}, 'pending',
          ${toRupees(totals.subtotalPaise)}, ${toRupees(totals.shippingPaise)}, ${toRupees(totals.taxPaise)}, ${toRupees(totals.discountPaise)}, 0, ${toRupees(totals.grandTotalPaise)},
          'pending', ${address}::jsonb, ${address}::jsonb, ${discount?.id ?? null}, ${input.checkoutKey}, ${cancellableUntil})`);

      const items = bag.lines.map((l) => ({ id: uuidv7(), line: l, facts: facts.get(l.variantId!)! }));
      await tx.execute(sql`INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, sku, unit_price, qty, line_total, options, exchange_policy, personalization, preview_image_url, preview_approved_at)
        SELECT x.id, ${orderId}, x.product_id, x.variant_id, x.name, x.sku, x.unit_price, x.qty, x.line_total, x.options, x.policy, x.personalization, x.preview, CASE WHEN x.personalization IS NULL THEN NULL ELSE now() END
        FROM jsonb_to_recordset(${JSON.stringify(items.map(({ id, line, facts: f }) => ({
          id, product_id: line.productUuid, variant_id: line.variantId, name: line.title, sku: f.sku, unit_price: toRupees(line.unitPaise), qty: line.qty,
          line_total: toRupees(line.unitPaise * line.qty), options: { ...(line.color ? { Color: line.color } : {}), ...(line.size ? { Size: line.size } : {}) },
          policy: f.exchangePolicy, personalization: line.personalization, preview: line.previewImageUrl,
        })))}::jsonb) AS x(id uuid, product_id uuid, variant_id uuid, name text, sku text, unit_price numeric, qty int, line_total numeric, options jsonb, policy text, personalization jsonb, preview text)`);

      await reserve(tx, { orderId, lines: items.map((i) => ({ orderItemId: i.id, variantId: i.line.variantId!, qty: i.line.qty })) });
      if (discount) await redeemDiscount(tx, discount.id);
      const payment = await takePayment(tx, gateway, { orderId, method: input.method, amountPaise: totals.grandTotalPaise, reference: orderId, simulate: input.simulate });
      await tx.execute(sql`UPDATE orders SET payment_status = ${payment.captured ? 'paid' : 'pending'} WHERE id = ${orderId}`);
      await tx.execute(sql`INSERT INTO order_status_history (id, order_id, from_status, to_status, note, actor)
        VALUES (${uuidv7()}, ${orderId}, NULL, 'pending', ${payment.captured ? 'Paid; free to cancel until the window ends' : 'Cash on delivery; free to cancel until the window ends'}, ${userId ?? 'guest'})`);
      await markConverted(tx, bag.id);
      return { orderId, orderNumber, receipt: signReceipt(orderId), totals, cancellableUntil, replayed: false };
    });
    if (!placed.replayed) void emit('order.placed', { orderId: placed.orderId, orderNumber: placed.orderNumber, paid: input.method !== 'cod' });
    return placed;
  } catch (error) {
    // Two submits raced past the lock (different bags): the key still names one order.
    if (isKeyClash(error)) {
      const earlier = await findByKey((await import('../../platform/db/index.ts')).getDb(), ref, input.checkoutKey);
      if (earlier) return placedFrom(earlier, true);
    }
    throw error;
  }
}

/** What every cancel does once the status has flipped: stock back, payment refunded, history written. */
export async function afterCancel(tx: Transaction, gateway: Awaited<ReturnType<typeof getPaymentGateway>>, input: { orderId: string; actorId: string; from: string; note: string }): Promise<{ refunded: boolean }> {
  await release(tx, { orderId: input.orderId });
  const { refunded } = await refundCancelledOrder(tx, gateway, { orderId: input.orderId, actorId: input.actorId, reason: input.note });
  if (refunded) await tx.execute(sql`UPDATE orders SET payment_status = 'refunded' WHERE id = ${input.orderId}`);
  await tx.execute(sql`INSERT INTO order_status_history (id, order_id, from_status, to_status, note, actor)
    VALUES (${uuidv7()}, ${input.orderId}, ${input.from}, 'cancelled', ${refunded ? `${input.note}; payment refunded to source` : input.note}, ${input.actorId})`);
  return { refunded };
}

/**
 * Free cancel inside the window, for the account that placed the order. One
 * conditional update decides it, so a double click or a race with the submit
 * worker cancels once or not at all; stock comes back and a payment is refunded.
 */
export async function cancelOrder(userId: string, orderNumber: string): Promise<{ refunded: boolean }> {
  const gateway = await getPaymentGateway();
  const result = await withTransaction(async (tx) => {
    const { rows } = await tx.execute<{ id: string }>(sql`
      UPDATE orders SET status = 'cancelled', updated_at = now()
      WHERE order_number = ${orderNumber} AND placed_by_user_id = ${userId} AND status = 'pending' AND cancellable_until > now()
      RETURNING id`);
    const order = rows[0];
    if (!order) {
      const { rows: [seen] } = await tx.execute<{ status: string }>(sql`SELECT status FROM orders WHERE order_number = ${orderNumber} AND placed_by_user_id = ${userId}`);
      if (!seen) throw new AppError('NOT_FOUND', 'We could not find that order.');
      throw new AppError('RULE_VIOLATION', seen.status === 'cancelled' ? 'This order is already cancelled.' : 'The free-cancel window has closed, so this order is already with our print partner. Contact us and we will help.');
    }
    const { refunded } = await afterCancel(tx, gateway, { orderId: order.id, actorId: userId, from: 'pending', note: 'Cancelled by the customer' });
    return { orderId: order.id, refunded };
  });
  void emit('order.cancelled', { orderId: result.orderId, orderNumber, refunded: result.refunded });
  return { refunded: result.refunded };
}
