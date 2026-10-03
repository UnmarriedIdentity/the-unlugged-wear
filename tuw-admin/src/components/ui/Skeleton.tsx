'use client';

import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--tuw-radius-control, 8px)',
  style = {},
  className = '',
}: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--tuw-border-subtle, #E5E7EB)',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
      className={className}
    />
  );
}
