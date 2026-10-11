'use client';

import React from 'react';

export interface HeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small caption above the value (12px secondary). Omit when the left
   * stack is fully custom. */
  label?: React.ReactNode;
  /** Value block, passed verbatim — 24px amounts, 20px stats, and text
   * leads all survive untouched. */
  children: React.ReactNode;
  /** Right-side node (usually a status Badge). */
  badge?: React.ReactNode;
}

// Drawer hero summary card (DW0): tinted summary strip at the top of drawer
// bodies. Shell-only (padding/canvas/radius/flex) — all value treatments
// live with the caller.
export default function HeroCard({ label, children, badge, style = {}, ...props }: HeroCardProps) {
  return (
    <div
      style={{
        padding: 16,
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        ...style,
      }}
      {...props}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {label ? (
          <span style={{ fontSize: 12, color: 'var(--tuw-text-secondary, #5D6772)' }}>{label}</span>
        ) : null}
        {children}
      </div>
      {badge ? <div style={{ flexShrink: 0 }}>{badge}</div> : null}
    </div>
  );
}
