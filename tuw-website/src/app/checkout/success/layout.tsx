import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Order Confirmed | The Unplugged Wear',
  description: 'Your demo order has been placed.',
  robots: { index: false, follow: true },
};

// The page reads the shopper session (use()), so it streams inside Suspense.
export default function CheckoutSuccessLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>{children}</Suspense>;
}
