'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, SurfaceCard, Badge, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PageHeader, Switch, UpliftSurface, DropdownMenu } from '@/components/ui';
import { Plus, Trash2, ArrowLeft, ChevronDown, X } from 'lucide-react';
import { useAdminState } from '@/mocks/state';

// Attribute library (settings manager): global starter definitions that
// product drafts copy values from. Copy semantics — drafts diverge after
// copy. Delete guards read persisted products; disable always allowed.
export default function AttributesSettingsPage() {
  const {
    libraryAttributes,
    createLibraryAttribute,
    deleteLibraryAttribute,
    toggleLibraryAttribute,
    addLibraryValue,
    removeLibraryValue,
  } = useAdminState();
  const [searchTerm, setSearchTerm] = useState('');
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<'pill' | 'swatch' | 'radio'>('pill');
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});

  const filtered = libraryAttributes.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayLabel = (t: string) =>
    t === 'pill' ? 'Pill' : t === 'swatch' ? 'Color swatch' : 'Radio select';

  return (
    <DashboardShell pageTitle="Attribute Library" activeNav="settings">
      <PageHeader
        title="Attribute Library"
        eyebrow={
          <Link href="/settings" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ArrowLeft size={14} /> Back to Settings
          </Link>
        }
      />

      <ContentCard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 220px' }}>
              <Input
                aria-label="Search attributes"
                placeholder="Search attributes…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ flex: '2 1 220px' }}>
              <Input
                aria-label="New attribute name"
                placeholder="New attribute, e.g. Fit"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (createLibraryAttribute(newAttrName)) setNewAttrName('');
                  }
                }}
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <DropdownMenu
                ariaLabel="New attribute display"
                trigger={
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`New attribute display, currently ${displayLabel(newAttrType)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font-main)',
                      borderRadius: 8,
                      border: '1px solid var(--tuw-border-control, #D1D5DB)',
                      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
                      color: 'var(--tuw-text-primary, #262626)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span>{displayLabel(newAttrType)}</span>
                    <ChevronDown size={14} color="var(--tuw-text-secondary, #5D6772)" />
                  </span>
                }
                items={[
                  { value: 'pill', label: 'Pill' },
                  { value: 'swatch', label: 'Color swatch' },
                  { value: 'radio', label: 'Radio select' },
                ]}
                selectedValue={newAttrType}
                onSelect={(v) => setNewAttrType(v as typeof newAttrType)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              type="button"
              disabled={newAttrName.trim() === ''}
              onClick={() => {
                if (createLibraryAttribute(newAttrName)) setNewAttrName('');
              }}
            >
              Add Attribute
            </Button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)', margin: 0 }}>
            Starter values products copy from. Disabled attributes hide from the product picker.
            Deletes are blocked while any product uses the name or value.
          </p>

          {filtered.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', textAlign: 'center', padding: '32px 0' }}>
              No attributes match — adjust search or add one above.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              {filtered.map((attr) => (
                <SurfaceCard key={attr.id} padding="12px" gap="10px" style={{ opacity: attr.enabled ? 1 : 0.65 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                      {attr.name}
                      <Badge variant="info" size="sm">{displayLabel(attr.displayType)}</Badge>
                      {!attr.enabled ? (
                        <Badge variant="neutral" size="sm">Disabled</Badge>
                      ) : null}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Switch
                        label=""
                        checked={attr.enabled}
                        onChange={() => toggleLibraryAttribute(attr.id)}
                      />
                      <UpliftSurface active width={28} height={28} className="tuw-danger-hover" style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>
                        <button
                          type="button"
                          aria-label={`Delete attribute ${attr.name}`}
                          onClick={() => deleteLibraryAttribute(attr.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'inline-flex' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </UpliftSurface>
                    </span>
                  </div>
                  {attr.values.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {attr.values.map((val) => (
                        <span key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <Badge variant="neutral" size="sm">{val}</Badge>
                          <button
                            type="button"
                            aria-label={`Remove ${val} from ${attr.name}`}
                            onClick={() => removeLibraryValue(attr.id, val)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tuw-text-secondary, #5D6772)', padding: 2, display: 'inline-flex' }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                      No values yet — add the first one below.
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        aria-label={`Add ${attr.name} value`}
                        placeholder={`Add value…`}
                        value={valueDrafts[attr.id] ?? ''}
                        onChange={(e) => setValueDrafts((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (addLibraryValue(attr.id, valueDrafts[attr.id] ?? '')) {
                              setValueDrafts((prev) => ({ ...prev, [attr.id]: '' }));
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      disabled={(valueDrafts[attr.id] ?? '').trim() === ''}
                      onClick={() => {
                        if (addLibraryValue(attr.id, valueDrafts[attr.id] ?? '')) {
                          setValueDrafts((prev) => ({ ...prev, [attr.id]: '' }));
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          )}
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
