'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Save, Check, AlertCircle, RefreshCw, Library, ShieldCheck } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Button, Input, Textarea, Select, Switch, ContentCard, Badge, PageHeader, LinkButton } from '@/components/ui';
import type { SettingsValues, SettingKey } from '@tuw/heart/modules/settings';
import type { Provider } from '@tuw/heart/integrations/registry';
import { useAdminState } from '@/mocks/state';
import { saveSettingsAction, updateProviderAction } from '@/server/settings-actions';
import { SETTINGS_TABS, type SettingsTab } from './tabs';

// Store settings on real data (TL-BE-04). Each tab is a route; this view
// renders the tab's fields from the database values, saves through the
// guarded action and reports truthfully whether the storefront refreshed.

type FieldKind = 'text' | 'email' | 'money' | 'int' | 'bool' | 'select' | 'color' | 'textarea' | 'fixed';
interface Field {
  key: SettingKey;
  label: string;
  kind: FieldKind;
  helper?: string;
  options?: string[];
  fixedText?: string;
}

const TIMEZONES = ['Asia/Kolkata', 'UTC', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York'];

const FIELDS: Partial<Record<SettingsTab, { title: string; intro?: string; fields: Field[] }>> = {
  general: {
    title: 'Store information',
    fields: [
      { key: 'store.name', label: 'Store name', kind: 'text', helper: 'Shown in the storefront header, emails and invoices' },
      { key: 'store.legal_entity', label: 'Legal entity', kind: 'text', helper: 'Used on invoices and merchant agreements' },
      { key: 'store.support_email', label: 'Customer support email', kind: 'email', helper: 'Shown on the contact and policy pages' },
      { key: 'store.timezone', label: 'Time zone', kind: 'select', options: TIMEZONES, helper: 'Order dates and reports use this zone' },
      { key: 'store.currency', label: 'Currency', kind: 'fixed', fixedText: 'INR (₹) — Indian Rupee', helper: 'Single-currency store — prices are stored and shown in INR' },
    ],
  },
  brand: {
    title: 'Brand',
    fields: [
      { key: 'brand.tagline', label: 'Tagline', kind: 'text' },
      { key: 'brand.color', label: 'Admin accent colour', kind: 'color', helper: 'Admin workspace only — storefront purchase buttons stay charcoal' },
    ],
  },
  shipping: {
    title: 'Shipping fees',
    intro: 'Changes apply to the storefront within seconds — no deploy needed.',
    fields: [
      { key: 'shipping.free_threshold', label: 'Free delivery from (₹)', kind: 'money', helper: 'Order subtotal at or above this ships free' },
      { key: 'shipping.standard_fee', label: 'Standard delivery fee (₹)', kind: 'money', helper: 'Charged below the free-delivery amount' },
      { key: 'shipping.cod_fee', label: 'Cash on delivery fee (₹)', kind: 'money', helper: 'Added when the customer pays on delivery (0 = free)' },
    ],
  },
  taxes: {
    title: 'GST & invoice details',
    intro: 'Draft: rates and invoice format need the accountant’s sign-off before go-live.',
    fields: [
      { key: 'tax.included', label: 'Prices include GST', kind: 'bool', helper: 'Storefront prices are tax-inclusive; invoices split the GST out' },
      { key: 'invoice.seller_legal_name', label: 'Seller legal name', kind: 'text' },
      { key: 'invoice.seller_address', label: 'Seller address', kind: 'textarea' },
      { key: 'invoice.seller_state_code', label: 'GST state code', kind: 'text', helper: 'Two digits — Gujarat is 24' },
      { key: 'invoice.seller_gstin', label: 'GSTIN', kind: 'text', helper: 'Pending — tax invoices cannot be issued until this is set' },
    ],
  },
  policies: {
    title: 'Orders & policies',
    fields: [
      { key: 'orders.cancel_window_minutes', label: 'Free cancellation window (minutes)', kind: 'int', helper: 'Customers can cancel for free until the order goes to print' },
      { key: 'exchange.window_days', label: 'Exchange window (days after delivery)', kind: 'int' },
      { key: 'gift_card.validity_months', label: 'Gift card validity (months)', kind: 'int' },
      { key: 'inventory.low_stock_threshold', label: 'Low-stock alert level (units)', kind: 'int', helper: 'A product’s own threshold overrides this' },
    ],
  },
  notifications: {
    title: 'Notifications',
    fields: [{ key: 'notifications.order_email', label: 'Order alerts email', kind: 'email', helper: 'Receives new-order and fulfilment exception alerts' }],
  },
};

const paiseToRupees = (p: number) => `${Math.floor(p / 100)}.${String(p % 100).padStart(2, '0')}`;

type Draft = Record<string, string | boolean>;
function toDraft(fields: Field[], values: SettingsValues): Draft {
  const draft: Draft = {};
  for (const f of fields) {
    const v = values[f.key] as unknown;
    draft[f.key] = f.kind === 'bool' ? Boolean(v) : f.kind === 'money' ? paiseToRupees(v as number) : v == null ? '' : String(v);
  }
  return draft;
}

const PROVIDER_NOTES: Record<string, string> = {
  mock: 'Demo gateway — no money is collected.',
  qikink: 'Simulator — orders are not sent to Qikink until the integrations phase.',
  custom_atelier: 'In-house atelier — staff update each order by hand.',
  mock_email: 'Demo sender — emails are logged, not delivered.',
};

interface Notice { tone: 'ok' | 'warn' | 'error'; text: string }

export default function SettingsView({ tab, values, providers: initialProviders }: { tab: SettingsTab; values: SettingsValues; providers: Provider[] }) {
  const { resetDemoData } = useAdminState();
  const section = FIELDS[tab];
  const fields = useMemo(() => section?.fields ?? [], [section]);
  const [saved, setSaved] = useState(values);
  const initial = useMemo(() => toDraft(fields, saved), [fields, saved]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState(initialProviders);
  const [providerBusy, setProviderBusy] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<{ slug: string; text: string } | null>(null);

  const isDirty = fields.some((f) => draft[f.key] !== initial[f.key]);

  // Unsaved input survives nothing outside this page — warn before leaving.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const set = (key: string, value: string | boolean) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || !section) return;
    setSaving(true);
    const result = await saveSettingsAction({ group: tab as Exclude<SettingsTab, 'payments' | 'fulfillment'>, values: draft });
    setSaving(false);
    if (!result.ok) {
      // Values stay as typed; each field shows its own problem.
      setFieldErrors(Object.fromEntries(result.error.details.filter((d) => d.field).map((d) => [d.field!, d.message])));
      setNotice({ tone: 'error', text: result.error.message });
      return;
    }
    const next = { ...saved, ...result.data.values } as SettingsValues;
    setSaved(next);
    setDraft(toDraft(fields, next));
    setFieldErrors({});
    const { changed, storefront } = result.data;
    setNotice(
      changed.length === 0 ? { tone: 'ok', text: 'Nothing changed — the values were already saved.' }
        : storefront === null ? { tone: 'ok', text: 'Saved.' }
        : storefront.ok ? { tone: 'ok', text: 'Saved — the storefront now shows the new values.' }
        : { tone: 'warn', text: `Saved. ${storefront.reason} Shoppers will see the change within the hour.` },
    );
  };

  const toggleProvider = async (p: Provider, patch: { isActive?: boolean; environment?: 'sandbox' | 'live' }) => {
    if (providerBusy) return;
    setProviderBusy(p.slug);
    setProviderError(null);
    const result = await updateProviderAction({ slug: p.slug, ...patch });
    setProviderBusy(null);
    if (!result.ok) return setProviderError({ slug: p.slug, text: result.error.message });
    setProviders((list) => list.map((x) => result.data.find((u) => u.slug === x.slug) ?? x));
  };

  const confirmLeave = (e: React.MouseEvent) => {
    if (isDirty && !window.confirm('Discard unsaved changes on this tab?')) e.preventDefault();
  };

  const renderField = (f: Field) => {
    const common = { label: f.label, helperText: f.helper, error: fieldErrors[f.key] || undefined };
    const value = draft[f.key];
    switch (f.kind) {
      case 'fixed':
        return (
          <div key={f.key}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tuw-text-primary, #262626)', display: 'block', marginBottom: 6 }}>{f.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 10px', borderRadius: 8, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', fontSize: 13 }}>{f.fixedText}</div>
            {f.helper && <p style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)', margin: '6px 0 0' }}>{f.helper}</p>}
          </div>
        );
      case 'bool':
        return (
          <div key={f.key} style={{ gridColumn: '1 / -1' }}>
            <Switch checked={Boolean(value)} onChange={(v) => set(f.key, v)} label={f.label} description={f.helper} />
          </div>
        );
      case 'select': {
        const opts = (f.options ?? []).includes(String(value)) ? f.options! : [String(value), ...(f.options ?? [])];
        return <Select key={f.key} {...common} value={String(value)} onChange={(e) => set(f.key, e.target.value)} options={opts.map((o) => ({ label: o, value: o }))} />;
      }
      case 'textarea':
        return <div key={f.key} style={{ gridColumn: '1 / -1' }}><Textarea {...common} rows={3} value={String(value)} onChange={(e) => set(f.key, e.target.value)} /></div>;
      case 'color':
        return (
          <div key={f.key}>
            <Input {...common} value={String(value)} onChange={(e) => set(f.key, e.target.value)} />
            <input type="color" aria-label={`${f.label} picker`} value={/^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value) : '#000000'} onChange={(e) => set(f.key, e.target.value.toUpperCase())} style={{ marginTop: 8, width: 44, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
          </div>
        );
      default:
        return (
          <Input key={f.key} {...common}
            type={f.kind === 'email' ? 'email' : 'text'}
            inputMode={f.kind === 'money' ? 'decimal' : f.kind === 'int' ? 'numeric' : undefined}
            value={String(value)} onChange={(e) => set(f.key, e.target.value)} />
        );
    }
  };

  const providerRow = (p: Provider) => (
    <div key={p.slug} style={{ padding: 16, border: '1px solid var(--tuw-border-subtle, #E2E4E6)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 220, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{p.name}</span>
          <Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'On' : 'Off'}</Badge>
          <Badge variant="info">{p.environment === 'live' ? 'Live' : 'Sandbox'}</Badge>
        </div>
        <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0' }}>
          {PROVIDER_NOTES[p.slug] ?? (p.hasAdapter ? '' : 'Adapter arrives in the integrations phase.')}
        </p>
        {providerError?.slug === p.slug && <p role="alert" style={{ fontSize: 13, color: 'var(--tuw-text-error, #C91818)', margin: '6px 0 0' }}>{providerError.text}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Select aria-label={`${p.name} environment`} value={p.environment} disabled={!p.liveReady || providerBusy !== null}
          onChange={(e) => void toggleProvider(p, { environment: e.target.value as 'sandbox' | 'live' })}
          options={[{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }]} />
        <Switch checked={p.isActive} disabled={!p.hasAdapter || providerBusy !== null} ariaLabel={`Switch ${p.name} ${p.isActive ? 'off' : 'on'}`}
          onChange={(v) => void toggleProvider(p, { isActive: v })} />
      </div>
    </div>
  );

  const providerGroups = tab === 'payments' ? [['payment', 'Payment gateways']] : tab === 'fulfillment' ? [['fulfillment', 'Print partners'], ['shipping', 'Couriers']] : [];

  return (
    <DashboardShell pageTitle="Settings" activeNav="settings">
      <PageHeader
        title="Store Settings"
        actions={section ? (
          <Button variant="primary" size="md" icon={notice?.tone === 'ok' && !isDirty ? <Check size={16} /> : <Save size={16} />} onClick={() => void handleSave()} disabled={saving}>
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </Button>
        ) : undefined}
      />

      {isDirty && (
        <div role="status" style={{ padding: '12px 16px', backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)', border: '1px solid rgba(133, 99, 0, 0.25)', borderRadius: 'var(--tuw-radius-control, 8px)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tuw-text-warning, #856300)' }}>
          <AlertCircle size={16} />
          <span>You have unsaved changes on this tab.</span>
        </div>
      )}

      {/* Errors stay visible while the typed values are being fixed; success notes clear on the next edit. */}
      {notice && (notice.tone !== 'ok' || !isDirty) && (
        <div role={notice.tone === 'error' ? 'alert' : 'status'} style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, background: notice.tone === 'error' ? 'var(--tuw-bg-error, #FEF4F4)' : notice.tone === 'warn' ? 'var(--tuw-bg-warning, #FEFBF5)' : 'var(--tuw-bg-success, #F3FAF6)', color: notice.tone === 'error' ? 'var(--tuw-text-error, #C91818)' : notice.tone === 'warn' ? 'var(--tuw-text-warning, #856300)' : 'var(--tuw-text-success, #187343)' }}>
          {notice.text}
        </div>
      )}

      <nav aria-label="Settings sections" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)', overflowX: 'auto', paddingBottom: 4 }}>
        {SETTINGS_TABS.map((t) => (
          <Link key={t.id} href={`/settings/${t.id}`} onClick={confirmLeave} aria-current={t.id === tab ? 'page' : undefined}
            style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', whiteSpace: 'nowrap', textDecoration: 'none', fontSize: 13,
              background: t.id === tab ? 'var(--tuw-bg-surface, #FFFFFF)' : 'transparent',
              color: t.id === tab ? 'var(--tuw-action-primary, #7539FF)' : 'var(--tuw-text-secondary, #5D6772)',
              fontWeight: t.id === tab ? 600 : 500,
              borderBottom: t.id === tab ? '2px solid var(--tuw-action-primary, #7539FF)' : '2px solid transparent' }}>
            {t.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {section && (
          <ContentCard>
            <form onSubmit={handleSave} noValidate>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: '0 0 4px' }}>{section.title}</h2>
              {section.intro && <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '0 0 16px' }}>{section.intro}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: section.intro ? 0 : 12 }}>
                {fields.map(renderField)}
              </div>
              <button type="submit" hidden aria-hidden tabIndex={-1} />
            </form>

            {tab === 'general' && (
              <>
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>Attribute Library</h3>
                    <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0' }}>Define colors, sizes, fabrics, and other product attributes once — link them into any product.</p>
                  </div>
                  <LinkButton href="/settings/attributes" variant="secondary" size="sm" icon={<Library size={14} />}>Open Attribute Library</LinkButton>
                </div>
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--tuw-border-subtle, #E2E4E6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>Demo screens</h3>
                    <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: '4px 0 0' }}>Reset the screens that still run on demo data (orders, products, content…) to their baseline. Settings, customers and team are real and are not affected.</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => { if (window.confirm('Reset the demo screens back to baseline fixtures?')) resetDemoData(); }}>
                    Reset Demo State
                  </Button>
                </div>
              </>
            )}
          </ContentCard>
        )}

        {providerGroups.map(([category, title]) => (
          <ContentCard key={category}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', margin: '0 0 12px' }}>{title}</h2>
            <div style={{ padding: 14, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)', borderRadius: 8, fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <ShieldCheck size={16} color="var(--tuw-action-primary, #7539FF)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>API keys live in the server environment only — never in the database or this screen. Live mode unlocks once a provider’s real adapter and keys are installed (integrations phase).</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {providers.filter((p) => p.category === category).map(providerRow)}
              {providers.every((p) => p.category !== category) && <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>No providers registered.</p>}
            </div>
          </ContentCard>
        ))}
      </div>
    </DashboardShell>
  );
}
