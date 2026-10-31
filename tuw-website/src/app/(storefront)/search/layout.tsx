import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Search | The Unplugged Wear',
  description: 'Search The Unplugged Wear catalog.',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
