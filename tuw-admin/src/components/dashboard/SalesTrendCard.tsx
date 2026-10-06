'use client';

import React, { useState } from 'react';
import { ArrowUp, BarChart3, ChevronDown } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
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
  const [menuOpen, setMenuOpen] = useState(false);

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

          <div className="relative">
            <button
              type="button"
              className={styles.filterSelectBtn}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span>{timeRange}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <>
                <div
                  aria-hidden="true"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div role="menu" className={`${styles.rangeMenu} absolute right-0 top-full z-50 mt-2`}>
                  {SALES_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      role="menuitemradio"
                      aria-checked={range === timeRange}
                      className={range === timeRange ? styles.rangeMenuItemSelected : styles.rangeMenuItem}
                      onClick={() => {
                        onRangeChange(range);
                        setMenuOpen(false);
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      <div>
        <div className={styles.salesStatRow}>
          <span className={`${styles.salesLargeNumber} tuw-tabular-nums`}>{total}</span>
          <span className={styles.trendBadgeGreen}>
            <ArrowUp size={13} strokeWidth={2.5} />
            {delta.toFixed(1)}%
          </span>
          <span className={styles.trendSubtext}>{compareLabel}</span>
        </div>
      </div>

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
