'use client';

import React from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { MetricCard, SalesTrendCard, ProductListCard, InventoryAlertsCard, RecentOrdersCard, DashboardHeader } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
// Verbatim port of HomePage.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });


// Dashboard data (D1): live KPIs from demo store, static feeds via mock adapter.

export default function HomeView() {
  const {
    kpis,
    salesTrend,
    salesTotalValue,
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

  return (
    <DashboardShell pageTitle="Dashboard" activeNav="home">

      <DashboardHeader
        title="Welcome back, Urvil!"
        subtitle="Monday, 16 April 2026. Get weekend summary!"
      />

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
          totalValue={salesTotalValue}
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
