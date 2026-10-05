'use client';

import React, { useState } from 'react';
import { Save, Store, Palette, CreditCard, Truck, Receipt, Bell, ShieldCheck, Check, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Button, Input, ContentCard, Badge, Switch } from '@/components/ui';
import { useAdminState } from '@/mocks/state';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

type SettingsTab = 'general' | 'brand' | 'payments' | 'fulfillment' | 'shipping' | 'taxes' | 'notifications';

export default function SettingsView() {
  const { settings, updateSettings, canPerformAction, resetDemoData } = useAdminState();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Form states initialized from mock state
  const [storeName, setStoreName] = useState(settings.storeName);
  const [legalEntity, setLegalEntity] = useState(settings.legalEntity);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [timezone, setTimezone] = useState(settings.timezone);

  const [tagline, setTagline] = useState(settings.brandTagline);
  const [brandColor, setBrandColor] = useState(settings.brandColor);

  const [qikinkEnv, setQikinkEnv] = useState(settings.qikinkEnvironment);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(String(settings.freeShippingThreshold));
  const [standardShippingFee, setStandardShippingFee] = useState(String(settings.standardShippingFee));
  const [taxIncluded, setTaxIncluded] = useState(settings.taxIncluded);
  const [notifyEmail, setNotifyEmail] = useState(settings.orderNotificationEmail);

  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPerformAction('settings')) return;

    updateSettings({
      storeName,
      legalEntity,
      supportEmail,
      defaultCurrency: currency,
      timezone,
      brandTagline: tagline,
      brandColor,
      qikinkEnvironment: qikinkEnv,
      freeShippingThreshold: parseFloat(freeShippingThreshold) || 150,
      standardShippingFee: parseFloat(standardShippingFee) || 12,
      taxIncluded,
      orderNotificationEmail: notifyEmail,
    });

    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  return (
    <DashboardShell pageTitle="Settings" activeNav="settings">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Store Settings & Governance</h2>
          <p className={styles.pageSubtitle}>
            Configure multi-region store details, partner API connections, taxes, and notification policies.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="md"
            icon={savedSuccess ? <Check size={16} /> : <Save size={16} />}
            onClick={handleSave}
          >
            <span>{savedSuccess ? 'Saved to Memory' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Unsaved changes warning bar */}
      {isDirty && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)',
            border: '1px solid rgba(133, 99, 0, 0.25)',
            borderRadius: 'var(--tuw-radius-control, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--tuw-text-warning, #856300)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>You have unsaved changes. Navigating away will discard these local modifications.</span>
          </div>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Now
          </Button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'general', label: 'General', icon: <Store size={15} /> },
          { id: 'brand', label: 'Brand & Visuals', icon: <Palette size={15} /> },
          { id: 'payments', label: 'Payments', icon: <CreditCard size={15} /> },
          { id: 'fulfillment', label: 'Fulfillment & APIs', icon: <Truck size={15} /> },
          { id: 'shipping', label: 'Shipping Rules', icon: <Truck size={15} /> },
          { id: 'taxes', label: 'Taxes', icon: <Receipt size={15} /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.id ? 'var(--tuw-bg-surface, #FFFFFF)' : 'transparent',
              color: activeTab === tab.id ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: activeTab === tab.id ? '2px solid var(--tuw-action-primary, #7539FF)' : '2px solid transparent',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div style={{ marginTop: 16 }}>
        {/* 1. GENERAL TAB */}
        {activeTab === 'general' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              General Storefront Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Input
                label="Store Display Name"
                value={storeName}
                onChange={(e) => { setStoreName(e.target.value); markDirty(); }}
                helperText="Brand title presented in headers and notification footers"
              />
              <Input
                label="Legal Operating Entity"
                value={legalEntity}
                onChange={(e) => { setLegalEntity(e.target.value); markDirty(); }}
                helperText="Entity referenced in invoices, customs, and merchant agreements"
              />
              <Input
                label="Customer Support Email"
                value={supportEmail}
                onChange={(e) => { setSupportEmail(e.target.value); markDirty(); }}
                helperText="Recipient for inbound ticket routing"
              />
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                  Default Store Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value); markDirty(); }}
                  style={{ width: '100%', height: 40, borderRadius: 8, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 10px', fontSize: 13 }}
                >
                  <option value="USD ($)">USD ($) — United States Dollar</option>
                  <option value="GBP (£)">GBP (£) — British Pound</option>
                  <option value="EUR (€)">EUR (€) — Eurozone</option>
                  <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
                  Collapsed badge dots (preview)
                </h4>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0' }}>
                  Show count dots on collapsed sidebar icons to compare both options.
                </p>
              </div>
              <Switch
                label=""
                checked={settings.showCollapsedBadgeDots ?? false}
                onChange={(checked) => updateSettings({ showCollapsedBadgeDots: checked })}
              />
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
                  Demo Sandbox Environment
                </h4>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0' }}>
                  Reset all operational mutations, mock orders, and staff changes back to default baseline fixtures.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={14} />}
                onClick={() => {
                  if (window.confirm('Reset all demo data back to baseline fixtures?')) {
                    resetDemoData();
                  }
                }}
              >
                Reset Demo State
              </Button>
            </div>
          </ContentCard>
        )}

        {/* 2. BRAND TAB */}
        {activeTab === 'brand' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              Brand & Design System Parameters
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Input
                label="Brand Tagline"
                value={tagline}
                onChange={(e) => { setTagline(e.target.value); markDirty(); }}
              />
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>
                  Primary Accent Token
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => { setBrandColor(e.target.value); markDirty(); }}
                    style={{ width: 44, height: 40, border: 'none', cursor: 'pointer', borderRadius: 6 }}
                  />
                  <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{brandColor}</span>
                  <Badge variant="info">Figma Node 1:26969</Badge>
                </div>
              </div>
            </div>
          </ContentCard>
        )}

        {/* 3. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              Merchant Gateways (Simulated Connection Previews)
            </h3>
            <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 8, fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', marginBottom: 16 }}>
              <ShieldCheck size={16} color="var(--tuw-action-primary, #7539FF)" style={{ display: 'inline', marginRight: 6 }} />
              Credentials and live secret keys are kept strictly out of frontend demonstration environments.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>Stripe Connect API</div>
                  <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 2 }}>
                    Connection Status: <strong style={{ color: 'var(--tuw-text-success, #187343)' }}>Connected (Mock Mode)</strong> · Webhook endpoint active
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>Apple Pay & Google Pay Express</div>
                  <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 2 }}>
                    Domain token verification passed for storefront checkout
                  </div>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          </ContentCard>
        )}

        {/* 4. FULFILLMENT TAB */}
        {activeTab === 'fulfillment' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              On-Demand Print Partner Integrations
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>Qikink Direct API</span>
                  <Badge variant="info">{qikinkEnv.toUpperCase()}</Badge>
                </div>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  Automated routing for heavy tees and embroidered hoodies.
                </p>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--tuw-text-secondary, #5D6772)', display: 'block', marginBottom: 4 }}>
                    Environment Mode
                  </label>
                  <select
                    value={qikinkEnv}
                    onChange={(e) => { setQikinkEnv(e.target.value as 'sandbox' | 'production'); markDirty(); }}
                    style={{ width: '100%', height: 36, borderRadius: 6, border: '1px solid var(--tuw-border-control, #90979F)', padding: '0 8px', fontSize: 13 }}
                  >
                    <option value="sandbox">Sandbox (Simulated floor tests)</option>
                    <option value="production">Production Floor Queue</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>Printrove Hub</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                  Secondary overflow printer for accessories and caps.
                </p>
              </div>
            </div>
          </ContentCard>
        )}

        {/* 5. SHIPPING TAB */}
        {activeTab === 'shipping' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              Shipping Rules & Thresholds
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Input
                label="Free Shipping Minimum Threshold ($ USD)"
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => { setFreeShippingThreshold(e.target.value); markDirty(); }}
                helperText="Orders with subtotal exceeding this amount receive zero shipping fees"
              />
              <Input
                label="Standard Flat Rate Shipping Fee ($ USD)"
                type="number"
                value={standardShippingFee}
                onChange={(e) => { setStandardShippingFee(e.target.value); markDirty(); }}
                helperText="Applied to domestic and global standard deliveries"
              />
            </div>
          </ContentCard>
        )}

        {/* 6. TAXES TAB */}
        {activeTab === 'taxes' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 16 }}>
              Tax Calculation Policy
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={taxIncluded}
                  onChange={(e) => { setTaxIncluded(e.target.checked); markDirty(); }}
                  style={{ width: 18, height: 18 }}
                />
                <span>Prices shown on storefront include VAT / Sales Tax (European & UK model)</span>
              </label>
              <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                Demonstration setting only. Real tax rates depend on nexus calculation and merchant location.
              </p>
            </div>
          </ContentCard>
        )}

        {/* 7. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <ContentCard>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
              Operational Alerts & Webhooks
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
              <Input
                label="Daily Digest Dispatch Email"
                value={notifyEmail}
                onChange={(e) => { setNotifyEmail(e.target.value); markDirty(); }}
                helperText="Receives automated fulfillment exception summaries"
              />
            </div>
          </ContentCard>
        )}
      </div>
    </DashboardShell>
  );
}
