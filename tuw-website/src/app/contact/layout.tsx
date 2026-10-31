import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Contact Us | The Unplugged Wear',
  description: 'Questions about sizing or an order? Get in touch with The Unplugged Wear studio.',
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
