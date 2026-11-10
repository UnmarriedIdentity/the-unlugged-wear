import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';
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
      <AccountGate>{children}</AccountGate>
    </Suspense>
  );
}
