'use client';

import React, { useRef } from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  /** Box-only render (no label/text wrapper), centered — table cells and inline attach points. */
  bare?: boolean;
  /** Tri-state dash for header select-all. Takes visual precedence over checked. */
  indeterminate?: boolean;
  /**
   * 'multi' toggles freely. 'single' is radio-like: clicking the checked box
   * will not toggle it off. Group exclusivity stays caller-owned
   * (e.g. setSelectedId(id)); the table track uses 'multi'.
   */
  mode?: 'multi' | 'single';
}

export default function Checkbox({
  label,
  description,
  checked,
  indeterminate = false,
  bare = false,
  mode = 'multi',
  onChange,
  disabled,
  style = {},
  className = '',
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showingDash = indeterminate && !checked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'single' && checked) return;
    onChange?.(e);
  };

  const box = (
    <div style={{ position: 'relative', width: 18, height: 18, marginTop: bare ? 0 : 2 }}>
      <input
        ref={(el) => {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          if (el) el.indeterminate = indeterminate;
        }}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          cursor: 'inherit',
        }}
        {...props}
      />
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '4px',
          border: `1.5px solid ${
            checked || showingDash
              ? 'var(--tuw-action-primary, #7539FF)'
              : 'var(--tuw-border-control, #D1D5DB)'
          }`,
          backgroundColor:
            checked || showingDash
              ? 'var(--tuw-action-primary, #7539FF)'
              : 'var(--tuw-bg-surface, #FFFFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          pointerEvents: 'none',
        }}
      >
        {showingDash ? (
          <Minus size={12} color="#FFFFFF" strokeWidth={3} />
        ) : (
          checked && <Check size={12} color="#FFFFFF" strokeWidth={3} />
        )}
      </div>
    </div>
  );

  if (bare) {
    return (
      <span
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          if ((e.target as HTMLElement).tagName !== 'INPUT') inputRef.current?.click();
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          ...style,
        }}
        className={className}
      >
        {box}
      </span>
    );
  }

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        ...style,
      }}
      className={className}
    >
      {box}

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: disabled ? 'var(--tuw-text-secondary, #5D6772)' : 'var(--tuw-text-primary, #262626)',
              }}
            >
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: '12px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
