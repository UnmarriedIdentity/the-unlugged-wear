'use client';

import React from 'react';

export interface ItemsRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary line (14/600/primary) — product name, order id, collection name. */
  title?: string;
  /** Secondary line (12/secondary) — variant · qty, dates, categories. */
  meta?: string;
  /** Fully custom left stack (verbatim) — overrides title/meta where the
   * site uses inline mixed formatting (collections product lines). */
  left?: React.ReactNode;
  /** Right-side node (money, badges) — passed verbatim. */
  right?: React.ReactNode;
  /** Row padding (sites use 10–12). Default 12. */
  pad?: number;
}

// Drawer items row (DW0): order lines, history rows, product rows. Shell +
// left stack shared verbatim; the right node passes through untouched.
export default function ItemsRow({ title, meta, left, right, pad = 12, style = {}, ...props }: ItemsRowProps) {
  return (
    <div
      style={{
        padding: pad,
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontSize: 13,
        ...style,
      }}
      {...props}
    >
      {left ? (
        left
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          {title}
        </span>
        {meta ? (
          <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{meta}</span>
        ) : null}
      </div>
      )}
      {right ? <div style={{ flexShrink: 0, textAlign: 'right' }}>{right}</div> : null}
    </div>
  );
}
