import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

export interface ChartTooltipRow {
  series: 'past' | 'current';
  label: string;
  value: string;
}

interface ChartTooltipProps {
  title: string;
  rows: ChartTooltipRow[];
}

// Hover tooltip for one bar group. Rows are data — any series labels and
// values render without touching this component.
export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <div className={styles.barTooltip}>
      <span className={styles.tooltipDay}>{title}</span>
      {rows.map((row) => (
        <div key={row.label} className={styles.tooltipRow}>
          <span className={row.series === 'current' ? styles.tooltipDotThisWeek : styles.tooltipDotLastWeek} />
          <span className={styles.tooltipLabel}>{row.label}:</span>
          <strong className="tuw-tabular-nums">{row.value}</strong>
        </div>
      ))}
    </div>
  );
}
