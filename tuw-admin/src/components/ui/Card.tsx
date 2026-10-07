'use client';

import React from 'react';

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
    <div
      style={{
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        padding,
        boxShadow: 'var(--shadow-subtle, 0 1px 4px rgba(0, 0, 0, 0.02))',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
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
    <div
      style={{
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: 'var(--shadow-subtle, 0 1px 4px rgba(0, 0, 0, 0.02))',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease',
        boxSizing: 'border-box',
        ...style,
      }}
      className={`${hoverable ? 'tuw-stat-hover' : ''} ${className}`.trim()}
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
    </div>
  );
}
