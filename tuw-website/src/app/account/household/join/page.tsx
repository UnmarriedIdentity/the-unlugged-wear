'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Button from '@storefront/components/ui/Button';
import { acceptHouseholdInviteAction } from '@/server/customer-actions';

// Opened from a household invitation email. Joining needs a button press
// (never on page load) and the signed-in account must match the invited email.
export default function JoinHouseholdPage() {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const join = () => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('error');
      setMessage('Open the invitation link from your email.');
      return;
    }
    setState('working');
    void acceptHouseholdInviteAction({ token }).then((result) => {
      if (result.ok) return setState('done');
      setState('error');
      setMessage(result.error.message);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-store-canvas">
      <Header />
      <main id="main-content" className="flex-1 max-w-md mx-auto px-4 py-12 sm:py-20 w-full">
        <div className="bg-white rounded-3xl border border-store-border p-8 shadow-xs space-y-5 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-store-text-primary">Join a household</h1>
          {state === 'done' ? (
            <div className="space-y-3">
              <p className="text-sm text-store-text-secondary">You joined the household. You can now order for its members.</p>
              <Button variant="dark" size="sm" href="/account">Go to my account</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state === 'error' && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 text-left">{message}</p>}
              <p className="text-sm text-store-text-secondary">
                Joining moves you out of your current household. Your orders, sizes and addresses stay with you.
              </p>
              <Button variant="dark" size="lg" fullWidth onClick={join} disabled={state === 'working'}>
                {state === 'working' ? 'Joining…' : 'Join household'}
              </Button>
              <p className="text-xs text-store-text-secondary"><Link href="/account" className="underline">Not now</Link></p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
