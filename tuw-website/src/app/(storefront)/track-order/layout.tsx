import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Track Your Order | The Unplugged Wear',
  description: 'Track the status of your order.',
  robots: { index: false, follow: true },
};

export default function TrackOrderLayout({ children }: { children: ReactNode }) {
  return children;
}
