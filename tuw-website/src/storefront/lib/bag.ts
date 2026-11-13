'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CartLine } from '@tuw/heart/modules/cart';
import {
  addToBagAction, changeBagVariantAction, clearBagAction, getBagAction, removeFromBagAction, setBagQtyAction, setWishlistAction,
} from '@/server/cart-actions';
import type { CartItem } from './types';

// The bag and wishlist from the database (TL-BE-07). Changes show at once
// and are sent one at a time, in order; the server's answer then replaces
// the optimistic version, and a refusal reloads the truth.

type Result<T> = { ok: true; data: T } | { ok: false; error: { message: string } };

const toItem = (l: CartLine): CartItem => ({
  id: l.id,
  productId: l.productId,
  title: l.title,
  color: l.color ?? 'Standard',
  size: l.size ?? 'One size',
  priceINR: l.unitPaise / 100,
  priceMinorINR: l.unitPaise,
  quantity: l.qty,
  image: l.image ?? '',
  maxQty: l.maxQty,
});

/** The storefront's neutral labels mean "no such axis" to the server. */
const axis = (value: string | undefined, neutral: RegExp) => (value && !neutral.test(value) ? value : undefined);

export function useBag(opts: { session: unknown; onError: (title: string, message: string) => void }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const onError = useRef(opts.onError);
  onError.current = opts.onError;

  const refreshBag = useCallback(async () => {
    const result = await getBagAction({});
    if (!result.ok) return;
    setCart(result.data.lines.map(toItem));
    setWishlist(result.data.wishlist);
    setSignedIn(result.data.signedIn);
    setReady(true);
  }, []);

  // On load, and again whenever sign-in or sign-out refreshes the session.
  useEffect(() => { void refreshBag(); }, [opts.session, refreshBag]);

  /** Optimistic change now, server call in turn; the server's lines win. */
  const send = useCallback((optimistic: (prev: CartItem[]) => CartItem[], call: () => Promise<Result<CartLine[]>>, failTitle: string) => {
    setCart(optimistic);
    const next = queue.current.then(async () => {
      const result = await call();
      if (result.ok) setCart(result.data.map(toItem));
      else {
        onError.current(failTitle, result.error.message);
        await refreshBag();
      }
      return result.ok;
    });
    queue.current = next.catch(() => undefined);
    return next;
  }, [refreshBag]);

  const addToCart = useCallback((item: Omit<CartItem, 'id'>) => {
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    return send(
      (prev) => {
        const twin = prev.find((i) => i.productId === item.productId && i.color === item.color && i.size === item.size);
        return twin ? prev.map((i) => (i === twin ? { ...i, quantity: i.quantity + item.quantity } : i)) : [...prev, { ...item, id: tempId }];
      },
      () => addToBagAction({ productId: item.productId, color: axis(item.color, /^standard$/i), size: axis(item.size, /^one size$/i), qty: item.quantity }),
      'Could not add to bag',
    );
  }, [send]);

  const updateQuantity = useCallback((id: string, qty: number) => send(
    (prev) => (qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))),
    () => setBagQtyAction({ lineId: id, qty: Math.max(0, qty) }),
    'Could not change the quantity',
  ), [send]);

  const updateCartItemVariant = useCallback((id: string, changes: { color?: string; size?: string; image?: string }) => send(
    (prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)),
    () => changeBagVariantAction({ lineId: id, color: axis(changes.color, /^standard$/i), size: axis(changes.size, /^one size$/i) }),
    'Could not change that item',
  ), [send]);

  const removeLine = useCallback((id: string) => send(
    (prev) => prev.filter((i) => i.id !== id),
    () => removeFromBagAction({ lineIds: [id] }),
    'Could not remove that item',
  ), [send]);

  const clearCart = useCallback(() => send(() => [], () => clearBagAction({}), 'Could not empty the bag'), [send]);

  const setSaved = useCallback(async (productId: string, saved: boolean) => {
    setWishlist((prev) => (saved ? (prev.includes(productId) ? prev : [productId, ...prev]) : prev.filter((id) => id !== productId)));
    const result = await setWishlistAction({ productId, saved });
    if (result.ok) setWishlist(result.data);
    else {
      onError.current('Could not update your wishlist', result.error.message);
      await refreshBag();
    }
    return result.ok;
  }, [refreshBag]);

  return { cart, wishlist, signedIn, ready, refreshBag, addToCart, updateQuantity, updateCartItemVariant, removeLine, clearCart, setSaved };
}
