'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export default function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled,
  style = {},
  className = '',
  ...props
}: CheckboxProps) {
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
      <div style={{ position: 'relative', width: 18, height: 18, marginTop: 2 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{
            position: 'absolute',
            opacity: 0,
            width: '100%',
            height: '100%',
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
              checked
                ? 'var(--tuw-action-primary, #7539FF)'
                : 'var(--tuw-border-control, #D1D5DB)'
            }`,
            backgroundColor: checked
              ? 'var(--tuw-action-primary, #7539FF)'
              : 'var(--tuw-bg-surface, #FFFFFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {checked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
        </div>
      </div>

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
