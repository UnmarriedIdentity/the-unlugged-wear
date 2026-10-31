'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Info } from 'lucide-react';
import TuwEmblem from './TuwEmblem';

// Shared split layout for the sign-in and sign-up pages: brand photo on the
// left (desktop only), form on the right, with an always-visible demo notice.

export interface AuthShellProps {
  imageSrc: string;
  imageAlt: string;
  /** CSS object-position for the photo, so the garment stays in frame. */
  imagePosition?: string;
  eyebrow: string;
  caption: string;
  title: string;
  intro: string;
  demoNotice: string;
  children: React.ReactNode;
}

export default function AuthShell({
  imageSrc,
  imageAlt,
  imagePosition = '50% 20%',
  eyebrow,
  caption,
  title,
  intro,
  demoNotice,
  children,
}: AuthShellProps) {
  return (
    <div className="w-screen h-screen min-h-screen bg-store-surface text-store-text-primary flex flex-col lg:flex-row overflow-hidden">
      {/* Brand photo (desktop): framed with padding so the photo is never
          cropped against the browser edge; anchored per image to keep heads in view. */}
      <div className="hidden lg:block w-1/2 h-full p-4 xl:p-6 bg-store-surface select-none">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-store-cream flex flex-col justify-end">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="50vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />

          {/* Crest and caption sit together at the bottom so faces at the top stay clear */}
          <div className="relative z-10 p-6 xl:p-8 space-y-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-3">
              <TuwEmblem className="h-8 w-auto text-white drop-shadow-md" />
              <span className="font-heading uppercase tracking-luxury text-sm font-semibold text-white drop-shadow-sm">
                The Unplugged Wear
              </span>
            </Link>
            <p className="font-heading uppercase tracking-wider text-xs text-white/90 drop-shadow-sm">{eyebrow}</p>
            <p className="font-sans text-sm text-white/85 drop-shadow-sm leading-relaxed max-w-md">{caption}</p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="w-full lg:w-1/2 h-full bg-store-surface flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-8 lg:py-12 overflow-y-auto">
        <div className="w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 lg:invisible" aria-label="The Unplugged Wear - Homepage">
            <TuwEmblem className="h-7 w-auto text-store-text-primary" />
            {/* Phones show the emblem only so the bar stays on one line */}
            <span className="hidden sm:inline font-heading uppercase tracking-luxury text-xs font-semibold text-store-text-primary whitespace-nowrap">
              The Unplugged Wear
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-6 text-sm font-medium text-store-text-secondary hover:text-store-text-primary transition-colors whitespace-nowrap"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Return to store</span>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6 space-y-5">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-medium tracking-tight text-store-text-primary leading-tight">
              {title}
            </h1>
            <p className="font-sans text-sm text-store-text-secondary leading-relaxed">{intro}</p>
          </div>

          {/* Truthful demo feedback (project rule): shown before any input */}
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-store-gold/40 bg-store-cream px-3.5 py-3 text-sm text-store-text-primary"
          >
            <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-store-gold" />
            <p>{demoNotice}</p>
          </div>

          {children}
        </div>

        <div className="w-full pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-store-text-secondary border-t border-store-border/40">
          <span>The Unplugged Wear © {new Date().getFullYear()}</span>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/policies/privacy" className="inline-flex items-center min-h-6 hover:underline">Privacy</Link>
            <Link href="/policies/terms" className="inline-flex items-center min-h-6 hover:underline">Terms</Link>
            <Link href="/faq" className="inline-flex items-center min-h-6 hover:underline">Help</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

export interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Control rendered inside the right edge of the input (e.g. show password). */
  endSlot?: React.ReactNode;
}

/** Labelled input with an inline hint and error, wired up for screen readers. */
export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, error, hint, endSlot, className = '', ...inputProps },
  ref
) {
  // The hint is replaced by the error, so only reference whichever is rendered.
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium uppercase tracking-wider text-store-text-primary">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={`w-full h-11 ${endSlot ? 'pl-4 pr-11' : 'px-4'} rounded-xl border bg-store-surface text-base sm:text-sm text-store-text-primary placeholder:text-store-text-secondary focus:outline-none focus:ring-2 transition-colors ${
            error ? 'border-red-400 focus:ring-red-500' : 'border-store-border focus:ring-primary-dark'
          } ${className}`}
          {...inputProps}
        />
        {endSlot}
      </div>
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-red-700">
          <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-store-text-secondary">
          {hint}
        </p>
      )}
    </div>
  );
});

/** Eye toggle for password fields, sized to a 28px target. */
export function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      aria-pressed={shown}
      className="absolute right-2.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-store-text-secondary hover:text-store-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold cursor-pointer"
    >
      {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
    </button>
  );
}
