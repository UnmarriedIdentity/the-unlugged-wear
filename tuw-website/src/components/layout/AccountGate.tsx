'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { useDemoSession } from '@/mocks/auth';

// Account pages need the demo sign-in. Until the session has been read, render
// nothing so a signed-in visitor never sees the prompt flash.
export default function AccountGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useDemoSession();
  const pathname = usePathname() || '/account';

  if (!ready) return <div className="min-h-screen bg-store-canvas" aria-busy="true" />;
  if (session) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-store-cream flex items-center justify-center mx-auto text-store-text-secondary">
            <Lock size={24} aria-hidden="true" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-medium text-store-text-primary">
            Log in to see your account
          </h1>
          <p className="text-sm text-store-text-secondary leading-relaxed">
            Your orders, addresses and returns are kept behind the demo sign-in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl bg-primary-dark text-white text-sm font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
            >
              Log in
            </Link>
            <Link
              href="/track-order"
              className="inline-flex items-center min-h-6 text-sm text-store-text-secondary hover:text-store-text-primary hover:underline"
            >
              Track an order without logging in
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
