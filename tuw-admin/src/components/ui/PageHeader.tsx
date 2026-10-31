'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  /** Optional descriptive copy or live meta (today: only the dashboard date line passes one). Omitted everywhere else. */
  subtitle?: React.ReactNode;
  /** Right-side controls, passed verbatim (existing Buttons stay caller-owned). */
  actions?: React.ReactNode;
  /** Slot rendered above the title (back-links on content/* + settings/* subpages). */
  eyebrow?: React.ReactNode;
  /**
   * 'page': standard h2 28/600 management header. 'doc': h1 via the
   * tuw-type-heading-page token class — sole consumer is the design-system
   * page, whose 32px title must stay pixel-identical.
   */
  variant?: 'page' | 'doc';
}

// Shared page header (PH1): dumb, props-fed, mock/live agnostic. Absorbs the
// title row every (dashboard) page hand-writes today. Standardizes on the
// shell-gap rhythm (margin 0 — the 8px .sub-pageHeader bottom margin is retired).
export default function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  variant = 'page',
}: PageHeaderProps) {
  const isDoc = variant === 'doc';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {eyebrow ? <div style={{ marginBottom: 8 }}>{eyebrow}</div> : null}
        {isDoc ? (
          <h1 className="tuw-type-heading-page" style={{ color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
            {title}
          </h1>
        ) : (
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--tuw-text-primary, #262626)',
              fontFamily: 'var(--font-main)',
              margin: 0,
            }}
          >
            {title}
          </h2>
        )}
        {subtitle ? (
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)', fontFamily: 'var(--font-main)', margin: 0 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>
      ) : null}
    </div>
  );
}
