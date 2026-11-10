import { Suspense, type ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Checkout | The Unplugged Wear',
  description: 'Demo checkout sandbox: no payment will be collected.',
  robots: { index: false, follow: true },
};

// The page reads the shopper session (use()), so it streams inside Suspense.
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>{children}</Suspense>;
}
