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
}: StepperProps) {
  const clamp = (n: number) => {
    if (n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
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
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
        style={btn}
      >
        <Minus size={14} />
      </button>
      <span
        className="tuw-tabular-nums"
        aria-live="polite"
        style={{
          minWidth: 36,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--tuw-text-primary, #262626)',
          fontFamily: 'var(--font-main)',
        }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled || (max !== undefined && value >= max)}
        onClick={() => onChange(clamp(value + step))}
        style={btn}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
