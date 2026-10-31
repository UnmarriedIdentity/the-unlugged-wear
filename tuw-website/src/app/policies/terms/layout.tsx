import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Terms of Service | The Unplugged Wear',
  description:
    'Terms of service and purchase conditions for The Unplugged Wear. Draft terms.',
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
