'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
}

export default function Select({
  options,
  label,
  error,
  helperText,
  onChange,
  disabled,
  className = '',
  id,
  value,
  ...props
}: SelectProps) {
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

      <div className="relative w-full">
        <select
          id={generatedId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full h-11 pl-3.5 pr-10 text-sm rounded-lg border bg-white appearance-none outline-none transition-colors duration-150 text-[#1A1A1A] cursor-pointer ${
            error
              ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
              : 'border-[#E2DDCF] hover:border-[#B5AEA1] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10'
          } ${disabled ? 'bg-[#F4F1EA] cursor-not-allowed opacity-60' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A8A]"
        />
      </div>

      {error ? (
        <span className="text-xs text-[#EF4444] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#8A8A8A]">{helperText}</span>
      ) : null}
    </div>
  );
}
