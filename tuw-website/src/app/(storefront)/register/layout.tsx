import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Create an Account | The Unplugged Wear',
  description: 'Create a The Unplugged Wear account.',
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
