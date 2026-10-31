'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'rect',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  }[variant];

  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`bg-[#EAE6DD] animate-pulse ${variantClasses} ${className}`}
    />
  );
}
