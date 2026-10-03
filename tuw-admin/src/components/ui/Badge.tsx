'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'info' | 'danger' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export default function Badge({
  children,
  variant = 'success',
  size = 'md',
  icon,
  style = {},
  className = '',
  ...props
}: BadgeProps) {
  const effectiveVariant = variant === 'error' ? 'danger' : variant;
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: 'var(--tuw-radius-pill, 16px)',
    fontWeight: 600,
    fontFamily: 'var(--font-main)',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  };

  const sizeStyles: Record<'sm' | 'md', React.CSSProperties> = {
    sm: {
      height: '24px',
      padding: '0 10px',
      fontSize: '11px',
      lineHeight: '16px',
    },
    md: {
      height: '32px',
      padding: '0 14px',
      fontSize: '12px',
      lineHeight: '18px',
    },
  };

  const variantStyles: Record<'success' | 'warning' | 'info' | 'danger' | 'neutral', React.CSSProperties> = {
    success: {
      backgroundColor: 'var(--tuw-bg-success, #F4FBF7)',
      color: 'var(--tuw-text-success, #187343)',
      border: '1px solid rgba(24, 115, 67, 0.12)',
    },
    warning: {
      backgroundColor: 'var(--tuw-bg-warning, #FEFBF5)',
      color: 'var(--tuw-text-warning, #856300)',
      border: '1px solid rgba(133, 99, 0, 0.12)',
    },
    info: {
      backgroundColor: 'var(--tuw-bg-info, #F4F9FE)',
      color: 'var(--tuw-text-info, #175CD3)',
      border: '1px solid rgba(23, 92, 211, 0.12)',
    },
    danger: {
      backgroundColor: 'var(--tuw-bg-error, #FEF4F4)',
      color: 'var(--tuw-text-error, #C91818)',
      border: '1px solid rgba(201, 24, 24, 0.12)',
    },
    neutral: {
      backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
      color: 'var(--tuw-text-secondary, #5D6772)',
      border: '1px solid var(--tuw-border-subtle, #E2E4E6)',
    },
  };

  return (
    <span
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[effectiveVariant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
}
