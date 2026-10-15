'use client';

import React from 'react';
import UpliftSurface from './UpliftSurface';

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
  /** Segment treatment. 'icon' (default, 32px squares — all existing
   * callers byte-identical); 'labeled' (full-width, icon + text with
   * dividers between segments). */
  variant?: 'icon' | 'labeled';
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
  variant = 'icon',
}: ViewToggleProps) {
  const labeled = variant === 'labeled';
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: labeled ? 0 : '4px',
        padding: '4px',
        borderRadius: 'var(--tuw-radius-card, 12px)',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        ...(labeled ? { width: '100%', boxSizing: 'border-box' } : { display: 'inline-flex', alignItems: 'center' }),
      }}
    >
      {options.map((option, i) => {
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
            className={labeled && selected ? 'tuw-stat-active' : ''}
            style={
              labeled
                ? {
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    minWidth: 0,
                    height: 36,
                    padding: '0 8px',
                    background: 'none',
                    border: 'none',
                    borderLeft:
                      i > 0 ? '1px solid var(--tuw-border-subtle, #E5E7EB)' : 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'var(--font-main)',
                    color: selected
                      ? 'var(--tuw-action-primary, #7539FF)'
                      : 'var(--tuw-text-secondary, #5D6772)',
                  }
                : {
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    padding: 0,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }
            }
          >
            {labeled ? (
              <>
                {option.icon}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option.label}
                </span>
              </>
            ) : (
            <UpliftSurface
              active={selected}
              width={32}
              height={32}
              radius={8}
              style={{
                color: selected
                  ? 'var(--tuw-action-primary, #7539FF)'
                  : 'var(--tuw-text-secondary, #5D6772)',
                transition: 'all 0.15s ease',
              }}
            >
              {option.icon}
            </UpliftSurface>
            )}
          </button>
        );
      })}
    </div>
  );
}
