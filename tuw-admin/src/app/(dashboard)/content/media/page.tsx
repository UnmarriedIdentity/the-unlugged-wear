'use client';

import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { Image as ImageIcon, Upload, ArrowLeft } from 'lucide-react';

export default function MediaLibraryPage() {
  return (
    <DashboardShell pageTitle="Media Library">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Link href="/content" style={{ color: 'var(--tuw-text-secondary, #5D6772)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <ArrowLeft size={14} /> Back to Content
            </Link>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Media & Asset Storage
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            High-resolution lookbook assets, campaign photoshoots, and product photography.
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Upload size={16} />}>
          Upload Files
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Files" value="142 Assets" subtitle="Images, vectors & video" trendType="neutral" />
        <StatCard label="CDN Storage Used" value="4.2 GB" subtitle="Out of 50 GB quota" trendType="up" />
        <StatCard label="Optimization Rate" value="99.4% WebP" subtitle="Next.js image pipeline" trendType="up" />
        <StatCard label="Bandwidth (30d)" value="128 GB" trend="High speed edge delivery" trendType="up" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          All Media Files
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', marginTop: 4 }}>
          Browse and copy CDN URLs for marketing campaigns and storefront sections.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
