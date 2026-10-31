'use client';

import React from 'react';

export interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Panel footer zone (PL0): flex-none with margin-top auto, so it pins to
// the bottom in scrollable mode with short content (a no-op in auto-height
// hosts). Paint-free — the caller owns all padding, borders, backgrounds.
export default function PanelFooter({ children, style = {}, ...props }: PanelFooterProps) {
  return (
    <div style={{ flex: 'none', marginTop: 'auto', ...style }} {...props}>
      {children}
    </div>
  );
}
