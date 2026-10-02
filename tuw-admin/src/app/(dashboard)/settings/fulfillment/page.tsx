'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, Button, Input } from '@/components/ui';
import { Truck, Save, Check, ArrowLeft } from 'lucide-react';

export default function FulfillmentSettingsPage() {
  const [partnerApiKey, setPartnerApiKey] = useState('tuw_live_prn_771892801');
  const [leadDays, setLeadDays] = useState('2');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell pageTitle="Fulfillment Settings" activeNav="settings">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/settings" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Settings
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Fulfillment & 3PL Integration
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Configure print-on-demand webhooks, automated packing slips, and 3PL warehouse sync.
          </p>
        </div>
        <Button variant="primary" size="md" icon={saved ? <Check size={16} /> : <Save size={16} />} onClick={handleSave}>
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            3PL Warehouse API
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Input label="Webhook Secret" value={partnerApiKey} onChange={(e) => setPartnerApiKey(e.target.value)} />
            <Input label="Default Production Lead Time (Days)" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} />
          </div>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
