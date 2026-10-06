'use client';

import React from 'react';

export interface FilterPillOption {
  value: string;
  label: string;
}

export interface FilterPillsProps {
  options: readonly FilterPillOption[] | FilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  /** rail: tinted container with white active pill (panel tabs); pills: borderless filter chips. */
  variant?: 'rail' | 'pills';
}

// Shared pill-tabs (N0): dumb, data-driven, mock/live agnostic. One change
// here propagates to notification categories and every page filter group.
export default function FilterPills({
  options,
  value,
  onChange,
  ariaLabel = 'Filter options',
  variant = 'pills',
}: FilterPillsProps) {
  const isRail = variant === 'rail';
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isRail ? '4px' : '6px',
        padding: isRail ? '4px' : 0,
        borderRadius: isRail ? 'var(--tuw-radius-card, 12px)' : 0,
        backgroundColor: isRail ? 'var(--tuw-bg-canvas, #F7F8F9)' : 'transparent',
        overflowX: 'auto',
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            style={{
              padding: isRail ? '8px 14px' : '4px 10px',
              borderRadius: isRail ? '8px' : '6px',
              fontSize: isRail ? '13px' : '12px',
              fontWeight: selected ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: '1px solid',
              borderColor: selected
                ? isRail
                  ? 'transparent'
                  : 'var(--tuw-action-primary, #7539FF)'
                : isRail
                  ? 'transparent'
                  : 'var(--tuw-border-subtle, #E5E7EB)',
              backgroundColor: selected
                ? isRail
                  ? 'var(--tuw-bg-surface, #FFFFFF)'
                  : 'var(--tuw-bg-selected, #F8F5FF)'
                : 'transparent',
              color: selected
                ? isRail
                  ? 'var(--tuw-text-primary, #262626)'
                  : 'var(--tuw-action-primary, #7539FF)'
                : 'var(--tuw-text-secondary, #5D6772)',
              boxShadow: selected && isRail ? '0 1px 3px rgba(38, 38, 38, 0.08)' : 'none',
              fontFamily: 'var(--font-main)',
              transition: 'all 0.15s ease',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
