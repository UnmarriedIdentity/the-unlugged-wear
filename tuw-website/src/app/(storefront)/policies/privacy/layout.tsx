import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Privacy Policy | The Unplugged Wear',
  description:
    'How The Unplugged Wear handles customer data and payments. Draft policy.',
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
