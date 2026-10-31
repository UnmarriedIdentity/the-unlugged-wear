import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Forgot Password | The Unplugged Wear',
  description: 'Request a password reset link.',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
