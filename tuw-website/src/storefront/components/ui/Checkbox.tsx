'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}: CheckboxProps) {
  const generatedId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <label
      htmlFor={generatedId}
      className={`inline-flex items-start gap-3 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          id={generatedId}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
            checked
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
              : 'bg-white border-[#D1D5DB] hover:border-[#9CA3AF]'
          }`}
        >
          {checked && <Check size={13} strokeWidth={3} />}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-[#1A1A1A] leading-tight">{label}</span>}
          {description && (
            <span className="text-xs text-[#8A8A8A] mt-0.5 leading-snug">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}
