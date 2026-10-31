'use client';

import React from 'react';

/** Thin form wrapper using TUW tokens. Auth pages use their own
 *  pixel-identical LoginPage/SignUpPage; this is for future settings forms. */
export function Form({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
      {...props}
    >
      {children}
    </form>
  );
}

interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Field({ label, error, helperText, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--tuw-text-primary, #262626)',
            fontFamily: 'var(--font-main)',
          }}
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--tuw-text-error, #C91818)',
            fontFamily: 'var(--font-main)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--tuw-text-secondary, #5D6772)',
            fontFamily: 'var(--font-main)',
            marginTop: '2px',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
