import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';
import { AccountDataProvider } from '@storefront/lib/account';
import { getMyAccount } from '@/server/account';
import AccountGate from '@storefront/components/layout/AccountGate';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'My Account | The Unplugged Wear',
  description: 'Your orders, addresses and returns.',
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  // Per-shopper pages: always streamed at request time (cache-components skill).
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AccountDataProvider data={getMyAccount()}>
        <AccountGate>{children}</AccountGate>
      </AccountDataProvider>
    </Suspense>
  );
}
