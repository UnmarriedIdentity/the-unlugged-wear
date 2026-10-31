import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

export type SparklineTone = 'up' | 'down';

interface SparklineProps {
  tone: SparklineTone;
  label?: string;
}

// Area + line sparkline matching the Figma KPI treatment.
// Tones: up = green (#00CB75 / #C6EAA0 wash), down = red (#E94845 wash).
export function Sparkline({ tone, label }: SparklineProps) {
  const gradId = React.useId();
  const isUp = tone === 'up';
  const linePath = isUp
    ? 'M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2'
    : 'M 0 10 C 12 10, 16 2, 24 4 C 32 6, 38 18, 48 14 C 58 10, 64 22, 74 18 C 80 15, 84 22, 90 20';
  const stroke = isUp ? '#00CB75' : '#E94845';
  const wash = isUp ? '#C6EAA0' : '#E94845';
  const washOpacity = isUp ? '0.7' : '0.4';
  return (
    <svg className={styles.kpiSparkline} viewBox="0 0 90 40" fill="none" role="img" aria-label={label ?? (isUp ? 'Upward trend' : 'Downward trend')}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wash} stopOpacity={washOpacity} />
          <stop offset="100%" stopColor={wash} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linePath} L 90 40 L 0 40 Z`} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
