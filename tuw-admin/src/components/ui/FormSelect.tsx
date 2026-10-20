'use client';

import React, { useId } from 'react';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label above the control (13/500/primary, shared treatment). */
  label?: string;
  /** Helper copy below the control (12/18/secondary). */
  helperText?: React.ReactNode;
  /** Control font size. Sites use 13 (default) or 14. */
  fontSize?: number;
  /** Horizontal padding. Sites use 10 (default) or 12. */
  padX?: number;
}

// 40px native-select treatment (DW0): the exact metrics raw <select>s use
// across drawers and modals (height 40, radius 8, control border). Deliberately
// distinct from ui/Select (42px) — each keeps its consumers pixel-identical.
// Border resolves through the shared token, so fallback variance in old
// call sites collapses to one value. Cards that pair selects with 44px Inputs
// may override height through style so labels and helper copy stay aligned.
export default function FormSelect({
  label,
  helperText,
  fontSize = 13,
  padX = 10,
  style = {},
  id,
  'aria-describedby': ariaDescribedBy,
  children,
  ...props
}: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helperId = helperText ? `${selectId}-help` : undefined;
  const describedBy = [ariaDescribedBy, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      {label ? (
        <label
          htmlFor={selectId}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--tuw-text-primary, #262626)',
            fontFamily: 'var(--font-main)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          height: 40,
          borderRadius: 8,
          border: '1px solid var(--tuw-border-control, #D1D5DB)',
          padding: `0 ${padX}px`,
          fontSize,
          fontFamily: 'var(--font-main)',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          color: 'var(--tuw-text-primary, #262626)',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {helperText ? (
        <p
          id={helperId}
          style={{
            margin: '8px 0 0',
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--tuw-text-secondary, #5D6772)',
            fontFamily: 'var(--font-main)',
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
