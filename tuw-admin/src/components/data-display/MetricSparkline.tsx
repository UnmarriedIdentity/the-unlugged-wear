'use client';

import React from 'react';

interface MetricSparklineProps {
  type?: 'green' | 'red';
  className?: string;
}

export function MetricSparkline({ type = 'green', className = '' }: MetricSparklineProps) {
  const isGreen = type === 'green';
  const gradId = isGreen ? 'sparkGreenGradAdmin' : 'sparkRedGradAdmin';
  const strokeColor = isGreen ? '#187343' : '#C91818';

  return (
    <svg className={className} viewBox="0 0 90 40" fill="none" style={{ width: 90, height: 38 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isGreen ? '#C6EAA0' : '#FEF4F4'} stopOpacity={0.7} />
          <stop offset="100%" stopColor={isGreen ? '#C6EAA0' : '#FEF4F4'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={
          isGreen
            ? 'M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2 L 90 40 L 0 40 Z'
            : 'M 0 10 C 12 10, 16 2, 24 4 C 32 6, 38 18, 48 14 C 58 10, 64 22, 74 18 C 80 15, 84 22, 90 20 L 90 40 L 0 40 Z'
        }
        fill={`url(#${gradId})`}
      />
      <path
        d={
          isGreen
            ? 'M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2'
            : 'M 0 10 C 12 10, 16 2, 24 4 C 32 6, 38 18, 48 14 C 58 10, 64 22, 74 18 C 80 15, 84 22, 90 20'
        }
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
