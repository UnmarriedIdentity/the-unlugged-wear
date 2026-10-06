import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface BarGroupProps {
  pastHeight: string;
  currentHeight: string;
  tooltip: React.ReactNode;
}

// One dual-bar group: past (hollow) + current (solid) columns with a hover
// tooltip. Heights arrive pre-normalized — this component only paints.
export function BarGroup({ pastHeight, currentHeight, tooltip }: BarGroupProps) {
  return (
    <div className={styles.barGroup}>
      <div
        className={`${styles.barColumn} ${styles.barColumnLastWeek}`}
        style={{ height: pastHeight }}
      />
      <div
        className={`${styles.barColumn} ${styles.barColumnThisWeek}`}
        style={{ height: currentHeight }}
      />
      {tooltip}
    </div>
  );
}
