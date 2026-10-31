'use client';

import React from 'react';

export interface MediaFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Frame content (video / next/image nodes), passed verbatim. */
  children: React.ReactNode;
  /** Frame height (products drawer 220, media drawer 260). No default — caller-owned. */
  height: number | string;
  /** Frame width. Default '100%' — pass a number for fixed thumbs (e.g. 40). */
  width?: number | string;
  /** Corner radius (products 10, media 8). Default 10. */
  radius?: number | string;
}

// Drawer media frame (PD0): bordered media well for drawer bodies.
// Shell-only (size/border/radius/bg/overflow) — video and image nodes pass
// through verbatim, so cover/contain treatments survive untouched. Border
// resolves through the shared token; stale per-site fallbacks collapse.
export default function MediaFrame({
  children,
  height,
  width = '100%',
  radius = 10,
  style = {},
  ...props
}: MediaFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        border: '1px solid var(--tuw-border-subtle, #E5E7EB)',
        backgroundColor: 'var(--tuw-bg-canvas, #F7F8F9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
