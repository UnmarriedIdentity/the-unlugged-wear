import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Shop All | The Unplugged Wear',
  description: 'Hoodies, tees, joggers and everyday objects from The Unplugged Wear, each printed to order in Tiruppur.',
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
