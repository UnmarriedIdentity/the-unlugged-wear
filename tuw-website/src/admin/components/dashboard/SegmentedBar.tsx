import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface SegmentedBarProps {
  total?: number;
  filled: number;
  tone?: 'red' | 'orange';
}

// Segmented stock meter: `filled` of `total` segments lit in the tone.
// Data-only props — any count or severity maps without touching this.
export function SegmentedBar({ total = 5, filled, tone = 'orange' }: SegmentedBarProps) {
  return (
    <div className={styles.segmentedBar}>
      {Array.from({ length: total }, (_, i) => i + 1).map((idx) => (
        <div
          key={idx}
          className={`${styles.barSegment} ${
            idx <= filled
              ? tone === 'red'
                ? styles.segmentFilledRed
                : styles.segmentFilledOrange
              : styles.segmentEmpty
          }`}
        />
      ))}
    </div>
  );
}
