'use client';

import { createContext, use, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Address as StoreAddress } from './types';
import type { AccountData } from '@/server/account';
import {
  saveAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateProfileAction,
} from '@/server/customer-actions';

// Real account data for the account + checkout screens (replaces the demo
// address book in mocks/store). The layout passes an un-awaited promise;
// components read it with use() inside Suspense, then keep a local copy
// that each server action result replaces.

type ServerAddress = AccountData['addresses'][number];

const COUNTRY_NAMES: Record<string, string> = { IN: 'India' };

export function toStoreAddress(a: ServerAddress): StoreAddress {
  return {
    id: a.id,
    label: a.label ?? undefined,
    fullName: a.recipientName,
    addressLine1: a.line1,
    addressLine2: a.line2 ?? undefined,
    city: a.city,
    state: a.state ?? '',
    postalCode: a.postalCode,
    country: COUNTRY_NAMES[a.country] ?? a.country,
    phone: a.phone ?? '',
    isDefault: a.isDefault,
  };
}

const AccountContext = createContext<Promise<AccountData | null> | null>(null);

export function AccountDataProvider({ data, children }: { data: Promise<AccountData | null>; children: ReactNode }) {
  return <AccountContext value={data}>{children}</AccountContext>;
}

export type ActionOutcome = { ok: true } | { ok: false; message: string; field?: string };

/** Suspends until the account is loaded — render inside <Suspense>. */
export function useAccount() {
  const promise = useContext(AccountContext);
  const initial = promise ? use(promise) : null;
  const [data, setData] = useState(initial);

  const apply = useCallback(<T,>(result: { ok: true; data: T } | { ok: false; error: { message: string; details: { field?: string }[] } }, update: (d: T) => void): ActionOutcome => {
    if (!result.ok) return { ok: false, message: result.error.message, field: result.error.details[0]?.field };
    update(result.data);
    return { ok: true };
  }, []);

  const setAddresses = (addresses: ServerAddress[]) => setData((d) => (d ? { ...d, addresses } : d));

  const saveAddress = useCallback(async (a: StoreAddress & { id?: string | null }): Promise<ActionOutcome> => {
    const isNew = !a.id || a.id.startsWith('new-');
    const result = await saveAddressAction({
      id: isNew ? undefined : a.id,
      label: a.label ?? null,
      recipientName: a.fullName,
      phone: a.phone || null,
      line1: a.addressLine1,
      line2: a.addressLine2 ?? null,
      city: a.city,
      state: a.state || null,
      postalCode: a.postalCode,
      country: 'IN',
      isDefault: Boolean(a.isDefault),
    });
    return apply(result, setAddresses);
  }, [apply]);

  const deleteAddress = useCallback(async (addressId: string) => apply(await deleteAddressAction({ addressId }), setAddresses), [apply]);
  const setDefaultAddress = useCallback(async (addressId: string) => apply(await setDefaultAddressAction({ addressId }), setAddresses), [apply]);

  const updateProfile = useCallback(async (input: { firstName: string; lastName: string; phone?: string | null; dateOfBirth?: string | null }) =>
    apply(await updateProfileAction(input), (profile) => setData((d) => (d ? { ...d, profile } : d))), [apply]);

  const setHousehold = useCallback((household: AccountData['household']) => setData((d) => (d ? { ...d, household } : d)), []);

  return {
    account: data,
    addresses: (data?.addresses ?? []).map(toStoreAddress),
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    updateProfile,
    setHousehold,
  };
}
