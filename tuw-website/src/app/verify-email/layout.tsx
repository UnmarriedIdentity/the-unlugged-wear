import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirm Your Email | The Unplugged Wear',
  description: 'Confirm the email address for your The Unplugged Wear account.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
