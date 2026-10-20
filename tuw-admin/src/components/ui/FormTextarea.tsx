'use client';

import React from 'react';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label above the control. Inside DrawerCard it inherits 14/600; legacy default 13/500. */
  label?: string;
  /** Inner padding. Sites use '8px 12px' (default) or '10px 12px'. */
  pad?: string;
  /** Control font size. Default 13. */
  fontSize?: number;
}

// 40px-family textarea (PD0): the exact metrics raw drawer textareas use
// (radius 8, control border, inherited font). Deliberately distinct from
// ui/Textarea (10/14 padding, 14px) — each keeps its consumers pixel-identical.
export default function FormTextarea({
  label,
  pad = '8px 12px',
  fontSize = 13,
  style = {},
  children,
  ...props
}: FormTextareaProps) {
  return (
    <div>
      {label ? (
        <label
          style={{
            fontSize: 'var(--tuw-field-label-size, 13px)',
            fontWeight: 'var(--tuw-field-label-weight, 500)',
            color: 'var(--tuw-text-primary, #262626)',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      ) : null}
      <textarea
        style={{
          width: '100%',
          borderRadius: 8,
          border: '1px solid var(--tuw-border-control, #D1D5DB)',
          padding: pad,
          fontSize,
          fontFamily: 'inherit',
          backgroundColor: 'var(--tuw-bg-surface, #FFFFFF)',
          color: 'var(--tuw-text-primary, #262626)',
          ...style,
        }}
        {...props}
      >
        {children}
      </textarea>
    </div>
  );
}
