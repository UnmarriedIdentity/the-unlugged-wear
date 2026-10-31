'use client';

import React from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  className?: string;
}

export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
  disabled = false,
  className = '',
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-disabled={disabled}
      className={`flex ${orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row flex-wrap gap-4'} ${className}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <label
            key={option.value}
            className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all select-none ${
              isDisabled
                ? 'cursor-not-allowed opacity-50 bg-[#FAF9F6] border-[#E2DDCF]'
                : isSelected
                ? 'border-[#1A1A1A] bg-white ring-1 ring-[#1A1A1A] cursor-pointer'
                : 'border-[#E2DDCF] bg-white hover:border-[#B5AEA1] cursor-pointer'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => !isDisabled && onChange(option.value)}
              className="mt-0.5 accent-[#1A1A1A] w-4 h-4"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#1A1A1A]">{option.label}</span>
              {option.description && (
                <span className="text-xs text-[#8A8A8A] mt-0.5">{option.description}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
