'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@storefront/components/layout/Header';
import Footer from '@storefront/components/layout/Footer';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import Input from '@storefront/components/ui/Input';
import Button from '@storefront/components/ui/Button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPasswordAction } from '@/server/auth-actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsSubmitting(true);
    setError(null);
    void forgotPasswordAction({ email }).then((result) => {
      setIsSubmitting(false);
      if (!result.ok) {
        setError(result.error.message); // email stays typed
        return;
      }
      setDevLink(result.data.devLink);
      setSubmitted(true);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 py-12 sm:py-20 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Account Recovery' },
          ]}
        />

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 shadow-xs my-6 space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#666]">
              Enter your email address and we will transmit a password recovery link.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Recovery Link Transmitted</h3>
              <p className="text-xs text-[#666] leading-relaxed">
                If an account exists for <strong>{email}</strong>, you will receive password reset instructions.
              </p>
              {devLink && (
                <p role="note" className="text-xs text-[#666] leading-relaxed">
                  Email delivery is not connected yet (development).{' '}
                  <a href={devLink} className="font-semibold text-[#1A1A1A] underline">Open the reset link</a>
                </p>
              )}
              <div className="pt-2">
                <Button variant="secondary" size="sm" href="/login">
                  Back to log in
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>
              )}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                variant="dark"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isSubmitting}
              >
                Send Recovery Instructions
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-[#E2DDCF] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A] hover:text-[#7539FF]"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
