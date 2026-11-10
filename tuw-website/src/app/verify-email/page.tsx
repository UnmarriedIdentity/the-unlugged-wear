'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Button from '@storefront/components/ui/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyEmailAction } from '@/server/auth-actions';

// Confirms the email with a button press (POST), never on page load, so link
// scanners in mail apps cannot use up the one-time link.
export default function VerifyEmailPage() {
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const confirm = () => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('error');
      setMessage('Open the confirmation link from your email.');
      return;
    }
    setState('working');
    void verifyEmailAction({ token }).then((result) => {
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
          <h1 className="text-2xl font-medium tracking-tight text-store-text-primary">Confirm your email</h1>
          {state === 'done' ? (
            <div className="space-y-3">
              <CheckCircle2 size={28} className="mx-auto text-green-700" aria-hidden="true" />
              <p className="text-sm text-store-text-secondary">Your email is confirmed. Thank you.</p>
              <Button variant="dark" size="sm" href="/account">Go to my account</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state === 'error' && (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 text-left">
                  <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {message}
                </p>
              )}
              <p className="text-sm text-store-text-secondary">Press the button to confirm this email address for your account.</p>
              <Button variant="dark" size="lg" fullWidth onClick={confirm} disabled={state === 'working'}>
                {state === 'working' ? 'Confirming…' : 'Confirm email'}
              </Button>
              <p className="text-xs text-store-text-secondary">
                Link expired? <Link href="/account" className="underline">Sign in</Link> to request a new one.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
