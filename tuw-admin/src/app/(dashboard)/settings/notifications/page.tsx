'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, Button, Input } from '@/components/ui';
import { Bell, Save, Check, ArrowLeft } from 'lucide-react';

export default function NotificationsSettingsPage() {
  const [orderAlertsEmail, setOrderAlertsEmail] = useState('orders@theunpluggedwear.com');
  const [smsSenderId, setSmsSenderId] = useState('UNPLUGGED');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell pageTitle="Notification Settings" activeNav="settings">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/settings" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Settings
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Notification Triggers
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Configure transactional customer emails, staff alerts, and SMS shipping notifications.
          </p>
        </div>
        <Button variant="primary" size="md" icon={saved ? <Check size={16} /> : <Save size={16} />} onClick={handleSave}>
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Email & SMS Routing
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Input label="Order Alert Recipient" value={orderAlertsEmail} onChange={(e) => setOrderAlertsEmail(e.target.value)} />
            <Input label="SMS Alphanumeric Sender ID" value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} />
          </div>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
