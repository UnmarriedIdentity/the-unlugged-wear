import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Order Details | The Unplugged Wear',
  description: 'Status and details for your order.',
  robots: { index: false, follow: true },
};

export default function OrderDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
