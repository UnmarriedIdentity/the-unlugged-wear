'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, Button, Input } from '@/components/ui';
import { Sparkles, Save, Check, ArrowLeft } from 'lucide-react';

export default function BrandSettingsPage() {
  const [brandName, setBrandName] = useState('The Unplugged Wear');
  const [tagline, setTagline] = useState('Mindful modern essentials');
  const [primaryColor, setPrimaryColor] = useState('#7539FF');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardShell pageTitle="Brand Identity Settings" activeNav="settings">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/settings" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Settings
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Brand Identity & Assets
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Configure logo lockups, favicon, brand palette tokens, and social graph cards.
          </p>
        </div>
        <Button variant="primary" size="md" icon={saved ? <Check size={16} /> : <Save size={16} />} onClick={handleSave}>
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Storefront Identity
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Input label="Brand Display Name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            <Input label="Brand Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            <Input label="Primary Accent Hex" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          </div>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
