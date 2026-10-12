import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface ChartLegendProps {
  past: string;
  current: string;
}

// Dual-series legend: hollow past dot, solid current dot. Labels are data
// (per-range), so the legend stays truthful for any feed.
export function ChartLegend({ past, current }: ChartLegendProps) {
  return (
    <div className={styles.chartLegend}>
      <span className={styles.legendItem}>
        <span className={styles.legendDotLastWeek} />
        {past}
      </span>
      <span className={styles.legendItem}>
        <span className={styles.legendDotThisWeek} />
        {current}
      </span>
    </div>
  );
}
