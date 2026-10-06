import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface ProgressBarProps {
  pct: number;
}

// Linear meter: track + fill + percent label. `pct` is data (0-100);
// the bar never computes, so any feed renders without touching this.
export function ProgressBar({ pct }: ProgressBarProps) {
  return (
    <div className={styles.productProgressContainer}>
      <div className={styles.progressBarTrack}>
        <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.progressPercentText}>{pct}%</span>
    </div>
  );
}
