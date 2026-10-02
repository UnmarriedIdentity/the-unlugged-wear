'use client';

import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { Menu, Plus, ArrowLeft } from 'lucide-react';

export default function NavigationPage() {
  return (
    <DashboardShell pageTitle="Storefront Navigation">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/content" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Store Navigation Menus
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Configure main navigation headers, dropdown category menus, and footer site maps.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={16} />}>
          Add Menu Item
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Active Menus" value="3 Sets" subtitle="Main Header, Footer, Mobile" trendType="neutral" />
        <StatCard label="Total Links" value="28 Links" subtitle="Zero broken links detected" trendType="up" />
        <StatCard label="Nested Levels" value="2 Levels Max" subtitle="Optimized for touch" trendType="up" />
        <StatCard label="Menu Cache" value="TTL 3600s" subtitle="Purged on save" trendType="neutral" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Main Storefront Navigation Tree
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
          Drag and drop items to reorder header navigation hierarchy.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
