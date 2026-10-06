'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { FilterMenu } from './FilterMenu';
import { TrendBadge } from './TrendBadge';
import EmptyState from '@/components/ui/EmptyState';
import { SALES_RANGES, type SalesTrendPoint } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

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
          <div className={styles.chartLegend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotLastWeek} />
              {legendPast}
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotThisWeek} />
              {legendCurrent}
            </span>
          </div>

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
        <div className={styles.chartContainer}>
          <div className={`${styles.yAxisLabels} tuw-tabular-nums`}>
            <span>₹10K</span>
            <span>₹8K</span>
            <span>₹6K</span>
            <span>₹4K</span>
            <span>₹2K</span>
            <span>₹0</span>
          </div>

          <div className={styles.chartPlotArea}>
            <div className={styles.gridLinesWrapper}>
              <div className={styles.gridLine} />
              <div className={styles.gridLine} />
              <div className={styles.gridLine} />
              <div className={styles.gridLine} />
              <div className={styles.gridLine} />
              <div className={styles.gridLine} />
            </div>

            <div className={styles.barsArea}>
              {points.map((item) => (
                <div key={item.day} className={styles.barGroup}>
                  <div
                    className={`${styles.barColumn} ${styles.barColumnLastWeek}`}
                    style={{ height: barHeight(item.lastWeek, points) }}
                  />
                  <div
                    className={`${styles.barColumn} ${styles.barColumnThisWeek}`}
                    style={{ height: barHeight(item.thisWeek, points) }}
                  />
                  <div className={styles.barTooltip}>
                    <span className={styles.tooltipDay}>{item.day}</span>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipDotThisWeek} />
                      <span className={styles.tooltipLabel}>{legendCurrent}:</span>
                      <strong className="tuw-tabular-nums">{item.thisVal}</strong>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipDotLastWeek} />
                      <span className={styles.tooltipLabel}>{legendPast}:</span>
                      <strong className="tuw-tabular-nums">{item.lastVal}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.xAxisLabels}>
              {points.map((item) => (
                <span key={item.day} className={styles.xAxisDay}>
                  {item.day}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
