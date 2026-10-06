import React from 'react';
import { ArrowUp } from 'lucide-react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface TrendBadgeProps {
  value: string;
  tone?: 'up' | 'down';
  iconSize?: number;
  iconStrokeWidth?: number;
  landed?: boolean;
}

// Dumb delta pill: green for up, red for down. Value is a preformatted
// string — the badge never computes, so mock or live feeds behave the same.
// `landed` plays the one-shot settle pop (parent clears it after ~200ms).
export function TrendBadge({ value, tone = 'up', iconSize = 14, iconStrokeWidth = 2, landed = false }: TrendBadgeProps) {
  return (
    <span className={`${tone === 'up' ? styles.trendBadgeGreen : styles.trendBadgeRed} ${landed ? styles.trendLanded : ''}`.trim()}>
      <ArrowUp size={iconSize} strokeWidth={iconStrokeWidth} />
      {value}
    </span>
  );
}
