'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { Palette, Plus, Search, Filter, Image as ImageIcon, Sparkles, Sliders } from 'lucide-react';

interface DesignAsset {
  id: string;
  name: string;
  category: 'Print Artwork' | 'Embroidery' | 'Typography' | 'Label Spec';
  designer: string;
  placement: string;
  status: 'approved' | 'in_review' | 'archived';
  updatedAt: string;
}

const mockDesigns: DesignAsset[] = [
  {
    id: 'DSN-301',
    name: 'Unplugged Soundwave Motif',
    category: 'Print Artwork',
    designer: 'Sora Tanaka',
    placement: 'Back Chest / Oversized Screenprint',
    status: 'approved',
    updatedAt: 'Oct 01, 2026',
  },
  {
    id: 'DSN-302',
    name: 'Minimal Monogram TUW 26',
    category: 'Embroidery',
    designer: 'Sora Tanaka',
    placement: 'Left Chest (45mm)',
    status: 'approved',
    updatedAt: 'Sep 29, 2026',
  },
  {
    id: 'DSN-303',
    name: 'Metropolitan Gradient Typo',
    category: 'Typography',
    designer: 'Elena Rostova',
    placement: 'Sleeve Length Print',
    status: 'in_review',
    updatedAt: 'Sep 27, 2026',
  },
  {
    id: 'DSN-304',
    name: 'Organic Cotton Care Label V2',
    category: 'Label Spec',
    designer: 'Ronan Vance',
    placement: 'Interior Hem Woven Label',
    status: 'approved',
    updatedAt: 'Sep 22, 2026',
  },
];

export default function DesignsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockDesigns.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.designer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Design Assets">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Apparel Artwork & Design
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Vector production files, screenprint separations, embroidery digitizations, and tech packs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" size="md" icon={<Plus size={16} />}>
            Upload Asset
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Approved Artworks" value="18 Assets" subtitle="Ready for manufacturing" trendType="up" />
        <StatCard label="In Sampling" value="3 Prototypes" trend="Lab dips awaiting signoff" trendType="neutral" />
        <StatCard label="Vector Formats" value="SVG / AI / PDF" subtitle="300+ DPI high fidelity" trendType="neutral" />
        <StatCard label="Tech Packs" value="100% Validated" trend="Factory approved" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search design assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Category
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Asset ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Placement</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Designer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((design) => (
                <tr key={design.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
                    {design.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {design.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {design.category}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {design.placement}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {design.designer}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {design.status === 'approved' && <Badge variant="success">Approved</Badge>}
                    {design.status === 'in_review' && <Badge variant="warning">In Review</Badge>}
                    {design.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
