'use client';

import React from 'react';

export interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
  gap?: string;
  /** Opt-in hover treatment (border tint + wash). Default false. */
  hoverable?: boolean;
  /** Forces width 100% (block contexts). Default false: grid/flex parents size the card. */
  fullWidth?: boolean;
}

// Single canonical card surface (C1): white bg, subtle border, 12px
// radius, subtle shadow. Every card in the admin (ContentCard, StatCard,
// dashboard variants, MetricCard) delegates here with its own layout
// values — one definition, zero visual change at any call site.
export default function SurfaceCard({
  children,
  padding = '20px 24px',
  gap,
  hoverable = false,
  fullWidth = false,
  className = '',
  style = {},
  ...props
}: SurfaceCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        padding,
        ...(gap !== undefined ? { gap } : {}),
        boxShadow: 'var(--shadow-subtle, 0 1px 4px rgba(0, 0, 0, 0.02))',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        display: 'flex',
        flexDirection: 'column',
        ...(fullWidth ? { width: '100%' } : {}),
        boxSizing: 'border-box',
        transition:
          'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
        ...style,
      }}
      className={`${hoverable ? 'tuw-stat-hover' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
