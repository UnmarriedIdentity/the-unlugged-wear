'use client';

import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { BookOpen, Plus, ArrowLeft } from 'lucide-react';

export default function JournalPage() {
  return (
    <DashboardShell pageTitle="Journal & Stories">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/content" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Editorial Journal
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Brand stories, lookbook releases, and cultural journalism.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={16} />}>
          New Story
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Published Articles" value="12 Posts" subtitle="Across 3 categories" trendType="up" />
        <StatCard label="Draft Stories" value="3 Drafts" subtitle="In editorial review" trendType="neutral" />
        <StatCard label="Total Story Views" value="48,200" trend="↑ 24% vs last month" trendType="up" />
        <StatCard label="Avg. Reading Time" value="3m 42s" subtitle="High retention rate" trendType="up" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Published Articles
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
          12 articles live on the storefront blog.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
