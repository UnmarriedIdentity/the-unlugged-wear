import { Suspense } from 'react';

// Cache Components: the dashboard screens are still client-side demo views
// (random ids, today's date, localStorage) that must render per request, so
// they stream inside one Suspense boundary. As each module moves to the
// backend, DashboardShell's sidebar/header move up into this layout as the
// static shell and the boundaries move down to each card/table
// (admin nextjs-rendering skill; TL-BE-17.06).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>{children}</Suspense>;
}
