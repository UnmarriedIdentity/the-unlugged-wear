import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Journal | The Unplugged Wear',
  description:
    'Notes on how our pieces are made, printing to order, and slow living.',
};

export default function JournalLayout({ children }: { children: ReactNode }) {
  return children;
}
