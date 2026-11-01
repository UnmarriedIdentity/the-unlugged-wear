import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// The page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Contact Us | The Unplugged Wear',
  description: 'Questions about an order, sizing or a product? Get in touch with The Unplugged Wear — we reply within one business day.',
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
