import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Overrides the parent About layout's title for this child page.
export const metadata: Metadata = {
  title: 'Sustainability | The Unplugged Wear',
  description:
    'How printing to order works at The Unplugged Wear, and which material details are still being confirmed.',
};

export default function SustainabilityLayout({ children }: { children: ReactNode }) {
  return children;
}
