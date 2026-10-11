'use client';

import React from 'react';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label above the control (13/500/primary, shared treatment). */
  label?: string;
  /** Control font size. Sites use 13 (default) or 14. */
  fontSize?: number;
  /** Horizontal padding. Sites use 10 (default) or 12. */
  padX?: number;
}

// 40px native-select treatment (DW0): the exact metrics raw <select>s use
// across drawers and modals (height 40, radius 8, control border). Deliberately
// distinct from ui/Select (42px) — each keeps its consumers pixel-identical.
// Border resolves through the shared token, so fallback variance in old
// call sites collapses to one value.
export default function FormSelect({
  label,
  fontSize = 13,
  padX = 10,
  style = {},
  children,
  ...props
}: FormSelectProps) {
  return (
    <div>
      {label ? (
        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--tuw-text-primary, #262626)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      ) : null}
      <select
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
    </div>
  );
}
