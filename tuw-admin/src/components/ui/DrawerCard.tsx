'use client';

import React from 'react';
import SurfaceCard from './SurfaceCard';
import type { SurfaceCardProps } from './SurfaceCard';

export type DrawerCardTone = 'neutral' | 'selected' | 'warning';

export interface DrawerCardProps
  extends Omit<SurfaceCardProps, 'children' | 'title' | 'padding' | 'gap'> {
  /** Numbered card heading, e.g. "1. Basic Information". */
  title: React.ReactNode;
  /** Short explanation of what belongs in this card. */
  description?: React.ReactNode;
  /** Optional status/count shown opposite the heading. */
  badge?: React.ReactNode;
  /** Optional action shown opposite the heading. */
  action?: React.ReactNode;
  /** Semantic header emphasis. Neutral is the default; use colour only when meaningful. */
  tone?: DrawerCardTone;
  /** Vertical rhythm between fields inside the card body. */
  bodyGap?: number;
  children: React.ReactNode;
}

// Product-editor card stack (PEDIT v2): a white surface on the drawer canvas,
// with a full-bleed header divider. The header owns the title/description and
// optional badge/action; the body owns field rhythm. No nested cards.
export default function DrawerCard({
  title,
  description,
  badge,
  action,
  tone = 'neutral',
  bodyGap = 14,
  style = {},
  children,
  ...props
}: DrawerCardProps) {
  const headerBg =
    tone === 'selected'
      ? 'var(--tuw-bg-selected, #F8F5FF)'
      : tone === 'warning'
        ? 'var(--tuw-bg-warning, #FEFBF5)'
        : 'var(--tuw-bg-surface, #FFFFFF)';
  const dotColor =
    tone === 'warning'
      ? 'var(--tuw-text-warning, #856300)'
      : 'var(--tuw-action-primary, #7539FF)';

  return (
    <SurfaceCard
      padding="0"
      gap="0"
      {...props}
      style={{ overflow: 'hidden', boxShadow: 'none', ...style }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: 16,
          backgroundColor: headerBg,
          borderBottom: '1px solid var(--tuw-border-subtle, #E9E9E9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          {tone !== 'neutral' ? (
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 'var(--tuw-radius-pill, 9999px)',
                backgroundColor: dotColor,
                flexShrink: 0,
                marginTop: 9,
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--tuw-type-heading-card-size, 18px)',
                lineHeight: 'var(--tuw-type-heading-card-line-height, 26px)',
                fontWeight: 'var(--tuw-type-heading-card-weight, 600)',
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
                  fontSize: 'var(--tuw-type-body-default-size, 14px)',
                  lineHeight: 'var(--tuw-type-body-default-line-height, 22px)',
                  fontWeight: 400,
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  fontFamily: 'var(--font-main)',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {badge || action ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {badge}
            {action}
          </div>
        ) : null}
      </div>
      <div
        style={
          {
            display: 'flex',
            flexDirection: 'column',
            gap: bodyGap,
            minWidth: 0,
            padding: 16,
            backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
            // Card-scoped field-label context: Input, FormSelect and
            // FormTextarea inherit 14/600 without per-call props. The 24px
            // row keeps a hinted field aligned with its paired field. Outside
            // a DrawerCard each primitive keeps its existing legacy fallback.
            '--tuw-field-label-size': 'var(--tuw-type-label-control-size, 14px)',
            '--tuw-field-label-weight': '600',
            '--tuw-field-label-row-height': '24px',
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </SurfaceCard>
  );
}
