'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import Button from '@storefront/components/ui/Button';
import Modal from '@storefront/components/ui/Modal';
import Input from '@storefront/components/ui/Input';
import { getReviewsAction, submitReviewAction } from '@/server/catalog-actions';

export interface ProductReviewsProps {
  productId: string;
  productTitle?: string;
}

type Loaded = Extract<Awaited<ReturnType<typeof getReviewsAction>>, { ok: true }>['data'];

const Stars = ({ rating }: { rating: number }) => (
  <span className="text-store-gold text-sm tracking-tight" role="img" aria-label={`${rating} out of 5 stars`}>
    {'★'.repeat(Math.round(rating))}<span className="text-store-card-border">{'★'.repeat(5 - Math.round(rating))}</span>
  </span>
);

// Real reviews only (AGENTS §3): written by customers who received the
// product, published after staff approve them. No sample data, ever.
export default function ProductReviews({ productId, productTitle = 'this piece' }: ProductReviewsProps) {
  const [data, setData] = useState<Loaded | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = React.useCallback(() => {
    void getReviewsAction({ productId }).then((r) => { if (r.ok) setData(r.data); });
  }, [productId]);
  useEffect(load, [load]);

  const start = () => {
    if (data?.mine) setForm({ rating: data.mine.rating, title: data.mine.title, body: data.mine.body });
    setSent(false);
    setErrors({});
    setFormError('');
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = await submitReviewAction({ productId, ...form });
    setSaving(false);
    if (!result.ok) {
      setErrors(Object.fromEntries(result.error.details.filter((d) => d.field).map((d) => [d.field!, d.message])));
      if (!result.error.details.length) setFormError(result.error.message);
      return;
    }
    setSent(true);
    load();
  };

  const summary = data?.summary;
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="my-16 pt-8 border-t border-store-card-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 id="reviews-heading" className="font-heading text-2xl font-medium text-store-charcoal">Reviews</h2>
        {data?.canReview && (
          <Button variant="dark" size="md" onClick={start} icon={<MessageSquare size={16} />}>
            {data.mine ? 'Edit your review' : 'Write a review'}
          </Button>
        )}
      </div>

      {data?.mine && !data.mine.approved && (
        <p role="status" className="mt-4 text-sm text-store-text-secondary">Thanks — your review is waiting for approval.</p>
      )}

      {!summary || summary.count === 0 ? (
        <div className="mt-6 p-8 border border-store-card-border bg-store-surface flex flex-col sm:flex-row sm:items-center gap-4">
          <MessageSquare size={24} className="text-store-text-secondary shrink-0" aria-hidden="true" />
          <p className="text-sm text-store-text-secondary">
            No reviews yet. Reviews come from customers who have received this piece.
            {data && !data.signedIn && <> Bought it? <Link href="/login" className="underline">Sign in</Link> to review it.</>}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 p-6 bg-store-cream border border-store-card-border space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-medium font-heading text-store-text-primary tuw-tabular-nums">{summary.average.toFixed(1)}</span>
              <div>
                <Stars rating={summary.average} />
                <span className="text-xs text-store-text-secondary block mt-0.5">{summary.count} review{summary.count === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs text-store-text-secondary">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const n = summary.distribution[star];
                const pct = Math.round((n / summary.count) * 100);
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-12 shrink-0">{star} star{star === 1 ? '' : 's'}</span>
                    <div className="flex-1 h-2 bg-store-card-border overflow-hidden"><div className="h-full bg-store-charcoal" style={{ width: `${pct}%` }} /></div>
                    <span className="w-8 text-right tuw-tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <ul className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.reviews.map((r) => (
              <li key={r.id} className="p-5 bg-store-surface border border-store-card-border">
                <div className="flex items-center justify-between mb-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-store-text-secondary">{r.date}</span>
                </div>
                <h3 className="text-sm font-medium text-store-charcoal mb-1.5">{r.title}</h3>
                <p className="text-sm text-store-text-secondary leading-relaxed whitespace-pre-wrap">{r.body}</p>
                <p className="mt-3 pt-3 border-t border-store-card-border text-xs text-store-charcoal">{r.author}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Review ${productTitle}`} maxWidth="max-w-lg">
        {sent ? (
          <p role="status" className="py-8 text-center text-sm text-store-text-secondary">Thank you. Your review will appear once it has been approved.</p>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4 pt-2">
            {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
            <fieldset>
              <legend className="text-sm font-medium text-store-charcoal mb-1">Your rating</legend>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" aria-label={`${star} star${star === 1 ? '' : 's'}`} aria-pressed={form.rating === star} onClick={() => setForm({ ...form, rating: star })}
                    className={`text-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold ${star <= form.rating ? 'text-store-gold' : 'text-store-card-border'}`}>★</button>
                ))}
              </div>
              {errors.rating && <p role="alert" className="text-sm text-red-700 mt-1">{errors.rating}</p>}
            </fieldset>
            <Input label="Headline" value={form.title} error={errors.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div>
              <label htmlFor="review-body" className="text-sm font-medium text-store-charcoal block mb-1">Your review</label>
              <textarea id="review-body" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} aria-invalid={Boolean(errors.body)}
                className="w-full p-3 border border-store-card-border bg-store-surface text-sm text-store-text-primary focus:outline-none focus:border-store-charcoal resize-none" />
              {errors.body && <p role="alert" className="text-sm text-red-700 mt-1">{errors.body}</p>}
            </div>
            <Button variant="dark" size="md" type="submit" disabled={saving}>{saving ? 'Sending…' : 'Submit review'}</Button>
          </form>
        )}
      </Modal>
    </section>
  );
}
