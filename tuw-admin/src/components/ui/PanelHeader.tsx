'use client';

import React from 'react';

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Panel header zone (PL0): flex-none, renders nodes verbatim. Paint-free —
// the caller owns all padding, borders, backgrounds, and type.
export default function PanelHeader({ children, style = {}, ...props }: PanelHeaderProps) {
  return (
    <div style={{ flex: 'none', ...style }} {...props}>
      {children}
    </div>
  );
}
