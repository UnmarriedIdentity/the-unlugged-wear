'use client';

import React from 'react';

export interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Scrollable middle (drawers) vs static block (cards). Default true. */
  scrollable?: boolean;
}

// Panel body zone (PL0): flex column filler with a scroll contract.
// Paint-free — the caller owns all padding and type.
export default function PanelBody({ children, scrollable = true, style = {}, ...props }: PanelBodyProps) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: scrollable ? 'auto' : 'visible',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
