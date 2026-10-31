'use client';

import React from 'react';
import PanelHeader from './PanelHeader';
import PanelBody from './PanelBody';
import PanelFooter from './PanelFooter';

export interface PanelLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header zone node, rendered verbatim inside PanelHeader. */
  header?: React.ReactNode;
  /** Footer zone node, rendered verbatim inside PanelFooter. Omit for no footer. */
  footer?: React.ReactNode;
  /** Body content node, rendered inside PanelBody. */
  children: React.ReactNode;
  /** Scrollable middle (drawers) vs static block (cards). Default true. */
  scrollable?: boolean;
}

// Global panel layout (PL0): header + scrollable body + optional footer,
// usable anywhere a panel needs the contract (drawers first, cards next).
// Paint-free by design — no padding, border, background, or type — so hosts
// move their nodes verbatim and stay pixel-perfect. Dogfoods PanelHeader,
// PanelBody, and PanelFooter internally.
export default function PanelLayout({
  header,
  footer,
  children,
  scrollable = true,
  style = {},
  ...props
}: PanelLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        ...style,
      }}
      {...props}
    >
      {header ? <PanelHeader>{header}</PanelHeader> : null}
      <PanelBody scrollable={scrollable}>{children}</PanelBody>
      {footer ? <PanelFooter>{footer}</PanelFooter> : null}
    </div>
  );
}
