'use client';

import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

/**
 * Accessible IconButton component conforming to TUW Design System
 * Enforces an accessible label for screen readers.
 */
export default function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  disabled,
  className = '',
  style = {},
  ...props
}: IconButtonProps) {
  const sizeMap: Record<'sm' | 'md' | 'lg', { width: string; height: string; fontSize: string }> = {
    sm: { width: '32px', height: '32px', fontSize: '14px' },
    md: { width: '40px', height: '40px', fontSize: '18px' },
    lg: { width: '48px', height: '48px', fontSize: '20px' },
  };

  const variantStyles: Record<'primary' | 'secondary' | 'ghost' | 'danger' | 'outline', React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--tuw-action-primary, #7539FF)',
      color: '#FFFFFF',
      border: 'none',
    },
    secondary: {
      backgroundColor: 'var(--tuw-bg-surface-subtle, #F1F3F5)',
      color: 'var(--tuw-text-primary, #262626)',
      border: '1px solid var(--tuw-border-subtle, #E8ECEF)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--tuw-text-secondary, #6B7280)',
      border: 'none',
    },
    danger: {
      backgroundColor: 'var(--tuw-bg-error, #FEF4F4)',
      color: 'var(--tuw-status-danger, #EF4444)',
      border: '1px solid var(--tuw-border-error, #FED7D7)',
    },
    outline: {
      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
      color: 'var(--tuw-text-primary, #262626)',
      border: '1px solid var(--tuw-border-subtle, #E8ECEF)',
    },
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip || label}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--tuw-radius-control, 8px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        ...sizeMap[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {icon}
    </button>
  );
}
