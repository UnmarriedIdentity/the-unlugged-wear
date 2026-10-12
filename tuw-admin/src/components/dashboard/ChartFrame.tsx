import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface ChartFrameProps {
  ticks: string[];
  labels: string[];
  children: React.ReactNode;
}

// Chart base: Y-axis ticks + dashed gridlines + plot area + X-axis labels.
// Fluid width, CSS-owned height. Bars arrive as children; labels drive the
// X axis — any point count renders without touching this component.
export function ChartFrame({ ticks, labels, children }: ChartFrameProps) {
  return (
    <div className={styles.chartContainer}>
      <div className={`${styles.yAxisLabels} tuw-tabular-nums`}>
        {ticks.map((tick, i) => (
          <span key={`tick-${i}`}>{tick}</span>
        ))}
      </div>

      <div className={styles.chartPlotArea}>
        <div className={styles.gridLinesWrapper} aria-hidden="true">
          {ticks.map((tick, i) => (
            <div key={`grid-${i}`} className={styles.gridLine} />
          ))}
        </div>

        <div className={styles.barsArea}>{children}</div>

        <div className={styles.xAxisLabels}>
          {labels.map((label, i) => (
            <span key={`x-${i}`} className={styles.xAxisDay}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
