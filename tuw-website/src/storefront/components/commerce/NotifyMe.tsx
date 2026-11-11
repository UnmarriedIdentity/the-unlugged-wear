'use client';

import React, { useState } from 'react';
import { notifyMeAction } from '@/server/catalog-actions';
import Button from '@storefront/components/ui/Button';
import Input from '@storefront/components/ui/Input';

export interface NotifyMeProps {
  productId: string;
  color?: string;
  size: string;
}

/** "Notify me" for a sold-out option. Keeps what was typed if the request fails. */
export default function NotifyMe({ productId, color, size }: NotifyMeProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError(null);
    const result = await notifyMeAction({ productId, color, size, email });
    if (result.ok) return setStatus('done');
    setStatus('idle');
    setError(result.error.details[0]?.message ?? result.error.message);
  };

  if (status === 'done') {
    return (
      <p role="status" className="p-4 bg-store-cream border border-store-card-border text-sm text-store-charcoal">
        We&rsquo;ll let you know at {email} when {size} is back. Demo: no email is sent until the email provider is connected.
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="p-4 bg-store-cream border border-store-card-border space-y-3">
      <p className="text-sm font-medium text-store-charcoal">Sold out in {size}. Get an email when it&rsquo;s back.</p>
      <Input
        id="notify-me-email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
      />
      <Button type="submit" variant="dark" size="md" fullWidth disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : 'Notify me'}
      </Button>
    </form>
  );
}
