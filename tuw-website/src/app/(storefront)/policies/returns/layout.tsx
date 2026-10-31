import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Returns & Exchanges | The Unplugged Wear',
  description:
    'Returns and exchange terms for The Unplugged Wear. Draft policy, still being finalised.',
};

export default function ReturnsLayout({ children }: { children: ReactNode }) {
  return children;
}
