'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { Button, Badge, Input, ContentCard, StatCard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { COLORS, SPACING, FIGMA_META } from '@/lib/tokens';
import {
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Search,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function DesignSystemPage() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'colors' | 'typography' | 'components' | 'tokens'>('all');
  const [demoInput, setDemoInput] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(label);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const colorEntries = [
    { label: 'Canvas', hex: COLORS.canvas, role: 'bg/canvas', varName: '--tuw-bg-canvas', desc: 'Main app background' },
    { label: 'Surface', hex: COLORS.surface, role: 'bg/surface', varName: '--tuw-bg-surface', desc: 'Cards, tables, modals' },
    { label: 'Primary Text', hex: COLORS.textPrimary, role: 'text/primary', varName: '--tuw-text-primary', desc: 'Headings and high-contrast text' },
    { label: 'Secondary Text', hex: COLORS.textSecondary, role: 'text/secondary', varName: '--tuw-text-secondary', desc: 'Subtitles, captions, metadata' },
    { label: 'Subtle Border', hex: COLORS.borderSubtle, role: 'border/subtle', varName: '--tuw-border-subtle', desc: 'Card borders, light dividers' },
    { label: 'Control Border', hex: COLORS.borderControl, role: 'border/control', varName: '--tuw-border-control', desc: 'Form field and control outlines' },
    { label: 'Primary Action', hex: COLORS.actionPrimary, role: 'action/primary', varName: '--tuw-action-primary', desc: 'Main interactive CTA purple' },
    { label: 'Primary Hover', hex: COLORS.actionHover, role: 'action/hover', varName: '--tuw-action-hover', desc: 'Hover state for primary action' },
    { label: 'Selected Surface', hex: COLORS.bgSelected, role: 'bg/selected', varName: '--tuw-bg-selected', desc: 'Active navigation or selected item' },
    { label: 'Info Text', hex: COLORS.textInfo, role: 'text/info', varName: '--tuw-text-info', desc: 'Links and informational callouts' },
    { label: 'Info Surface', hex: COLORS.bgInfo, role: 'bg/info', varName: '--tuw-bg-info', desc: 'Information banners and tags' },
    { label: 'Success Text', hex: COLORS.textSuccess, role: 'text/success', varName: '--tuw-text-success', desc: 'Positive notifications and badges' },
    { label: 'Success Surface', hex: COLORS.bgSuccess, role: 'bg/success', varName: '--tuw-bg-success', desc: 'Completed / valid badge backgrounds' },
    { label: 'Warning Text', hex: COLORS.textWarning, role: 'text/warning', varName: '--tuw-text-warning', desc: 'Cautions and pending status' },
    { label: 'Warning Surface', hex: COLORS.bgWarning, role: 'bg/warning', varName: '--tuw-bg-warning', desc: 'Warning banner / tag backgrounds' },
    { label: 'Error Text', hex: COLORS.textError, role: 'text/error', varName: '--tuw-text-error', desc: 'Validation errors, alert messages' },
    { label: 'Error Surface', hex: COLORS.bgError, role: 'bg/error', varName: '--tuw-bg-error', desc: 'Failed status and input error fill' },
    { label: 'On Primary', hex: COLORS.textOnPrimary, role: 'text/on-primary', varName: '--tuw-text-on-primary', desc: 'White text on purple CTAs' },
  ];

  const typographyScales = [
    { role: 'Display', size: '40px', lineHeight: '44px', weight: '700', sample: 'Store Performance Overview', cssClass: 'tuw-type-display' },
    { role: 'Heading 1 (Page Title)', size: '32px', lineHeight: '40px', weight: '600', sample: 'Orders & Fulfillment Center', cssClass: 'tuw-type-heading-page' },
    { role: 'Heading 2 (Section)', size: '24px', lineHeight: '32px', weight: '600', sample: 'Active Product Inventory', cssClass: 'tuw-type-heading-section' },
    { role: 'Heading 3 (Subsection)', size: '20px', lineHeight: '28px', weight: '600', sample: 'Recent Customer Inquiries', cssClass: 'tuw-type-heading-subsection' },
    { role: 'Heading 4 (Card Title)', size: '18px', lineHeight: '26px', weight: '600', sample: 'Shipping & Delivery Policy', cssClass: 'tuw-type-heading-card' },
    { role: 'Body / Large', size: '16px', lineHeight: '24px', weight: '400', sample: 'Premium, minimal pod lifestyle apparel crafted with conscious materials.', cssClass: 'tuw-type-body-large' },
    { role: 'Body / Default', size: '14px', lineHeight: '22px', weight: '400', sample: 'Standard body text used across tables, descriptions, and forms.', cssClass: 'tuw-type-body-default' },
    { role: 'Label / Control', size: '14px', lineHeight: '20px', weight: '500', sample: 'Form label and interactive button text', cssClass: 'tuw-type-label-control' },
    { role: 'Caption / Default', size: '12px', lineHeight: '18px', weight: '400', sample: 'Metadata, timestamps, helper footnotes, and status pill text.', cssClass: 'tuw-type-caption-default' },
  ];

  return (
    <DashboardShell>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Page Header */}
        <div style={{
          backgroundColor: 'var(--tuw-bg-surface)',
          padding: '32px',
          borderRadius: 'var(--tuw-radius-card)',
          border: '1px solid var(--tuw-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Badge variant="info">Figma Node 1:26969</Badge>
              <Badge variant="neutral">TUW V2 Urbanist</Badge>
              <span style={{ fontSize: '13px', color: 'var(--tuw-text-secondary)' }}>Light Mode Foundations</span>
            </div>
            <h1 className="tuw-type-heading-page" style={{ color: 'var(--tuw-text-primary)', marginBottom: '8px' }}>
              TUW Design System
            </h1>
            <p className="tuw-type-body-large" style={{ color: 'var(--tuw-text-secondary)', maxWidth: '680px' }}>
              Synchronized design tokens, typography specifications, and UI components from the official TUW Figma design system.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a
              href={`https://www.figma.com/design/${FIGMA_META.fileKey}/TUW?node-id=${FIGMA_META.nodeId}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="secondary" icon={<ExternalLink size={16} />}>
                Open in Figma
              </Button>
            </a>
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => {
                setButtonLoading(true);
                setTimeout(() => setButtonLoading(false), 800);
              }}
            >
              {buttonLoading ? 'Refreshing Tokens...' : 'Tokens Synced'}
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--tuw-border-subtle)',
          paddingBottom: '8px'
        }}>
          {(['all', 'colors', 'typography', 'components', 'tokens'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--tuw-radius-control)',
                fontSize: '14px',
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? 'var(--tuw-action-primary)' : 'var(--tuw-text-secondary)',
                backgroundColor: activeTab === tab ? 'var(--tuw-bg-selected)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'all' ? 'All Sections' : tab}
            </button>
          ))}
        </div>

        {/* 01: COLOR ROLES */}
        {(activeTab === 'all' || activeTab === 'colors') && (
          <ContentCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 className="tuw-type-heading-section" style={{ color: 'var(--tuw-text-primary)' }}>
                  01. Semantic Colour Roles
                </h2>
                <p className="tuw-type-body-default" style={{ color: 'var(--tuw-text-secondary)', marginTop: '4px' }}>
                  18 designated roles aligned with Figma V2 Urbanist variable tokens. Avoid arbitrary hex values.
                </p>
              </div>
              <Badge variant="neutral">18 Roles Defined</Badge>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
              marginTop: '16px'
            }}>
              {colorEntries.map((c) => (
                <div
                  key={c.role}
                  style={{
                    backgroundColor: 'var(--tuw-bg-canvas)',
                    border: '1px solid var(--tuw-border-subtle)',
                    borderRadius: 'var(--tuw-radius-control)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{
                    height: '52px',
                    borderRadius: '6px',
                    backgroundColor: c.hex,
                    border: c.hex === '#FFFFFF' ? '1px solid var(--tuw-border-subtle)' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }} />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--tuw-text-primary)' }}>
                        {c.label}
                      </span>
                      <button
                        onClick={() => handleCopy(c.hex, c.role)}
                        title="Copy hex code"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: 'var(--tuw-text-secondary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'monospace'
                        }}
                      >
                        {copiedValue === c.role ? <Check size={12} color="var(--tuw-text-success)" /> : <Copy size={12} />}
                        {c.hex}
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--tuw-text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>
                      {c.varName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--tuw-text-secondary)', marginTop: '4px' }}>
                      {c.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>
        )}

        {/* 02: TYPOGRAPHY SCALE */}
        {(activeTab === 'all' || activeTab === 'typography') && (
          <ContentCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 className="tuw-type-heading-section" style={{ color: 'var(--tuw-text-primary)' }}>
                  02. Urbanist Typography Scale
                </h2>
                <p className="tuw-type-body-default" style={{ color: 'var(--tuw-text-secondary)', marginTop: '4px' }}>
                  Standardized type scale using Urbanist (Regular 400, Medium 500, SemiBold 600, Bold 700).
                </p>
              </div>
              <Badge variant="info">One Font Family</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              {typographyScales.map((t, idx) => (
                <div
                  key={t.role}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: idx % 2 === 0 ? 'var(--tuw-bg-canvas)' : 'var(--tuw-bg-surface)',
                    borderRadius: 'var(--tuw-radius-control)',
                    border: '1px solid var(--tuw-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--tuw-action-primary)' }}>
                        {t.role}
                      </span>
                      <code style={{ fontSize: '11px', backgroundColor: 'var(--tuw-bg-selected)', padding: '2px 6px', borderRadius: '4px', color: 'var(--tuw-action-hover)' }}>
                        .{t.cssClass}
                      </code>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--tuw-text-secondary)', fontFamily: 'monospace' }}>
                      {t.size} / {t.lineHeight} · Weight {t.weight}
                    </div>
                  </div>
                  <div className={t.cssClass} style={{ color: 'var(--tuw-text-primary)' }}>
                    {t.sample}
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>
        )}

        {/* 03: REUSABLE UI COMPONENTS */}
        {(activeTab === 'all' || activeTab === 'components') && (
          <ContentCard>
            <div>
              <h2 className="tuw-type-heading-section" style={{ color: 'var(--tuw-text-primary)' }}>
                03. Reusable Component Inventory
              </h2>
              <p className="tuw-type-body-default" style={{ color: 'var(--tuw-text-secondary)', marginTop: '4px' }}>
                Core UI primitives exported from @/components/ui strictly matching Figma specs.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '16px' }}>
              
              {/* BUTTONS */}
              <div>
                <h3 className="tuw-type-heading-card" style={{ marginBottom: '12px', color: 'var(--tuw-text-primary)' }}>
                  Buttons (Variants & Sizes)
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                  <Button variant="primary" size="md">Primary Action</Button>
                  <Button variant="secondary" size="md">Secondary Outline</Button>
                  <Button variant="dark" size="md">Dark Purchase</Button>
                  <Button variant="outline" size="md">Subtle Outline</Button>
                  <Button variant="ghost" size="md">Ghost Button</Button>
                  <Button variant="danger" size="md">Danger / Destructive</Button>
                  <Button variant="primary" size="sm" icon={<ArrowRight size={14} />}>Small CTA</Button>
                  <Button variant="primary" size="lg" icon={<Check size={16} />}>Large Button</Button>
                  <Button variant="secondary" disabled>Disabled State</Button>
                </div>
              </div>

              {/* BADGES */}
              <div>
                <h3 className="tuw-type-heading-card" style={{ marginBottom: '12px', color: 'var(--tuw-text-primary)' }}>
                  Status Badges
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                  <Badge variant="success">Fulfilled / Paid</Badge>
                  <Badge variant="warning">Pending Confirmation</Badge>
                  <Badge variant="info">In Transit (Blue)</Badge>
                  <Badge variant="danger">Failed / Returned</Badge>
                  <Badge variant="neutral">Draft Spec</Badge>
                  <Badge variant="success" size="sm">Small Success</Badge>
                  <Badge variant="info" size="sm">Small Info</Badge>
                </div>
              </div>

              {/* FORM CONTROLS */}
              <div>
                <h3 className="tuw-type-heading-card" style={{ marginBottom: '12px', color: 'var(--tuw-text-primary)' }}>
                  Inputs & Form Controls
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Standard Field"
                    placeholder="Enter customer name..."
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    helperText="Supporting text or format guidelines"
                  />
                  <Input
                    label="Search Field"
                    placeholder="Search SKU or order number..."
                    iconPrefix={<Search size={16} />}
                  />
                  <Input
                    label="Password Field"
                    type="password"
                    placeholder="Enter security token"
                    iconPrefix={<Lock size={16} />}
                  />
                  <Input
                    label="Field with Error State"
                    defaultValue="invalid-format-sku"
                    error="Invalid SKU format (expected TUW-XXXX)"
                  />
                </div>
              </div>

              {/* CARDS */}
              <div>
                <h3 className="tuw-type-heading-card" style={{ marginBottom: '12px', color: 'var(--tuw-text-primary)' }}>
                  Stat Cards
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <StatCard
                    label="Design Tokens"
                    value="18 Active"
                    trend="+100% V2 Compliant"
                    trendType="up"
                    subtitle="Figma V2 Light Mode"
                  />
                  <StatCard
                    label="Component Primitives"
                    value="6 Libraries"
                    trend="Zero Dependencies"
                    trendType="up"
                    subtitle="Pure CSS Modules"
                  />
                  <StatCard
                    label="Figma Sync"
                    value="Node 1:26969"
                    trend="Verified"
                    trendType="up"
                    subtitle="Urbanist Foundations"
                  />
                </div>
              </div>

              {/* SAMPLE TABLE */}
              <div>
                <h3 className="tuw-type-heading-card" style={{ marginBottom: '12px', color: 'var(--tuw-text-primary)' }}>
                  Standard Data Table
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token Role</TableHead>
                      <TableHead>Variable Code</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell style={{ fontWeight: 600 }}>bg/canvas</TableCell>
                      <TableCell><code>--tuw-color-bg-canvas</code></TableCell>
                      <TableCell>#F7F8F9</TableCell>
                      <TableCell><Badge variant="success">Figma V2 Ready</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ fontWeight: 600 }}>action/primary</TableCell>
                      <TableCell><code>--tuw-color-action-primary</code></TableCell>
                      <TableCell>#7539FF</TableCell>
                      <TableCell><Badge variant="success">Figma V2 Ready</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ fontWeight: 600 }}>border/control</TableCell>
                      <TableCell><code>--tuw-color-border-control</code></TableCell>
                      <TableCell>#90979F</TableCell>
                      <TableCell><Badge variant="success">Figma V2 Ready</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

            </div>
          </ContentCard>
        )}

        {/* 04: SPACING & RADIUS TOKENS */}
        {(activeTab === 'all' || activeTab === 'tokens') && (
          <ContentCard>
            <div>
              <h2 className="tuw-type-heading-section" style={{ color: 'var(--tuw-text-primary)' }}>
                04. Spacing Scale & Corner Radii
              </h2>
              <p className="tuw-type-body-default" style={{ color: 'var(--tuw-text-secondary)', marginTop: '4px' }}>
                Predictable 8-point geometric scale and radii definitions from Figma.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
              
              {/* Spacing */}
              <div style={{ backgroundColor: 'var(--tuw-bg-canvas)', padding: '20px', borderRadius: 'var(--tuw-radius-control)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--tuw-text-primary)' }}>
                  Spacing Grid (4 · 8 · 12 · 16 · 24 · 32 · 48 · 64px)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(SPACING).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ width: '48px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--tuw-text-secondary)' }}>
                        {val}
                      </span>
                      <div
                        style={{
                          height: '16px',
                          width: val,
                          backgroundColor: 'var(--tuw-action-primary)',
                          borderRadius: '2px',
                          minWidth: '4px'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--tuw-text-secondary)', fontFamily: 'monospace' }}>
                        --tuw-space-{key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radii */}
              <div style={{ backgroundColor: 'var(--tuw-bg-canvas)', padding: '20px', borderRadius: 'var(--tuw-radius-control)' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--tuw-text-primary)' }}>
                  Corner Radii (4 · 8 · 12 · 16 · 9999px)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Small (4px)', val: '4px', role: 'Badges, tags', token: '--tuw-radius-sm' },
                    { label: 'Control (8px)', val: '8px', role: 'Buttons, inputs, dropdowns', token: '--tuw-radius-control' },
                    { label: 'Card (12px)', val: '12px', role: 'Cards, containers', token: '--tuw-radius-card' },
                    { label: 'Modal (16px)', val: '16px', role: 'Dialogs, overlays', token: '--tuw-radius-modal' },
                    { label: 'Pill (9999px)', val: '9999px', role: 'Rounded pills, chips', token: '--tuw-radius-pill' },
                  ].map((r) => (
                    <div key={r.token} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'var(--tuw-bg-surface)',
                          border: '2px solid var(--tuw-action-primary)',
                          borderRadius: r.val,
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--tuw-text-primary)' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--tuw-text-secondary)' }}>
                          {r.role} · <code style={{ fontSize: '11px' }}>{r.token}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </ContentCard>
        )}

      </div>
    </DashboardShell>
  );
}
