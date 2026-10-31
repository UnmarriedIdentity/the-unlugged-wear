'use client';

import React from 'react';

export interface DrawerSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section heading — the exact drawer h4 (14/600/primary). Omit for untitled groups. */
  title?: string;
  children: React.ReactNode;
  /** Space below the heading (sites use 8–16). Default 10. Children keep
   * their own inner containers and gaps — the section adds no wrapper gap,
   * so per-site rhythm reproduces exactly. */
  titleGap?: number;
}

// Drawer content section (DW0): titled group inside drawer bodies.
// Structure-only — the heading treatment is shared verbatim, all paint and
// child rhythm live with the caller's content.
export default function DrawerSection({
  title,
  children,
  titleGap = 10,
  style = {},
  ...props
}: DrawerSectionProps) {
  return (
    <div style={{ ...style }} {...props}>
      {title ? (
        <h4
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--tuw-text-primary, #262626)',
            fontFamily: 'var(--font-main)',
            margin: `0 0 ${titleGap}px 0`,
          }}
        >
          {title}
        </h4>
      ) : null}
      {children}
    </div>
  );
}
