import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AccountGate from '@/components/layout/AccountGate';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'My Account | The Unplugged Wear',
  description: 'Your orders, addresses and returns.',
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountGate>{children}</AccountGate>;
}
