import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Order History | The Unplugged Wear',
  description: 'Your past orders with The Unplugged Wear.',
  robots: { index: false, follow: true },
};

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
