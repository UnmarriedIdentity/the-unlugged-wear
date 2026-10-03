'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: SwitchProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          backgroundColor: checked
            ? 'var(--tuw-action-primary, #7539FF)'
            : 'var(--tuw-border-control, #D1D5DB)',
          position: 'relative',
          transition: 'background-color 0.2s',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          }}
        />
      </div>

      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {label && (
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tuw-text-primary, #262626)' }}>
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
