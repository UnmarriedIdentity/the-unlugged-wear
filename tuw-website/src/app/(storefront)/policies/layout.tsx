import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Policies | The Unplugged Wear',
  description: 'Shipping, returns, privacy and terms for The Unplugged Wear. Draft policies, still being finalised.',
};

export default function PoliciesLayout({ children }: { children: ReactNode }) {
  return children;
}
