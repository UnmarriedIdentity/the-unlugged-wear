import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'About Us | The Unplugged Wear',
  description:
    'Why The Unplugged Wear prints every piece to order in Tiruppur, India.',
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
