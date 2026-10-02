'use client';

import React from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Button } from '@/components/ui';
import { CreditCard, Download } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <DashboardShell pageTitle="Payments">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Payment Transactions
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Review merchant settlements, gateway webhooks, and payout cycles.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={<Download size={16} />}>
          <span>Export Payouts</span>
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Settled Volume" value="$28,450" trend="↑ 12% vs last cycle" trendType="up" />
        <StatCard label="Pending Settlements" value="$3,120" subtitle="Expected in 2 days" trendType="neutral" />
        <StatCard label="Dispute Rate" value="0.04%" trend="Healthy ratio" trendType="up" />
        <StatCard label="Refunded Total" value="$140" subtitle="3 transactions" trendType="neutral" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Gateway Breakdown
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Integrated payment providers: Stripe, Razorpay, Apple Pay, Google Pay.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
