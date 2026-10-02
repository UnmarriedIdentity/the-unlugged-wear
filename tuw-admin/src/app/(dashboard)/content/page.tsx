'use client';

import React from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { FileText, BookOpen, Image as ImageIcon, Menu, ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Journal & Stories',
    description: 'Editorial blog posts, lookbook essays, behind-the-scenes narratives.',
    href: '/content/journal',
    icon: <BookOpen size={24} color="#7539FF" />,
    badge: '12 Published',
  },
  {
    title: 'Store Pages',
    description: 'Static CMS pages including About Us, Sustainability, Fit Guide, Care Guide.',
    href: '/content/pages',
    icon: <FileText size={24} color="#175CD3" />,
    badge: '8 Active',
  },
  {
    title: 'Media Library',
    description: 'High-res photography, hero campaign banners, lookbook video reels.',
    href: '/content/media',
    icon: <ImageIcon size={24} color="#187343" />,
    badge: '142 Assets',
  },
  {
    title: 'Store Navigation',
    description: 'Storefront header menus, footer columns, mobile navigation trees.',
    href: '/content/navigation',
    icon: <Menu size={24} color="#856300" />,
    badge: '3 Menus',
  },
];

export default function ContentOverviewPage() {
  return (
    <DashboardShell pageTitle="Content Management">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Content & CMS
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Manage editorial articles, lookbooks, static pages, navigation menus, and media assets.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
        {sections.map((sec) => (
          <Link
            key={sec.title}
            href={sec.href}
            style={{
              textDecoration: 'none',
              backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
              border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
              borderRadius: 'var(--tuw-radius-card, 16px)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ padding: 10, borderRadius: 10, backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)' }}>
                  {sec.icon}
                </div>
                <Badge variant="info">{sec.badge}</Badge>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 8 }}>
                {sec.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', lineHeight: 1.5 }}>
                {sec.description}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 600, fontSize: 14 }}>
              <span>Manage</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
