'use client';

import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helperText,
  prefix,
  suffix,
  disabled,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={generatedId}
          className="text-xs font-semibold tracking-wider uppercase text-[#5A5A5A]"
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center w-full rounded-lg border bg-white transition-colors duration-150 ${
          error
            ? 'border-[#EF4444] focus-within:ring-2 focus-within:ring-[#EF4444]/20'
            : 'border-[#E2DDCF] hover:border-[#B5AEA1] focus-within:border-[#1A1A1A] focus-within:ring-2 focus-within:ring-[#1A1A1A]/10'
        } ${disabled ? 'bg-[#F4F1EA] cursor-not-allowed opacity-60' : ''}`}
      >
        {prefix && <span className="pl-3.5 text-[#8A8A8A] flex items-center">{prefix}</span>}
        <input
          id={generatedId}
          disabled={disabled}
          className={`w-full h-11 px-3.5 text-sm bg-transparent outline-none placeholder:text-[#A0AEC0] text-[#1A1A1A] ${className}`}
          {...props}
        />
        {suffix && <span className="pr-3.5 text-[#8A8A8A] flex items-center">{suffix}</span>}
      </div>

      {error ? (
        <span className="text-xs text-[#EF4444] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#8A8A8A]">{helperText}</span>
      ) : null}
    </div>
  );
}
