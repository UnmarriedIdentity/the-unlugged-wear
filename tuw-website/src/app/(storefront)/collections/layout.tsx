import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Collections | The Unplugged Wear',
  description: 'Browse The Unplugged Wear by collection: hoodies and sweats, everyday tees, and objects.',
};

export default function CollectionsLayout({ children }: { children: ReactNode }) {
  return children;
}
