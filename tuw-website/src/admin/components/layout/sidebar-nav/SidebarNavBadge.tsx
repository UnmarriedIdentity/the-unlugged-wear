'use client';

import React from 'react';

interface SidebarNavBadgeProps {
  text: string;
  className: string;
}

/**
 * Count badge on nav rows (Fulfillment 4 purple, Returns 2 amber).
 * Styling arrives via className so variants stay data-driven.
 */
export default function SidebarNavBadge({ text, className }: SidebarNavBadgeProps) {
  return <span className={className}>{text}</span>;
}
