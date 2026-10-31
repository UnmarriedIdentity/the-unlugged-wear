'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'dark' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs uppercase tracking-wider font-semibold',
    md: 'px-2.5 py-1 text-xs uppercase tracking-wider font-semibold',
  }[size];

  const variantClasses = {
    neutral: 'bg-store-cream text-store-text-secondary border border-store-card-border',
    dark: 'bg-store-charcoal text-white',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    outline: 'bg-transparent text-store-charcoal border border-store-charcoal/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
