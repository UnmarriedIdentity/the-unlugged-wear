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
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import EmptyState from '@/components/ui/EmptyState';
import { SALES_RANGES, formatINRWhole, type SalesTrendPoint } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

const SALES_Y_TICKS = ['₹10K', '₹8K', '₹6K', '₹4K', '₹2K', '₹0'];

// Fixed slot pool (B2, motion skill data-change rule): every feed pads to
// MAX_SLOTS index-keyed slots so range switches travel through the CSS
// height transition — including to/from zero — instead of remounting.
// Empty slots render zero bars, blank labels, and no tooltip.
const MAX_SLOTS = 7;

function padSlots(points: SalesTrendPoint[]): SalesTrendPoint[] {
  if (points.length >= MAX_SLOTS) return points.slice(0, MAX_SLOTS);
  const blanks: SalesTrendPoint[] = Array.from(
    { length: MAX_SLOTS - points.length },
    () => ({ day: '', lastWeek: 0, thisWeek: 0, lastVal: '', thisVal: '' }),
  );
  return [...points, ...blanks];
}

interface SalesTrendCardProps {
  points: SalesTrendPoint[];
  totalValue: number;
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
  totalValue,
  delta,
  legendPast,
  legendCurrent,
  compareLabel,
  timeRange,
  onRangeChange,
}: SalesTrendCardProps) {
  const slots = padSlots(points);
  const [badgeLanded, setBadgeLanded] = React.useState(false);
  const landTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (landTimer.current !== null) clearTimeout(landTimer.current);
    },
    [],
  );

  const handleLanded = () => {
    setBadgeLanded(true);
    if (landTimer.current !== null) clearTimeout(landTimer.current);
    landTimer.current = setTimeout(() => setBadgeLanded(false), 220);
  };
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
          <AnimatedNumber
            className={`${styles.salesLargeNumber} tuw-tabular-nums`}
            value={totalValue}
            format={formatINRWhole}
            upClassName={styles.salesTotalUp}
            downClassName={styles.salesTotalDown}
            landClassName={styles.numberLanded}
            onLanded={handleLanded}
          />
          <TrendBadge value={`${delta.toFixed(1)}%`} iconSize={13} iconStrokeWidth={2.5} landed={badgeLanded} />
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
        <ChartFrame ticks={SALES_Y_TICKS} labels={slots.map((item) => item.day)}>
          {slots.map((item, i) => {
            const isLive = item.lastWeek !== 0 || item.thisWeek !== 0;
            return (
              <BarGroup
                key={`slot-${i}`}
                pastHeight={barHeight(item.lastWeek, slots)}
                currentHeight={barHeight(item.thisWeek, slots)}
                active={isLive}
                tooltip={
                  !isLive ? null : (
                    <ChartTooltip
                      title={item.day}
                      rows={[
                        { series: 'current', label: legendCurrent, value: item.thisVal },
                        { series: 'past', label: legendPast, value: item.lastVal },
                      ]}
                    />
                  )
                }
              />
            );
          })}
        </ChartFrame>
      )}
    </DashboardCard>
  );
}
