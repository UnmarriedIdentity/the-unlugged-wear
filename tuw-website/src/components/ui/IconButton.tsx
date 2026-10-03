'use client';

import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  variant?: 'ghost' | 'secondary' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
}

export default function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }[size];

  const variantClasses = {
    ghost: 'bg-transparent text-[#5A5A5A] hover:text-[#1A1A1A] hover:bg-black/5',
    secondary: 'bg-[#F4F1EA] text-[#1A1A1A] hover:bg-[#EAE5D9]',
    dark: 'bg-[#1A1A1A] text-white hover:bg-black',
    outline: 'border border-[#E2DDCF] bg-white text-[#1A1A1A] hover:bg-[#F4F1EA]',
  }[variant];

  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip || label}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
