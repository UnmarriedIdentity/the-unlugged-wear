import React from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';
import { Sparkline, type SparklineTone } from './Sparkline';
import { TrendBadge } from './TrendBadge';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface MetricCardProps {
  label: string;
  value: string | number;
  tabular?: boolean;
  delta: string;
  deltaTone?: 'up' | 'down';
  vsText?: string;
  sparkTone: SparklineTone;
}

// KPI metric card: label, value + sparkline row, delta badge + comparison row.
export function MetricCard({
  label,
  value,
  tabular = true,
  delta,
  deltaTone = 'up',
  vsText = 'vs yesterday',
  sparkTone,
}: MetricCardProps) {
  return (
    <SurfaceCard padding="20px 24px" gap="8px" hoverable className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      <div className={styles.kpiMiddleRow}>
        <span className={tabular ? `${styles.kpiValue} tuw-tabular-nums` : styles.kpiValue}>
          {value}
        </span>
        <Sparkline tone={sparkTone} label={`${label} trend`} />
      </div>
      <div className={styles.kpiBottomRow}>
        <TrendBadge value={delta} tone={deltaTone} />
        <span className={styles.trendVs}>{vsText}</span>
      </div>
    </SurfaceCard>
  );
}
