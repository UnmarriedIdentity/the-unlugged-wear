'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { MetricCard, SalesTrendCard, ProductListCard, InventoryAlertsCard, RecentOrdersCard } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Calendar as DateRangeCalendar } from '@/components/calendar';
import type { DateRange } from '@/hooks/useCalendarRange';
// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
// Verbatim port of HomePage.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });


// Dashboard data (D1): live KPIs from demo store, static feeds via mock adapter.

export default function HomeView() {
  const {
    kpis,
    salesTrend,
    salesTotal,
    salesDelta,
    salesLegendPast,
    salesLegendCurrent,
    salesCompareLabel,
    inventoryAlerts,
    recentOrders,
    topProducts,
    timeRange,
    setTimeRange,
    productSort,
    setProductSort,
  } = useDashboardData();
  // Date-range popover state (label + open).
  const [rangeLabel, setRangeLabel] = useState('Today');
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <DashboardShell pageTitle="Dashboard" activeNav="home">

      {/* Welcome Header */}
      <div className={styles.welcomeRow}>
        <div className={styles.welcomeTextGroup}>
          <h2 className={styles.welcomeHeading}>Welcome back, Urvil!</h2>
          <p className={styles.welcomeSubtext}>Monday, 16 April 2026. Get weekend summary!</p>
        </div>

        <div className={styles.welcomeControls}>
          <div className={styles.onlineBadge}>
            <span className={styles.pulseDot} />
            <span>2 online customers</span>
          </div>

          <div className="relative">
            <button
              type="button"
              className={styles.dateFilterBtn}
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              aria-haspopup="dialog"
            >
              <Calendar size={18} />
              <span>{rangeLabel}</span>
            </button>
            {pickerOpen && (
              <>
                <div
                  aria-hidden="true"
                  onClick={() => setPickerOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 top-full z-50 mt-2">
                  <DateRangeCalendar
                    onApply={(range: DateRange, label: string) => {
                      setRangeLabel(label);
                      setPickerOpen(false);
                    }}
                    onClose={() => setPickerOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------
          4 METRIC KPI CARDS
          ---------------------------------------------------------------- */}
      <section className={styles.kpiGrid} aria-label="Key Performance Indicators">
        <MetricCard
          label="Revenue today"
          value={`₹${kpis.revenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          delta={`${kpis.revenueDelta.toFixed(1)}%`}
          sparkTone="up"
        />
        <MetricCard
          label="Orders today"
          value={kpis.ordersToday}
          tabular={false}
          delta={`${kpis.ordersDelta}%`}
          sparkTone="up"
        />
        <MetricCard
          label="Average order"
          value={`₹${kpis.averageOrder.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          delta={`${kpis.averageOrderDelta.toFixed(1)}%`}
          sparkTone="up"
        />
        <MetricCard
          label="Conversion rate"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          delta={`${Math.abs(kpis.conversionDelta).toFixed(1)}%`}
          deltaTone="down"
          sparkTone="down"
        />
      </section>

      {/* ----------------------------------------------------------------
          MIDDLE SECTION: SALES TREND & TOP PRODUCT
          ---------------------------------------------------------------- */}
      <section className={styles.middleGrid}>
        <SalesTrendCard
          points={salesTrend}
          total={salesTotal}
          delta={salesDelta}
          legendPast={salesLegendPast}
          legendCurrent={salesLegendCurrent}
          compareLabel={salesCompareLabel}
          timeRange={timeRange}
          onRangeChange={setTimeRange}
        />

        <ProductListCard products={topProducts} sort={productSort} onSortChange={setProductSort} />
      </section>

      {/* ----------------------------------------------------------------
          BOTTOM SECTION: INVENTORY ALERTS & RECENT ORDERS
          ---------------------------------------------------------------- */}
      <section className={styles.bottomGrid}>
        <InventoryAlertsCard alerts={inventoryAlerts} />
        <RecentOrdersCard orders={recentOrders} />
      </section>
    </DashboardShell>
  );
}
