import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Private page: kept out of search results.
export const metadata: Metadata = {
  title: 'Reset Password | The Unplugged Wear',
  description: 'Choose a new password for your account.',
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
