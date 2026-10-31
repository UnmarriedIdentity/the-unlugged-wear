import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Size Guide | The Unplugged Wear',
  description: 'General sizing guidance for The Unplugged Wear. A detailed chart from our print partner is coming.',
};

export default function SizeGuideLayout({ children }: { children: ReactNode }) {
  return children;
}
