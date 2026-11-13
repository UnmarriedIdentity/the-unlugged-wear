'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Badge, Button, ContentCard, PageHeader } from '@/components/ui';
import type { AdminReview } from '@tuw/heart/modules/catalog';
import { deleteReviewAction, moderateReviewAction } from '@/server/catalog-actions';

export default function ReviewsView({ initialReviews }: { initialReviews: AdminReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const run = async (work: () => ReturnType<typeof moderateReviewAction>, done: string) => {
    if (busy) return;
    setBusy(true);
    const result = await work();
    setBusy(false);
    if (!result.ok) return setNotice({ tone: 'error', text: result.error.message });
    setReviews(result.data.reviews);
    setNotice({ tone: 'ok', text: result.data.storefront.ok ? `${done} The storefront is up to date.` : `${done} ${result.data.storefront.reason} Shoppers will see it within the hour.` });
  };

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <DashboardShell pageTitle="Reviews" activeNav="products">
      <PageHeader
        title="Product Reviews"
        eyebrow={<Link href="/products" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><ArrowLeft size={14} /> Back to Products</Link>}
      />
      {notice && <div role={notice.tone === 'error' ? 'alert' : 'status'} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: notice.tone === 'error' ? 'var(--tuw-bg-error, #FEF4F4)' : 'var(--tuw-bg-success, #F3FAF6)', color: notice.tone === 'error' ? 'var(--tuw-text-error, #C91818)' : 'var(--tuw-text-success, #187343)' }}>{notice.text}</div>}
      <ContentCard>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          {reviews.length === 0 ? 'No reviews yet. Customers can review a product once it has been delivered to them.' : `${pending} waiting for approval, ${reviews.length - pending} live.`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span aria-label={`${r.rating} out of 5 stars`} style={{ fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <Badge variant={r.approved ? 'success' : 'warning'}>{r.approved ? 'Live' : 'Waiting'}</Badge>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                <p style={{ margin: '4px 0 8px', fontSize: 13, whiteSpace: 'pre-wrap' }}>{r.body}</p>
                <div style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{r.productName} · {r.author} ({r.email}) · {r.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Button variant={r.approved ? 'secondary' : 'primary'} size="sm" disabled={busy} onClick={() => void run(() => moderateReviewAction({ id: r.id, approved: !r.approved }), r.approved ? 'Review hidden.' : 'Review approved.')}>{r.approved ? 'Hide' : 'Approve'}</Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (window.confirm('Delete this review? This cannot be undone.')) void run(() => deleteReviewAction({ id: r.id }), 'Review deleted.'); }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
