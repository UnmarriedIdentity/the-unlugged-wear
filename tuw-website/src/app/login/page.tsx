'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('arjun.rao@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      setIsLoading(false);
      // Demo authentication simulation
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
            { label: 'Sign In' },
          ]}
        />

        <div className="bg-white rounded-3xl border border-[#E2DDCF] p-8 shadow-xs my-6 space-y-6">
          <div className="space-y-1 text-center">
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
              Member Sanctuary
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1A1A]">
              Sign in to Your Account
            </h1>
            <p className="text-xs text-[#666]">
              Access saved shipping addresses and POD order histories.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-[#5A5A5A] uppercase tracking-wider text-[11px]">Password</span>
                <Link
                  href="/forgot-password"
                  className="text-[#7539FF] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                Sign In (Demo Account)
              </Button>
            </div>
          </form>

          <div className="pt-4 border-t border-[#E2DDCF] text-center text-xs text-[#666]">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="font-bold text-[#1A1A1A] underline">
              Create an account
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E2DDCF] text-[11px] text-[#8A8A8A] flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#10B981] shrink-0" />
            <span>Pre-filled with demo credentials for instant review.</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
