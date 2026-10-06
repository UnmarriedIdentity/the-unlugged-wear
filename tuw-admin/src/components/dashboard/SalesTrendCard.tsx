'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { BarGroup } from './BarGroup';
import { ChartFrame } from './ChartFrame';
import { ChartLegend } from './ChartLegend';
import { ChartTooltip } from './ChartTooltip';
import { DashboardCard } from './DashboardCard';
import { FilterMenu } from './FilterMenu';
import { TrendBadge } from './TrendBadge';
import EmptyState from '@/components/ui/EmptyState';
import { SALES_RANGES, type SalesTrendPoint } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

const SALES_Y_TICKS = ['₹10K', '₹8K', '₹6K', '₹4K', '₹2K', '₹0'];

interface SalesTrendCardProps {
  points: SalesTrendPoint[];
  total: string;
  delta: number;
  legendPast: string;
  legendCurrent: string;
  compareLabel: string;
  timeRange: string;
  onRangeChange: (range: string) => void;
}

// Normalize bar values against the data max (floor 100 keeps the Figma
// percentage heights pixel-identical for the default feed).
function barHeight(value: number, points: SalesTrendPoint[]): string {
  const max = Math.max(100, ...points.map((p) => Math.max(p.lastWeek, p.thisWeek)));
  return `${(value / max) * 100}%`;
}

export function SalesTrendCard({
  points,
  total,
  delta,
  legendPast,
  legendCurrent,
  compareLabel,
  timeRange,
  onRangeChange,
}: SalesTrendCardProps) {
  return (
    <DashboardCard
      variant="sales"
      title="Sales trend"
      action={
        <div className={styles.salesHeaderRight}>
          <ChartLegend past={legendPast} current={legendCurrent} />

          <FilterMenu
            options={SALES_RANGES.map((range) => ({ value: range, label: range }))}
            value={timeRange}
            onChange={onRangeChange}
            ariaLabel="Sales time range"
          />
        </div>
      }
      subheader={
        <div className={styles.salesStatRow}>
          <span className={`${styles.salesLargeNumber} tuw-tabular-nums`}>{total}</span>
          <TrendBadge value={`${delta.toFixed(1)}%`} iconSize={13} iconStrokeWidth={2.5} />
          <span className={styles.trendSubtext}>{compareLabel}</span>
        </div>
      }
    >
      {points.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="No sales data"
          description="There is nothing to chart for this range yet. Try a different range."
          actionText="Reset to This week"
          onAction={() => onRangeChange('This week')}
        />
      ) : (
        <ChartFrame ticks={SALES_Y_TICKS} labels={points.map((item) => item.day)}>
          {points.map((item) => (
            <BarGroup
              key={item.day}
              pastHeight={barHeight(item.lastWeek, points)}
              currentHeight={barHeight(item.thisWeek, points)}
              tooltip={
                <ChartTooltip
                  title={item.day}
                  rows={[
                    { series: 'current', label: legendCurrent, value: item.thisVal },
                    { series: 'past', label: legendPast, value: item.lastVal },
                  ]}
                />
              }
            />
          ))}
        </ChartFrame>
      )}
    </DashboardCard>
  );
}
