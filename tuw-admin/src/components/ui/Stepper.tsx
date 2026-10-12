'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  disabled?: boolean;
  /** Opt-in click-to-type exact value (bulk corrections). Default false. */
  editableValue?: boolean;
}

// Numeric quick-stepper (PE3): minus/value/plus in a 40px bordered control
// matching the form family. Buttons are natively keyboard-operable; the
// value display is tabular so digits never jitter while stepping.
export default function Stepper({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  ariaLabel = 'Quantity',
  disabled = false,
  editableValue = false,
}: StepperProps) {
  const clamp = (n: number) => {
    if (n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };
  // Click-to-type draft (ED1): opened from the value display, committed on
  // Enter/blur (clamped), reverted on Escape or invalid input.
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const startEdit = () => {
    if (disabled) return;
    setDraft(String(value));
    setEditing(true);
  };
  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n)) onChange(clamp(n));
    setEditing(false);
  };
  const btn = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--tuw-text-secondary, #5D6772)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  } as const;
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 40,
        padding: '0 4px',
        borderRadius: 8,
        border: '1px solid var(--tuw-border-control, #D1D5DB)',
        backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        className="tuw-danger-hover"
        disabled={disabled || editing || value <= min}
        onClick={() => onChange(clamp(value - step))}
        style={btn}
      >
        <Minus size={14} />
      </button>
      {editableValue && editing ? (
        <input
          type="number"
          aria-label={`${ariaLabel} (type exact value, Enter to confirm, Escape to cancel)`}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={draft}
          min={min}
          max={max}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          style={{
            width: 56,
            height: 28,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--tuw-text-primary, #262626)',
            fontFamily: 'var(--font-main)',
            border: '1px solid var(--tuw-action-primary, #7539FF)',
            borderRadius: 6,
            backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
            padding: 0,
          }}
        />
      ) : (
      <span
        className="tuw-tabular-nums"
        aria-live="polite"
        {...(editableValue
          ? {
              role: 'button' as const,
              tabIndex: 0,
              title: `Click to type exact ${ariaLabel}`,
              'aria-label': `Edit ${ariaLabel} (current ${value})`,
              onClick: startEdit,
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  startEdit();
                }
              },
            }
          : {})}
        style={{
          minWidth: 36,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--tuw-text-primary, #262626)',
          fontFamily: 'var(--font-main)',
          ...(editableValue
            ? { cursor: 'text', borderBottom: '1px dotted var(--tuw-border-control, #D1D5DB)' }
            : {}),
        }}
      >
        {value}
      </span>
      )}
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        className="tuw-success-hover"
        disabled={disabled || editing || (max !== undefined && value >= max)}
        onClick={() => onChange(clamp(value + step))}
        style={btn}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
