'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { Layers, Plus, Search, Filter, Sparkles, FolderTree } from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  season: string;
  visibility: 'published' | 'draft' | 'scheduled';
  updatedAt: string;
}

const mockCollections: CollectionItem[] = [
  {
    id: 'COL-01',
    name: 'Autumn/Winter Urban Minimal',
    slug: 'aw-urban-minimal',
    productCount: 24,
    season: 'AW26',
    visibility: 'published',
    updatedAt: 'Oct 01, 2026',
  },
  {
    id: 'COL-02',
    name: 'Core Heavyweight Basics',
    slug: 'core-heavyweight-basics',
    productCount: 18,
    season: 'Perennial',
    visibility: 'published',
    updatedAt: 'Sep 28, 2026',
  },
  {
    id: 'COL-03',
    name: 'Unplugged Monochrome Series',
    slug: 'unplugged-monochrome',
    productCount: 12,
    season: 'Limited Edition',
    visibility: 'scheduled',
    updatedAt: 'Sep 25, 2026',
  },
  {
    id: 'COL-04',
    name: 'Summer Archival Restock',
    slug: 'summer-archival',
    productCount: 9,
    season: 'SS26',
    visibility: 'draft',
    updatedAt: 'Sep 20, 2026',
  },
];

export default function CollectionsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockCollections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.season.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Collections">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Apparel Collections
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Curate product groupings, seasonal lookbooks, and storefront merchandising categories.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" size="md" icon={<Plus size={16} />}>
            Create Collection
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Active Collections" value="4 Collections" subtitle="63 products organized" trendType="neutral" />
        <StatCard label="Live on Storefront" value="2 Series" trend="High customer engagement" trendType="up" />
        <StatCard label="Scheduled Drops" value="1 Release" subtitle="Drop on Oct 15" trendType="neutral" />
        <StatCard label="Avg. Items / Drop" value="15.8" subtitle="Optimal storefront density" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Season
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Collection</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Slug</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Products</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Season</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {item.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    /{item.slug}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {item.productCount} items
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {item.season}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {item.visibility === 'published' && <Badge variant="success">Published</Badge>}
                    {item.visibility === 'scheduled' && <Badge variant="info">Scheduled</Badge>}
                    {item.visibility === 'draft' && <Badge variant="neutral">Draft</Badge>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
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
