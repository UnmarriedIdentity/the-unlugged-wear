import React from 'react';
import { ArrowUp } from 'lucide-react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface TrendBadgeProps {
  value: string;
  tone?: 'up' | 'down';
  iconSize?: number;
  iconStrokeWidth?: number;
}

// Dumb delta pill: green for up, red for down. Value is a preformatted
// string — the badge never computes, so mock or live feeds behave the same.
export function TrendBadge({ value, tone = 'up', iconSize = 14, iconStrokeWidth = 2 }: TrendBadgeProps) {
  return (
    <span className={tone === 'up' ? styles.trendBadgeGreen : styles.trendBadgeRed}>
      <ArrowUp size={iconSize} strokeWidth={iconStrokeWidth} />
      {value}
    </span>
  );
}
