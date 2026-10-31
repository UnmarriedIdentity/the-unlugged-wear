'use client';

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Textarea({
  label,
  error,
  helperText,
  disabled,
  className = '',
  id,
  rows = 4,
  ...props
}: TextareaProps) {
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

      <textarea
        id={generatedId}
        rows={rows}
        disabled={disabled}
        className={`w-full p-3.5 text-sm rounded-lg border bg-white outline-none transition-colors duration-150 resize-y placeholder:text-[#A0AEC0] text-[#1A1A1A] ${
          error
            ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20'
            : 'border-[#E2DDCF] hover:border-[#B5AEA1] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10'
        } ${disabled ? 'bg-[#F4F1EA] cursor-not-allowed opacity-60' : ''} ${className}`}
        {...props}
      />

      {error ? (
        <span className="text-xs text-[#EF4444] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#8A8A8A]">{helperText}</span>
      ) : null}
    </div>
  );
}
