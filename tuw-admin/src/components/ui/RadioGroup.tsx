'use client';

import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
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
  style?: React.CSSProperties;
}

/**
 * RadioGroup component conforming to TUW Design System
 * Supports keyboard arrow selection, description subtext, disabled states, and responsive orientation.
 */
export default function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = 'vertical',
  disabled = false,
  className = '',
  style = {},
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-disabled={disabled}
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: '12px',
        ...style,
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <label
            key={option.value}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1,
              userSelect: 'none',
              padding: '8px 12px',
              borderRadius: 'var(--tuw-radius-control, 8px)',
              border: isSelected
                ? '1px solid var(--tuw-action-primary, #7539FF)'
                : '1px solid var(--tuw-border-subtle, #E5E7EB)',
              backgroundColor: isSelected
                ? 'var(--tuw-bg-selected, #F8F5FF)'
                : 'var(--tuw-bg-surface, #FFFFFF)',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => !isDisabled && onChange(option.value)}
              style={{
                marginTop: '2px',
                accentColor: 'var(--tuw-action-primary, #7539FF)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                width: '16px',
                height: '16px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--tuw-text-primary, #262626)',
                  lineHeight: '20px',
                }}
              >
                {option.label}
              </span>
              {option.description && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--tuw-text-secondary, #5D6772)',
                    lineHeight: '16px',
                    marginTop: '2px',
                  }}
                >
                  {option.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
