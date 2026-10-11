'use client';

import React from 'react';

export interface KeyValueItem {
  label: string;
  value: React.ReactNode;
}

export interface KeyValueListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: KeyValueItem[];
  /** Stack gap between rows. Default 10. */
  gap?: number;
  /** Divided variant (media drawer): hairline rule under each row. */
  divided?: boolean;
}

// Drawer key-value list (DW0): label/value rows inside drawer bodies.
// Labels share the secondary treatment; values pass through verbatim so
// per-site weight, ink, and tabular figures survive untouched.
export default function KeyValueList({
  items,
  gap = 10,
  divided = false,
  style = {},
  ...props
}: KeyValueListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }} {...props}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 13,
            ...(divided
              ? {
                  borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)',
                  paddingBottom: 8,
                }
              : null),
          }}
        >
          <span style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{item.label}</span>
          <span
            style={{
              fontWeight: 500,
              color: 'var(--tuw-text-primary, #262626)',
              textAlign: 'right',
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
