'use client';

import React from 'react';
import SurfaceCard from './SurfaceCard';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
}

export function ContentCard({
  children,
  padding = '24px',
  style = {},
  className = '',
  ...props
}: CardProps) {
  return (
    <SurfaceCard padding="24px" gap="16px" fullWidth className={className} style={style} {...props}>
      {children}
    </SurfaceCard>
  );
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  /** Opt-in hover treatment (border tint + wash). Default false: no page changes unless enabled. */
  hoverable?: boolean;
}

export function StatCard({
  label,
  value,
  subtitle,
  trend,
  trendType = 'up',
  hoverable = false,
  style = {},
  className = '',
  ...props
}: StatCardProps) {
  const trendColor =
    trendType === 'up'
      ? 'var(--tuw-text-success, #187343)'
      : trendType === 'down'
      ? 'var(--tuw-text-error, #C91818)'
      : 'var(--tuw-text-secondary, #5D6772)';

  return (
    <SurfaceCard
      padding="20px 24px"
      gap="6px"
      hoverable={hoverable}
      className={className}
      style={style}
      {...props}
    >
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--tuw-text-secondary, #5D6772)',
          fontFamily: 'var(--font-main)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '32px',
          fontWeight: 600,
          color: 'var(--tuw-text-primary, #262626)',
          letterSpacing: '-0.02em',
          fontFamily: 'var(--font-main)',
          lineHeight: '40px',
        }}
        className="tabular-nums"
      >
        {value}
      </span>
      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          {trend && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: trendColor,
                fontFamily: 'var(--font-main)',
              }}
            >
              {trend}
            </span>
          )}
          {subtitle && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 400,
                color: 'var(--tuw-text-secondary, #5D6772)',
                fontFamily: 'var(--font-main)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </SurfaceCard>
  );
}
