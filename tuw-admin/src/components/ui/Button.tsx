'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  style = {},
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-main)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--tuw-radius-control, 8px)',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    boxSizing: 'border-box',
    userSelect: 'none',
    opacity: disabled ? 0.6 : 1,
  };

  const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
    sm: {
      height: '36px',
      padding: '0 14px',
      fontSize: '13px',
      lineHeight: '18px',
    },
    md: {
      height: '44px',
      padding: '0 20px',
      fontSize: '13px',
      lineHeight: '20px',
    },
    lg: {
      height: '48px',
      padding: '0 24px',
      fontSize: '15px',
      lineHeight: '22px',
    },
  };

  const variantStyles: Record<'primary' | 'secondary' | 'dark' | 'danger' | 'ghost' | 'outline', React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--tuw-action-primary, #7539FF)',
      color: 'var(--tuw-text-on-primary, #FFFFFF)',
      boxShadow: 'var(--shadow-button, 0 2px 6px rgba(117, 57, 255, 0.2))',
    },
    secondary: {
      backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
      color: 'var(--tuw-text-primary, #262626)',
      border: '1px solid var(--tuw-border-control, #D1D5DB)',
    },
    dark: {
      backgroundColor: 'var(--tuw-text-primary, #262626)',
      color: '#FFFFFF',
      boxShadow: '0 2px 6px rgba(38, 38, 38, 0.2)',
    },
    danger: {
      backgroundColor: 'var(--tuw-bg-error, #FEF4F4)',
      color: 'var(--tuw-text-error, #C91818)',
      border: '1px solid var(--tuw-text-error, #C91818)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--tuw-text-secondary, #5D6772)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--tuw-text-primary, #262626)',
      border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
    },
  };

  return (
    <button
      disabled={disabled}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}
