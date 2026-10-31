'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import AuthShell, { AuthField, PasswordToggle } from '@storefront/components/layout/AuthShell';
import { DEMO_ACCOUNT, checkDemoCredentials, writeDemoSession } from '@storefront/mocks/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only same-site paths are honoured, so ?next= cannot redirect off the store.
function safeNextPath(): string {
  if (typeof window === 'undefined') return '/account';
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');

  const fillDemoAccount = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    setErrors({});
    setFormError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address, like you@example.com.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setFormError('');
    if (nextErrors.email) return emailRef.current?.focus();
    if (nextErrors.password) return passwordRef.current?.focus();

    setIsLoading(true);
    setTimeout(() => {
      const session = checkDemoCredentials(email, password);
      if (!session) {
        // Keep what was typed so it can be corrected.
        setIsLoading(false);
        setFormError('That email and password do not match the demo account.');
        passwordRef.current?.focus();
        return;
      }
      // "Remember me" keeps the sign-in in this browser, otherwise it lasts for this tab.
      writeDemoSession(session, rememberMe);
      router.push(safeNextPath());
    }, 500);
  };

  return (
    <AuthShell
      imageSrc="/images/login-hero.webp"
      imageAlt="Two people in tailored autumn outfits walking arm in arm down a city street"
      imagePosition="50% 0%"
      eyebrow="Slow Living Atelier"
      caption="Everyday hoodies and tees, printed to order with zero deadstock."
      title="Welcome back"
      intro="Log in to see your orders, saved pieces and addresses."
      demoNotice="Demo sign-in: only the demo account can log in, and nothing is sent to a server."
    >
      <button
        type="button"
        onClick={fillDemoAccount}
        className="w-full h-11 rounded-xl border border-store-border text-sm font-medium text-store-text-primary hover:border-store-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
      >
        Fill in the demo account
      </button>

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {formError}
          </p>
        )}

        <AuthField
          ref={emailRef}
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <AuthField
          ref={passwordRef}
          id="login-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          endSlot={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label htmlFor="login-remember" className="inline-flex items-center gap-2 min-h-6 cursor-pointer select-none text-store-text-secondary">
            <input
              id="login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-store-border accent-primary-dark"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="inline-flex items-center min-h-6 text-store-text-secondary hover:text-primary-dark hover:underline">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary-dark text-white font-medium text-sm tracking-wide hover:bg-black transition-colors flex items-center justify-center disabled:opacity-60 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
        >
          {isLoading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-store-text-secondary text-center">
        New to The Unplugged Wear?{' '}
        <Link href="/register" className="font-semibold text-primary-dark hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
