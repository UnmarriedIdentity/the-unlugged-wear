'use client';

import React from 'react';
import SurfaceCard from './SurfaceCard';
import type { SurfaceCardProps } from './SurfaceCard';

export interface DrawerCardProps extends Omit<SurfaceCardProps, 'children' | 'title'> {
  /** Numbered card heading, e.g. "1. Basic Information". */
  title: React.ReactNode;
  /** Short explanation of what belongs in this card. */
  description?: React.ReactNode;
  /** Optional status/count shown opposite the heading. */
  badge?: React.ReactNode;
  /** Optional action shown opposite the heading. */
  action?: React.ReactNode;
  /** Vertical rhythm between fields inside the card body. */
  bodyGap?: number;
  children: React.ReactNode;
}

// Product-editor card stack (PEDIT): one heading + one body on the canonical
// surface. Headings stay at drawer-section scale (h4 / 14px / 600); the card
// itself owns padding and the body gap, never nested cards.
export default function DrawerCard({
  title,
  description,
  badge,
  action,
  bodyGap = 14,
  padding = '16px',
  gap = '14px',
  children,
  ...props
}: DrawerCardProps) {
  return (
    <SurfaceCard padding={padding} gap={gap} {...props}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: '20px',
              fontWeight: 600,
              color: 'var(--tuw-text-primary, #262626)',
              fontFamily: 'var(--font-main)',
            }}
          >
            {title}
          </h4>
          {description ? (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                lineHeight: '20px',
                fontWeight: 400,
                color: 'var(--tuw-text-secondary, #5D6772)',
                fontFamily: 'var(--font-main)',
              }}
            >
              {description}
            </p>
          ) : null}
        </div>
        {badge || action ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {badge}
            {action}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: bodyGap, minWidth: 0 }}>
        {children}
      </div>
    </SurfaceCard>
  );
}
