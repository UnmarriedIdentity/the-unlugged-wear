'use client';

import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { FileText, Plus, ArrowLeft } from 'lucide-react';

export default function PagesManagementPage() {
  return (
    <DashboardShell pageTitle="Static Pages">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/content" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Static CMS Pages
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Manage About Us, Sustainability Manifesto, Fit Guide, Terms of Service, and Privacy Policy.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={16} />}>
          Create Page
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Published Pages" value="8 Pages" subtitle="Indexed by search engines" trendType="up" />
        <StatCard label="Draft Pages" value="1 Page" subtitle="Brand Story 2027" trendType="neutral" />
        <StatCard label="SEO Health" value="100% Score" subtitle="OpenGraph and meta tags" trendType="up" />
        <StatCard label="Avg. Load Time" value="0.28s" subtitle="Edge pre-rendered" trendType="up" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Published Static Pages
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
          Each page supports Markdown formatting, custom schema markup, and responsive layouts.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
