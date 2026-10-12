'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, Button, Input, PageHeader } from '@/components/ui';
import { CreditCard, Save, Check, ArrowLeft } from 'lucide-react';

export default function PaymentSettingsPage() {
  const [stripeAccount, setStripeAccount] = useState('acct_1NZtuw9921849');
  const [currency, setCurrency] = useState('USD ($)');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell pageTitle="Payment Gateway Settings" activeNav="settings">
      <PageHeader
        title="Payment Gateways"
        eyebrow={
          <Link href="/settings" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={14} /> Back to Settings
          </Link>
        }
        actions={
          <Button variant="primary" size="md" icon={saved ? <Check size={16} /> : <Save size={16} />} onClick={handleSave}>
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        }
      />

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Stripe Integration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Input label="Connected Account ID" value={stripeAccount} onChange={(e) => setStripeAccount(e.target.value)} />
            <Input label="Store Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
