import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Frequently Asked Questions | The Unplugged Wear',
  description:
    'Answers about sizing, printing to order, shipping, tracking and returns at The Unplugged Wear.',
};

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children;
}
