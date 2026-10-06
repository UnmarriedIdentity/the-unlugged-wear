import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface OnlineBadgeProps {
  label: string;
}

// Presence pill: pulsing dot + label. The count text is data — pass any
// live value later without touching this component.
export function OnlineBadge({ label }: OnlineBadgeProps) {
  return (
    <div className={styles.onlineBadge}>
      <span className={styles.pulseDot} />
      <span>{label}</span>
    </div>
  );
}
