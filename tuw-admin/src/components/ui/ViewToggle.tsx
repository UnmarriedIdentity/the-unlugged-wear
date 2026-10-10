'use client';

import React from 'react';

export interface ViewToggleOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export interface ViewToggleProps {
  options: ViewToggleOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

// Segmented grid/table view switch (VT1): dumb, props-fed, mock/live
// agnostic. Rail aesthetics (tinted container, white active pill) so it sits
// naturally beside FilterPills. Reusable anywhere a dense/relaxed view pair
// exists (products table, media grid later).
export default function ViewToggle({
  options,
  value,
  onChange,
  ariaLabel = 'Change view',
}: ViewToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              backgroundColor: selected
                ? 'var(--tuw-bg-surface, #FFFFFF)'
                : 'transparent',
              color: selected
                ? 'var(--tuw-action-primary, #7539FF)'
                : 'var(--tuw-text-secondary, #5D6772)',
              cursor: 'pointer',
              boxShadow: selected ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
