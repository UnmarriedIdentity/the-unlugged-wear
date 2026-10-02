'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!termsAgreed) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/account');
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Header />

      <main className="flex-1 max-w-md mx-auto px-4 py-12 sm:py-20 w-full">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Register' },
          ]}
        />

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 shadow-xs my-6 space-y-6">
          <div className="space-y-1 text-center">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
              Join The Studio
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
              Create an Account
            </h1>
            <p className="text-xs text-[#666]">
              Store delivery preferences and enjoy frictionless demo checkout.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Kavita Rao"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="kavita@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-1">
              <Checkbox
                checked={termsAgreed}
                onChange={setTermsAgreed}
                label={
                  <span className="text-xs text-[#666]">
                    I agree to the{' '}
                    <Link href="/policies/terms" className="underline font-semibold text-[#1A1A1A]">
                      Terms of Service
                    </Link>{' '}
                    and Privacy Policy.
                  </span>
                }
              />
            </div>

            <div className="pt-2">
              <Button
                variant="dark"
                size="lg"
                fullWidth
                type="submit"
                isLoading={isLoading}
              >
                Create Account (Simulation)
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#E2DDCF] text-center text-xs text-[#666]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#1A1A1A] underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
