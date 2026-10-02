'use client';

import React, { useState } from 'react';
import { Save, User, Store, Check } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, sub- prefix).
// Verbatim port of SubPages.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });
import { Button, Input, ContentCard } from '@/components/ui';

export default function SettingsView() {
  const [storeName, setStoreName] = useState('Storeflow Flagship');
  const [managerName, setManagerName] = useState('Urvil Kargathala');
  const [email, setEmail] = useState('urvil.kargathala@storeflow.io');
  const [currency, setCurrency] = useState('USD ($)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <DashboardShell pageTitle="Settings" activeNav="settings">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Store Settings</h2>
          <p className={styles.pageSubtitle}>Configure store information, manager credentials, and preferences.</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="md"
            icon={saved ? <Check size={16} /> : <Save size={16} />}
            onClick={handleSave}
          >
            <span>{saved ? 'Saved Successfully' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Store Information Card */}
        <ContentCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Store size={20} color="var(--tuw-action-primary, #7539FF)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0, fontFamily: 'var(--font-main)' }}>
              General Store Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Input
              label="Store Name"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', fontFamily: 'var(--font-main)' }}>
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  height: '44px',
                  borderRadius: 'var(--tuw-radius-control, 8px)',
                  border: '1px solid var(--tuw-border-control, #90979F)',
                  padding: '0 14px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-main)',
                  color: 'var(--tuw-text-primary, #262626)',
                  backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>CAD ($)</option>
                <option>INR (₹)</option>
              </select>
            </div>
          </div>
        </ContentCard>

        {/* Manager Profile Card */}
        <ContentCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} color="var(--tuw-action-primary, #7539FF)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0, fontFamily: 'var(--font-main)' }}>
              Manager Profile
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Input
              label="Full Name"
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </ContentCard>
      </div>
    </DashboardShell>
  );
}
