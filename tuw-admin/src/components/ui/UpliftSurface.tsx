'use client';

import React from 'react';

export interface UpliftSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Active: white face + inset 3D edge. Inactive: transparent, no shadow. */
  active?: boolean;
  /** Any size — width/height of the caller’s choosing. Defaults to auto. */
  width?: number | string;
  height?: number | string;
  /** Corner radius. Defaults to the control radius. */
  radius?: number | string;
}

// Shared 3D uplift surface (US1): the sidebar active-nav relief
// (.tuw-3d-active) as a reusable component. Zero geometry of its own —
// size comes entirely from width/height props so it fits anywhere.
// Interactive semantics stay with the caller (button, radio, tab).
export default function UpliftSurface({
  active = false,
  width = 'auto',
  height = 'auto',
  radius = 'var(--tuw-radius-control, 8px)',
  style = {},
  className = '',
  children,
  ...props
}: UpliftSurfaceProps) {
  return (
    <div
      className={`${active ? 'tuw-3d-active' : ''} ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: radius,
        display: 'inline-flex',
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
