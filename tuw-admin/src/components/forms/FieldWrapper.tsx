'use client';

import React from 'react';

export interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standard Form Field Wrapper adhering to TUW Design System
 */
export default function FieldWrapper({
  label,
  required = false,
  optional = false,
  tooltip,
  error,
  helperText,
  children,
  className = '',
  style = {},
}: FieldWrapperProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        ...style,
      }}
    >
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--tuw-text-primary, #262626)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--tuw-status-danger, #EF4444)' }}>*</span>}
          </label>
          {optional && (
            <span style={{ fontSize: '12px', color: 'var(--tuw-text-tertiary, #9CA3AF)' }}>
              Optional
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--tuw-status-danger, #EF4444)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--tuw-text-secondary, #6B7280)',
            marginTop: '2px',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
