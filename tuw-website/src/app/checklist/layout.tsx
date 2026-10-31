import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Internal QA page: available in development, or on a deployment that sets
// TUW_INTERNAL_PAGES=1 at build time (these pages prerender). Hidden (404) otherwise.
export const metadata: Metadata = {
  title: 'UI Checklist (internal) | The Unplugged Wear',
  robots: { index: false, follow: false },
};

export default function ChecklistLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.TUW_INTERNAL_PAGES !== '1') {
    notFound();
  }
  return children;
}
