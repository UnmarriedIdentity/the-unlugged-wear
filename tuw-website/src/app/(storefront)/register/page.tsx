'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell, { AuthField, PasswordToggle } from '@/components/layout/AuthShell';
import { writeDemoSession } from '@/mocks/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

type Field = 'name' | 'email' | 'password' | 'confirm';

export default function RegisterPage() {
  const router = useRouter();
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<Field, string>> = {};
    if (!name.trim()) nextErrors.name = 'Enter your name.';
    if (!email.trim()) nextErrors.email = 'Enter your email address.';
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address, like you@example.com.';
    if (password.length < MIN_PASSWORD) nextErrors.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (!confirmPassword) nextErrors.confirm = 'Re-enter your password.';
    else if (confirmPassword !== password) nextErrors.confirm = 'Passwords do not match.';
    setErrors(nextErrors);

    const firstInvalid = (['name', 'email', 'password', 'confirm'] as Field[]).find((f) => nextErrors[f]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      writeDemoSession({ name: name.trim(), email: email.trim() }, true);
      router.push('/account');
    }, 500);
  };

  return (
    <AuthShell
      imageSrc="/images/register-hero.png"
      imageAlt="Woman in a white shirt and jeans seated at a café table"
      imagePosition="50% 0%"
      eyebrow="Join The Unplugged Wear"
      caption="Everyday hoodies and tees, printed to order with zero deadstock."
      title="Create your account"
      intro="Save your favourite pieces, keep track of orders and check out faster."
      demoNotice="Demo sign-up: no real account is created and no email is sent. You stay signed in on this browser; to log in again later, use the demo account."
    >
      <form onSubmit={handleRegister} noValidate className="space-y-4">
        <AuthField
          ref={refs.name}
          id="register-name"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <AuthField
          ref={refs.email}
          id="register-email"
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
          ref={refs.password}
          id="register-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`Use at least ${MIN_PASSWORD} characters.`}
          error={errors.password}
          endSlot={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
        />

        <AuthField
          ref={refs.confirm}
          id="register-confirm-password"
          label="Confirm password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirm}
          endSlot={
            <PasswordToggle shown={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
          }
        />

        <p className="text-xs text-store-text-secondary leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/policies/terms" className="underline font-medium text-primary-dark hover:text-black">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/policies/privacy" className="underline font-medium text-primary-dark hover:text-black">
            Privacy Policy
          </Link>{' '}
          (both drafts).
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-xl bg-primary-dark text-white font-medium text-sm tracking-wide hover:bg-black transition-colors flex items-center justify-center disabled:opacity-60 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold focus-visible:ring-offset-2"
        >
          {isLoading ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-store-text-secondary text-center">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary-dark hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
