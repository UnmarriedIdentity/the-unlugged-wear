'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Calendar, ChevronDown } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
import { MetricCard } from '@/components/dashboard';
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
    inventoryAlerts,
    recentOrders,
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
        {/* Sales Trend Chart Card */}
        <div className={styles.salesTrendCard}>
          <div>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitle}>Sales trend</h3>
              <div className={styles.salesHeaderRight}>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDotLastWeek} />
                    Last week
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDotThisWeek} />
                    This week
                  </span>
                </div>

                <button type="button" className={styles.filterSelectBtn}>
                  <span>{timeRange}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className={styles.salesStatRow}>
              <span className={`${styles.salesLargeNumber} tuw-tabular-nums`}>{salesTotal}</span>
              <span className={styles.trendBadgeGreen}>
                <ArrowUp size={13} strokeWidth={2.5} />
                {salesDelta.toFixed(1)}%
              </span>
              <span className={styles.trendSubtext}>vs last week</span>
            </div>
          </div>

          {/* Chart Plot Area */}
          <div className={styles.chartContainer}>
            {/* Y-Axis Labels */}
            <div className={`${styles.yAxisLabels} tuw-tabular-nums`}>
              <span>₹10K</span>
              <span>₹8K</span>
              <span>₹6K</span>
              <span>₹4K</span>
              <span>₹2K</span>
              <span>₹0</span>
            </div>

            {/* Plot Area with Grid Lines and Bars */}
            <div className={styles.chartPlotArea}>
              <div className={styles.gridLinesWrapper}>
                <div className={styles.gridLine} />
                <div className={styles.gridLine} />
                <div className={styles.gridLine} />
                <div className={styles.gridLine} />
                <div className={styles.gridLine} />
                <div className={styles.gridLine} />
              </div>

              {/* Dual Bars */}
              <div className={styles.barsArea}>
                {salesTrend.map((item) => (
                  <div key={item.day} className={styles.barGroup}>
                    <div
                      className={`${styles.barColumn} ${styles.barColumnLastWeek}`}
                      style={{ height: `${item.lastWeek}%` }}
                    />
                    <div
                      className={`${styles.barColumn} ${styles.barColumnThisWeek}`}
                      style={{ height: `${item.thisWeek}%` }}
                    />
                    {/* Rich Floating Tooltip */}
                    <div className={styles.barTooltip}>
                      <span className={styles.tooltipDay}>{item.day}</span>
                      <div className={styles.tooltipRow}>
                        <span className={styles.tooltipDotThisWeek} />
                        <span className={styles.tooltipLabel}>This week:</span>
                        <strong className="tuw-tabular-nums">{item.thisVal}</strong>
                      </div>
                      <div className={styles.tooltipRow}>
                        <span className={styles.tooltipDotLastWeek} />
                        <span className={styles.tooltipLabel}>Last week:</span>
                        <strong className="tuw-tabular-nums">{item.lastVal}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* X-Axis Days */}
              <div className={styles.xAxisLabels}>
                {salesTrend.map((item) => (
                  <span key={item.day} className={styles.xAxisDay}>
                    {item.day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Product Card (100% Pure Code Vector Illustrations) */}
        <div className={styles.topProductCard}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitle}>Top product</h3>
            <button type="button" className={styles.filterSelectBtn}>
              <span>{productSort}</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className={styles.productList}>
            {/* Product 1: Classic Boyfriend Poplin Shirt */}
            <div className={styles.productCardItem}>
              <div className={styles.productIllustrationWrapper} style={{ position: 'relative' }}>
                <Image
                  src="/products/1.jpeg"
                  alt="Boyfriend Poplin Shirt"
                  fill
                  sizes="72px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>Boyfriend Poplin Shirt</span>
                <div className={styles.productStatsRow}>
                  <span className={`${styles.productPrice} tuw-tabular-nums`}>₹3,490</span>
                  <span className={styles.statBullet}>•</span>
                  <span className={styles.productSoldGreen}>492</span>
                  <span className={styles.productSoldGray}>/500 Sold</span>
                </div>
                <span className={styles.productStock}>Stock: 8 units</span>
                <div className={styles.productProgressContainer}>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: '92%' }} />
                  </div>
                  <span className={styles.progressPercentText}>92%</span>
                </div>
              </div>
            </div>

            {/* Product 2: Tailored Blazer Suit */}
            <div className={styles.productCardItem}>
              <div className={styles.productIllustrationWrapper} style={{ position: 'relative' }}>
                <Image
                  src="/products/2.jpeg"
                  alt="Tailored Blazer Suit"
                  fill
                  sizes="72px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>Tailored Blazer Suit</span>
                <div className={styles.productStatsRow}>
                  <span className={`${styles.productPrice} tuw-tabular-nums`}>₹6,890</span>
                  <span className={styles.statBullet}>•</span>
                  <span className={styles.productSoldGreen}>369</span>
                  <span className={styles.productSoldGray}>/450 Sold</span>
                </div>
                <span className={styles.productStock}>Stock: 34 units</span>
                <div className={styles.productProgressContainer}>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: '82%' }} />
                  </div>
                  <span className={styles.progressPercentText}>82%</span>
                </div>
              </div>
            </div>

            {/* Product 3: Belted Safari Ensemble */}
            <div className={styles.productCardItem}>
              <div className={styles.productIllustrationWrapper} style={{ position: 'relative' }}>
                <Image
                  src="/products/3.jpeg"
                  alt="Belted Safari Ensemble"
                  fill
                  sizes="72px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>Belted Safari Ensemble</span>
                <div className={styles.productStatsRow}>
                  <span className={`${styles.productPrice} tuw-tabular-nums`}>₹5,490</span>
                  <span className={styles.statBullet}>•</span>
                  <span className={styles.productSoldGreen}>592</span>
                  <span className={styles.productSoldGray}>/800 Sold</span>
                </div>
                <span className={styles.productStock}>Stock: 26 units</span>
                <div className={styles.productProgressContainer}>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: '74%' }} />
                  </div>
                  <span className={styles.progressPercentText}>74%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------
          BOTTOM SECTION: INVENTORY ALERTS & RECENT ORDERS
          ---------------------------------------------------------------- */}
      <section className={styles.bottomGrid}>
        {/* Inventory Alerts Card */}
        <div className={styles.inventoryCard}>
          <div className={styles.cardHeaderRow}>
            <div>
              <h3 className={styles.cardTitle}>Inventory alerts</h3>
              <p className={styles.subHeading}>3 items need attention</p>
            </div>
            <Link href="/products" className={styles.seeAllBtn} style={{ textDecoration: 'none' }}>
              See all
            </Link>
          </div>

          <div className={styles.alertsList}>
            {inventoryAlerts.map((alert) => (
              <div key={alert.id} className={styles.alertItem}>
                <div className={styles.alertTopRow}>
                  <div className={styles.alertStatusGroup}>
                    <span className={alert.severity === 'Critical' ? styles.alertDotRed : styles.alertDotOrange} />
                    <span className={alert.severity === 'Critical' ? styles.alertStatusCritical : styles.alertStatusLow}>{alert.severity}</span>
                  </div>
                  <span className={styles.alertUnitsLeft}>{alert.unitsLeft}</span>
                </div>

                <div className={styles.alertMiddleRow}>
                  <span className={styles.alertItemName}>{alert.itemName}</span>
                  <span className={styles.alertVelocity}>{alert.velocity}</span>
                </div>

                {/* 5 Segments Bar */}
                <div className={styles.segmentedBar}>
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className={`${styles.barSegment} ${
                        idx <= alert.filledSegments
                          ? alert.severity === 'Critical'
                            ? styles.segmentFilledRed
                            : styles.segmentFilledOrange
                          : styles.segmentEmpty
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className={styles.recentOrdersCard}>
          <div className={styles.cardHeaderRow}>
            <h3 className={styles.cardTitle}>Recent orders</h3>
            <Link href="/orders" className={styles.seeAllBtn} style={{ textDecoration: 'none' }}>
              See all
            </Link>
          </div>

          <div className={styles.ordersTableWrapper}>
            <table className={styles.ordersTable}>
              <thead>
                <tr className={styles.ordersTableHeaderRow}>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className={styles.orderDataRow}>
                    <td className={styles.orderIdCell}>
                      <Link href="/orders" style={{ color: 'inherit', textDecoration: 'none' }}>
                        {order.id}
                      </Link>
                    </td>
                    <td className={styles.orderTimeCell}>{order.customerName}</td>
                    <td className={`${styles.orderTotalCell} tuw-tabular-nums`}>₹{order.total.toFixed(2)}</td>
                    <td className={styles.orderStatusCell}>
                      <span className={styles.badgeShipped}>{order.fulfillmentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
