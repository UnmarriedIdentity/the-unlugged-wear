import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Wishlist | The Unplugged Wear',
  description: 'Pieces you have saved for later.',
  robots: { index: false, follow: true },
};

export default function WishlistLayout({ children }: { children: ReactNode }) {
  return children;
}
