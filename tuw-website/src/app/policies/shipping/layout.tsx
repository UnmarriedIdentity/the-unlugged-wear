import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Shipping & Delivery | The Unplugged Wear',
  description:
    'Print-to-order timelines, delivery estimates and shipping charges. Draft policy.',
};

export default function ShippingLayout({ children }: { children: ReactNode }) {
  return children;
}
