'use client';

import React, { useId } from 'react';
import InfoTooltip from './InfoTooltip';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label above the control. Inside DrawerCard it inherits 14/600; legacy default 13/500. */
  label?: string;
  /** Supplementary label hint rendered as an info icon + tooltip. */
  labelTooltip?: string;
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
  labelTooltip,
  helperText,
  fontSize = 13,
  padX = 10,
  style = {},
  id,
  required,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 6,
            minWidth: 0,
            minHeight: 'var(--tuw-field-label-row-height, 0px)',
          }}
        >
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--tuw-field-label-size, 13px)',
              fontWeight: 'var(--tuw-field-label-weight, 500)',
              color: 'var(--tuw-text-primary, #262626)',
              fontFamily: 'var(--font-main)',
            }}
          >
            {label}
            {required ? (
              <span
                aria-hidden="true"
                style={{
                  marginLeft: 4,
                  color: 'var(--tuw-text-secondary, #5D6772)',
                  fontWeight: 'var(--tuw-field-label-weight, 500)',
                }}
              >
                *
              </span>
            ) : null}
          </label>
          {labelTooltip ? (
            <InfoTooltip
              label={`More information about ${label}`}
              content={labelTooltip}
            />
          ) : null}
        </div>
      ) : null}
      <select
        id={selectId}
        aria-describedby={describedBy}
        required={required}
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
