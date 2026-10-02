'use client';

import React from 'react';
import Link from 'next/link';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  href?: string;
}

export default function Button({
  children,
  variant = 'dark',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  icon,
  iconPosition = 'left',
  href,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-xs tracking-wider uppercase font-semibold',
    md: 'h-11 px-6 text-sm tracking-wide font-medium',
    lg: 'h-14 px-8 text-base tracking-wide font-medium',
  }[size];

  const variantClasses = {
    primary: 'bg-[#7539FF] text-white hover:bg-[#6025DB] active:bg-[#501EB8] shadow-sm',
    dark: 'bg-[#1A1A1A] text-white hover:bg-black active:bg-[#2A2A2A] shadow-sm',
    secondary: 'bg-[#F4F1EA] text-[#1A1A1A] hover:bg-[#EAE5D9] active:bg-[#DFD9CB] border border-[#E2DDCF]',
    outline: 'bg-transparent text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white',
    ghost: 'bg-transparent text-[#5A5A5A] hover:text-[#1A1A1A] hover:bg-black/5',
    danger: 'bg-[#FEF4F4] text-[#C91818] border border-[#FED7D7] hover:bg-[#FDE8E8]',
  }[variant];

  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 cursor-pointer select-none text-center ${
    fullWidth ? 'w-full' : 'w-auto'
  } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${sizeClasses} ${variantClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
          </>
        )}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={baseClasses}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
        </>
      )}
    </button>
  );
}
