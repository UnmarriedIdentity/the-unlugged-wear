'use client';

import { useCallback, useEffect, useState } from 'react';
import { claimOrdersAction, claimStatusAction, myOrdersAction } from '@/server/order-actions';
import { toStoreOrder } from './orders';
import type { Order } from './types';

/** The signed-in customer's orders from the database, plus guest orders they could add. */
export function useMyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [claimable, setClaimable] = useState<{ count: number; verified: boolean }>({ count: 0, verified: false });

  const reload = useCallback(async () => {
    const [list, claim] = await Promise.all([myOrdersAction({}), claimStatusAction({})]);
    if (list.ok) setOrders(list.data.map(toStoreOrder));
    if (claim.ok) setClaimable(claim.data);
    setLoaded(true);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  /** Moves guest orders placed with this account's verified email into it. */
  const claim = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const result = await claimOrdersAction({});
    if (!result.ok) return { ok: false, message: result.error.message };
    await reload();
    const n = result.data.claimed.length;
    return { ok: true, message: n ? `${n} order${n === 1 ? '' : 's'} added to your account.` : 'There were no guest orders to add.' };
  }, [reload]);

  return { orders, loaded, claimable, reload, claim };
}
