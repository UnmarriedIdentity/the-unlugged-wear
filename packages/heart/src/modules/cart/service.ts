import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toRupees } from '../../platform/money/index.ts';
import { cartSnapshot } from '../catalog/index.ts';
import { availableQty } from '../inventory/index.ts';

// The bag (DOC/backend/05). Lines freeze what the shopper saw when they added
// it; price, name and picture refresh only on an explicit re-add. Every write
// runs under a per-owner lock, so double clicks and parallel tabs never make
// a second cart or a second copy of a line.

export type CartOwner = { userId: string } | { sessionId: string };

/** A cart this size is already unusual; the cap keeps reads fast. */
export const MAX_CART_LINES = 100;

export interface Personalization {
  monogram?: string;
  placement?: string;
}

export interface CartLine {
  id: string;
  productId: string; // public id, as the storefront knows it
  productUuid: string;
  variantId: string | null;
  slug: string | null;
  title: string;
  color: string | null;
  size: string | null;
  variantLabel: string | null;
  unitPaise: number;
  qty: number;
  image: string | null;
  personalization: Personalization | null;
  previewImageUrl: string | null;
  previewApproved: boolean;
  /** How many this line may hold now; 0 when it can no longer be bought. */
  maxQty: number;
}

export interface CartView { id: string | null; lines: CartLine[] }

type Row = {
  id: string; product_id: string; external_id: string | null; variant_id: string | null; product_slug: string | null; product_name: string;
  color: string | null; size: string | null; variant_label: string | null; unit_price: string; qty: number; image_url: string | null;
  personalization: Personalization | null; preview_image_url: string | null; preview_approved_at: string | null;
};

const ownerKey = (owner: CartOwner) => ('userId' in owner ? `user:${owner.userId}` : `guest:${owner.sessionId}`);
const ownerWhere = (owner: CartOwner) => ('userId' in owner ? sql`user_id = ${owner.userId}` : sql`session_id = ${owner.sessionId} AND user_id IS NULL`);
const paise = (rupees: string) => Math.round(Number(rupees) * 100);

async function lockOwner(tx: Transaction, owner: CartOwner): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`cart:${ownerKey(owner)}`}, 0))`);
}

async function activeCartId(db: Pick<Transaction, 'execute'>, owner: CartOwner): Promise<string | null> {
  const { rows } = await db.execute<{ id: string }>(sql`SELECT id FROM carts WHERE ${ownerWhere(owner)} AND status = 'active' ORDER BY created_at DESC LIMIT 1`);
  return rows[0]?.id ?? null;
}

async function ensureCart(tx: Transaction, owner: CartOwner): Promise<string> {
  const existing = await activeCartId(tx, owner);
  if (existing) return existing;
  const id = uuidv7();
  await tx.execute(sql`INSERT INTO carts (id, user_id, session_id) VALUES (${id}, ${'userId' in owner ? owner.userId : null}, ${'sessionId' in owner ? owner.sessionId : null})`);
  return id;
}

async function readLines(db: Pick<Transaction, 'execute'>, cartId: string): Promise<CartLine[]> {
  const { rows } = await db.execute<Row>(sql`
    SELECT ci.id, ci.product_id, p.external_id, ci.variant_id, ci.product_slug, ci.product_name, ci.color, ci.size, ci.variant_label, ci.unit_price, ci.qty,
           ci.image_url, ci.personalization, ci.preview_image_url, ci.preview_approved_at
    FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ${cartId} ORDER BY ci.added_at, ci.id`);
  const caps = await availableQty(db, rows.flatMap((r) => (r.variant_id ? [r.variant_id] : [])));
  return rows.map((r) => ({
    id: r.id, productId: r.external_id ?? r.product_id, productUuid: r.product_id, variantId: r.variant_id, slug: r.product_slug, title: r.product_name,
    color: r.color, size: r.size, variantLabel: r.variant_label, unitPaise: paise(r.unit_price), qty: r.qty, image: r.image_url,
    personalization: r.personalization, previewImageUrl: r.preview_image_url, previewApproved: r.preview_approved_at !== null,
    maxQty: r.variant_id ? caps.get(r.variant_id) ?? 0 : 0,
  }));
}

async function view(tx: Transaction, cartId: string): Promise<CartView> {
  await tx.execute(sql`UPDATE carts SET last_activity_at = now(), updated_at = now() WHERE id = ${cartId}`);
  return { id: cartId, lines: await readLines(tx, cartId) };
}

/** Per-person data: never cached. */
export async function getCart(owner: CartOwner): Promise<CartView> {
  const db = getDb();
  const id = await activeCartId(db, owner);
  return id ? { id, lines: await readLines(db, id) } : { id: null, lines: [] };
}

function checkQty(qty: number, cap: number, what: string): void {
  if (!Number.isInteger(qty) || qty < 1) throw new AppError('VALIDATION_FAILED', 'Choose a quantity of at least 1.', [{ field: 'qty', message: 'Choose a quantity of at least 1.' }]);
  if (cap <= 0) throw new AppError('STOCK_INSUFFICIENT', `${what} is sold out.`);
  if (qty > cap) throw new AppError('STOCK_INSUFFICIENT', `Only ${cap} of ${what} can be added.`, [{ field: 'qty', message: `Only ${cap} available.` }]);
}

// jsonb reorders keys, so compare with sorted keys.
const stable = (p: Personalization | null) => (p ? JSON.stringify(Object.fromEntries(Object.entries(p).sort(([a], [b]) => a.localeCompare(b)))) : 'null');
const samePersonalization = (a: Personalization | null, b: Personalization | null) => stable(a) === stable(b);

function cleanPersonalization(input: Personalization | undefined, monogram: { maxChars: number } | null, previewUrl: string | undefined): Personalization | null {
  if (!input || (!input.monogram && !input.placement)) return null;
  if (!monogram) throw new AppError('RULE_VIOLATION', 'This product cannot be personalised.');
  const text = input.monogram?.trim() ?? '';
  if (!text || text.length > monogram.maxChars) throw new AppError('VALIDATION_FAILED', `Use 1 to ${monogram.maxChars} characters.`, [{ field: 'monogram', message: `Use 1 to ${monogram.maxChars} characters.` }]);
  if (!previewUrl) throw new AppError('VALIDATION_FAILED', 'A personalised item needs a preview before it goes in the bag.', [{ field: 'preview', message: 'Preview required.' }]);
  return { monogram: text, ...(input.placement ? { placement: input.placement.trim() } : {}) };
}

export interface AddLineInput {
  productRef: string;
  color?: string;
  size?: string;
  qty: number;
  personalization?: Personalization;
  previewImageUrl?: string;
}

/** Re-adding the same item adds to its line and refreshes what the line shows. */
export async function addLine(owner: CartOwner, input: AddLineInput): Promise<CartView> {
  const snap = await cartSnapshot(input.productRef, input.color, input.size);
  const personalization = cleanPersonalization(input.personalization, snap.monogram, input.previewImageUrl);
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const cartId = await ensureCart(tx, owner);
    const cap = (await availableQty(tx, [snap.variantId])).get(snap.variantId) ?? 0;
    const { rows: lines } = await tx.execute<{ id: string; variant_id: string | null; product_id: string; qty: number; personalization: Personalization | null; preview_image_url: string | null }>(
      sql`SELECT id, variant_id, product_id, qty, personalization, preview_image_url FROM cart_items WHERE cart_id = ${cartId}`);
    const twin = lines.find((l) => l.product_id === snap.productId && l.variant_id === snap.variantId && samePersonalization(l.personalization, personalization));
    const qty = (twin?.qty ?? 0) + input.qty;
    checkQty(input.qty, cap, snap.name);
    checkQty(qty, cap, snap.name);
    const frozen = sql`unit_price = ${toRupees(snap.unitPaise)}, product_name = ${snap.name}, product_slug = ${snap.slug}, image_url = ${snap.image}, variant_label = ${snap.label}, color = ${snap.color}, size = ${snap.size}`;
    if (twin) {
      // A personalised line keeps its approval only if the preview is the same one.
      const newPreview = personalization && input.previewImageUrl !== twin.preview_image_url;
      await tx.execute(sql`UPDATE cart_items SET qty = ${qty}, ${frozen}${newPreview ? sql`, preview_image_url = ${input.previewImageUrl!}, preview_approved_at = NULL` : sql``} WHERE id = ${twin.id}`);
    } else {
      if (lines.length >= MAX_CART_LINES) throw new AppError('RULE_VIOLATION', `A bag can hold up to ${MAX_CART_LINES} different items.`);
      await tx.execute(sql`INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, unit_price, product_name, product_slug, image_url, variant_label, color, size, personalization, preview_image_url)
        VALUES (${uuidv7()}, ${cartId}, ${snap.productId}, ${snap.variantId}, ${qty}, ${toRupees(snap.unitPaise)}, ${snap.name}, ${snap.slug}, ${snap.image}, ${snap.label}, ${snap.color}, ${snap.size},
                ${personalization ? JSON.stringify(personalization) : null}::jsonb, ${personalization ? input.previewImageUrl! : null})`);
    }
    return view(tx, cartId);
  });
}

async function ownedLine(tx: Transaction, owner: CartOwner, lineId: string) {
  const cartId = await activeCartId(tx, owner);
  if (!cartId) throw new AppError('NOT_FOUND', 'That item is no longer in your bag.');
  const { rows } = await tx.execute<{ id: string; product_id: string; variant_id: string | null; qty: number; product_name: string; personalization: Personalization | null; preview_image_url: string | null }>(
    sql`SELECT id, product_id, variant_id, qty, product_name, personalization, preview_image_url FROM cart_items WHERE id = ${lineId} AND cart_id = ${cartId}`);
  if (!rows[0]) throw new AppError('NOT_FOUND', 'That item is no longer in your bag.');
  return { cartId, line: rows[0] };
}

/** 0 removes the line. Someone else's line id is "not found", never a leak. */
export async function setLineQty(owner: CartOwner, lineId: string, qty: number): Promise<CartView> {
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const { cartId, line } = await ownedLine(tx, owner, lineId);
    if (qty === 0) {
      await tx.execute(sql`DELETE FROM cart_items WHERE id = ${line.id}`);
      return view(tx, cartId);
    }
    // Lowering is always allowed, even below what is now in stock.
    if (qty > line.qty) checkQty(qty, line.variant_id ? (await availableQty(tx, [line.variant_id])).get(line.variant_id) ?? 0 : 0, line.product_name);
    else if (!Number.isInteger(qty) || qty < 1) checkQty(qty, 1, line.product_name);
    await tx.execute(sql`UPDATE cart_items SET qty = ${qty} WHERE id = ${line.id}`);
    return view(tx, cartId);
  });
}

/** Swap a line to another colour or size of the same product; joins an identical line if there is one. */
export async function changeLineVariant(owner: CartOwner, lineId: string, choice: { color?: string; size?: string }): Promise<CartView> {
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const { cartId, line } = await ownedLine(tx, owner, lineId);
    const { rows: [current] } = await tx.execute<{ color: string | null; size: string | null }>(sql`SELECT color, size FROM cart_items WHERE id = ${line.id}`);
    const snap = await cartSnapshot(line.product_id, choice.color ?? current!.color ?? undefined, choice.size ?? current!.size ?? undefined);
    if (snap.variantId === line.variant_id) return view(tx, cartId);
    const { rows: [twin] } = await tx.execute<{ id: string; qty: number }>(sql`
      SELECT id, qty FROM cart_items WHERE cart_id = ${cartId} AND id <> ${line.id} AND product_id = ${line.product_id} AND variant_id = ${snap.variantId}
        AND COALESCE(personalization, '{}'::jsonb) = COALESCE(${line.personalization ? JSON.stringify(line.personalization) : null}::jsonb, '{}'::jsonb)`);
    const qty = (twin?.qty ?? 0) + line.qty;
    checkQty(qty, (await availableQty(tx, [snap.variantId])).get(snap.variantId) ?? 0, snap.name);
    if (twin) {
      await tx.execute(sql`DELETE FROM cart_items WHERE id = ${line.id}`);
      await tx.execute(sql`UPDATE cart_items SET qty = ${qty} WHERE id = ${twin.id}`);
    } else {
      await tx.execute(sql`UPDATE cart_items SET variant_id = ${snap.variantId}, unit_price = ${toRupees(snap.unitPaise)}, image_url = ${snap.image}, variant_label = ${snap.label},
        color = ${snap.color}, size = ${snap.size}, preview_approved_at = NULL WHERE id = ${line.id}`);
    }
    return view(tx, cartId);
  });
}

/** Many removals, one round trip. Ids from other carts are ignored. */
export async function removeLines(owner: CartOwner, lineIds: string[]): Promise<CartView> {
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const cartId = await activeCartId(tx, owner);
    if (!cartId) return { id: null, lines: [] };
    if (lineIds.length) await tx.execute(sql`DELETE FROM cart_items WHERE cart_id = ${cartId} AND id IN (${sql.join(lineIds.map((i) => sql`${i}::uuid`), sql`, `)})`);
    return view(tx, cartId);
  });
}

export async function clearCart(owner: CartOwner): Promise<CartView> {
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const cartId = await activeCartId(tx, owner);
    if (!cartId) return { id: null, lines: [] };
    await tx.execute(sql`DELETE FROM cart_items WHERE cart_id = ${cartId}`);
    return view(tx, cartId);
  });
}

/** The shopper looked at the print preview and said yes. Checkout refuses personalised lines without this. */
export async function approvePreview(owner: CartOwner, lineId: string): Promise<CartView> {
  return withTransaction(async (tx) => {
    await lockOwner(tx, owner);
    const { cartId, line } = await ownedLine(tx, owner, lineId);
    if (!line.personalization || !line.preview_image_url) throw new AppError('RULE_VIOLATION', 'This item has nothing to approve.');
    await tx.execute(sql`UPDATE cart_items SET preview_approved_at = now() WHERE id = ${line.id}`);
    return view(tx, cartId);
  });
}

/** Lines checkout must refuse: personalised without an approved preview, or no longer buyable in that quantity. */
export function checkoutBlockers(cart: CartView): { lineId: string; reason: string }[] {
  return cart.lines.flatMap((l) => {
    if (l.personalization && !l.previewApproved) return [{ lineId: l.id, reason: 'Approve the print preview first.' }];
    if (l.maxQty <= 0) return [{ lineId: l.id, reason: `${l.title} is no longer available.` }];
    if (l.qty > l.maxQty) return [{ lineId: l.id, reason: `Only ${l.maxQty} of ${l.title} available.` }];
    return [];
  });
}

/**
 * Sign-in: the guest's lines fold into the account's bag, quantities added
 * and capped at what can be bought. The guest cart becomes 'converted' (kept
 * for abandonment numbers), so running this twice changes nothing.
 */
export async function mergeGuestCart(sessionId: string, userId: string): Promise<CartView> {
  return withTransaction(async (tx) => {
    // Same lock order everywhere: guest first, then the account.
    await lockOwner(tx, { sessionId });
    await lockOwner(tx, { userId });
    const guestId = await activeCartId(tx, { sessionId });
    if (!guestId) {
      const mine = await activeCartId(tx, { userId });
      return mine ? view(tx, mine) : { id: null, lines: [] };
    }
    const cartId = await ensureCart(tx, { userId });
    const { rows: guest } = await tx.execute<Row & { variant_id: string | null }>(sql`SELECT * FROM cart_items WHERE cart_id = ${guestId} ORDER BY added_at, id`);
    const { rows: mine } = await tx.execute<{ id: string; product_id: string; variant_id: string | null; qty: number; personalization: Personalization | null }>(
      sql`SELECT id, product_id, variant_id, qty, personalization FROM cart_items WHERE cart_id = ${cartId}`);
    const caps = await availableQty(tx, guest.flatMap((g) => (g.variant_id ? [g.variant_id] : [])));
    let count = mine.length;
    for (const g of guest) {
      const cap = g.variant_id ? caps.get(g.variant_id) ?? 0 : 0;
      const twin = mine.find((m) => m.product_id === g.product_id && m.variant_id === g.variant_id && samePersonalization(m.personalization, g.personalization));
      if (twin) {
        const qty = Math.min(twin.qty + g.qty, Math.max(cap, twin.qty));
        if (qty !== twin.qty) await tx.execute(sql`UPDATE cart_items SET qty = ${qty} WHERE id = ${twin.id}`);
        continue;
      }
      const qty = Math.min(g.qty, cap);
      if (qty < 1 || count >= MAX_CART_LINES) continue;
      count += 1;
      await tx.execute(sql`INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, unit_price, product_name, product_slug, image_url, variant_label, color, size, personalization, preview_image_url, preview_approved_at, added_at)
        SELECT ${uuidv7()}, ${cartId}, product_id, variant_id, ${qty}, unit_price, product_name, product_slug, image_url, variant_label, color, size, personalization, preview_image_url, preview_approved_at, added_at
        FROM cart_items WHERE id = ${g.id}`);
    }
    await tx.execute(sql`UPDATE carts SET status = 'converted', updated_at = now() WHERE id = ${guestId}`);
    return view(tx, cartId);
  });
}

/** Checkout: the bag under its owner's lock, inside the order transaction. */
export async function lockForCheckout(tx: Transaction, owner: CartOwner): Promise<CartView> {
  await lockOwner(tx, owner);
  const id = await activeCartId(tx, owner);
  return id ? { id, lines: await readLines(tx, id) } : { id: null, lines: [] };
}

/** The order is placed: this bag is done. Kept, not deleted, for conversion numbers. */
export async function markConverted(tx: Transaction, cartId: string): Promise<void> {
  await tx.execute(sql`UPDATE carts SET status = 'converted', updated_at = now() WHERE id = ${cartId} AND status = 'active'`);
}

