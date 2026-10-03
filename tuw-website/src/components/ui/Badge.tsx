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
    sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold',
    md: 'px-2.5 py-1 text-xs uppercase tracking-wider font-semibold',
  }[size];

  const variantClasses = {
    neutral: 'bg-[#F4F1EA] text-[#5A5A5A] border border-[#E2DDCF]',
    dark: 'bg-[#1A1A1A] text-white',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
    success: 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
    error: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]',
    outline: 'bg-transparent text-[#1A1A1A] border border-[#1A1A1A]/20',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}
