'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, Calendar, ChevronDown } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
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
        {/* KPI 1: Revenue Today */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Revenue today</span>
          <div className={styles.kpiMiddleRow}>
            <span className={`${styles.kpiValue} tuw-tabular-nums`}>
              ₹{kpis.revenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <svg className={styles.kpiSparkline} viewBox="0 0 90 40" fill="none">
              <defs>
                <linearGradient id="sparkGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C6EAA0" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#C6EAA0" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2 L 90 40 L 0 40 Z"
                fill="url(#sparkGreenGrad)"
              />
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2"
                stroke="#00CB75"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.kpiBottomRow}>
            <span className={styles.trendBadgeGreen}>
              <ArrowUp size={14} />
              {kpis.revenueDelta.toFixed(1)}%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 2: Orders Today */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Orders today</span>
          <div className={styles.kpiMiddleRow}>
            <span className={styles.kpiValue}>{kpis.ordersToday}</span>
            <svg className={styles.kpiSparkline} viewBox="0 0 90 40" fill="none">
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2 L 90 40 L 0 40 Z"
                fill="url(#sparkGreenGrad)"
              />
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2"
                stroke="#00CB75"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.kpiBottomRow}>
            <span className={styles.trendBadgeGreen}>
              <ArrowUp size={14} />
              {kpis.ordersDelta}%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 3: Average Order */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Average order</span>
          <div className={styles.kpiMiddleRow}>
            <span className={`${styles.kpiValue} tuw-tabular-nums`}>
              ₹{kpis.averageOrder.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <svg className={styles.kpiSparkline} viewBox="0 0 90 40" fill="none">
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2 L 90 40 L 0 40 Z"
                fill="url(#sparkGreenGrad)"
              />
              <path
                d="M 0 26 C 12 26, 18 10, 28 16 C 38 22, 44 26, 52 14 C 60 4, 68 8, 76 2 C 82 -2, 86 4, 90 2"
                stroke="#00CB75"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.kpiBottomRow}>
            <span className={styles.trendBadgeGreen}>
              <ArrowUp size={14} />
              {kpis.averageOrderDelta.toFixed(1)}%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 4: Conversion Rate */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Conversion rate</span>
          <div className={styles.kpiMiddleRow}>
            <span className={`${styles.kpiValue} tuw-tabular-nums`}>{kpis.conversionRate.toFixed(1)}%</span>
            <svg className={styles.kpiSparkline} viewBox="0 0 90 40" fill="none">
              <defs>
                <linearGradient id="sparkRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E94845" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#E94845" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 10 C 12 10, 16 2, 24 4 C 32 6, 38 18, 48 14 C 58 10, 64 22, 74 18 C 80 15, 84 22, 90 20 L 90 40 L 0 40 Z"
                fill="url(#sparkRedGrad)"
              />
              <path
                d="M 0 10 C 12 10, 16 2, 24 4 C 32 6, 38 18, 48 14 C 58 10, 64 22, 74 18 C 80 15, 84 22, 90 20"
                stroke="#E94845"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.kpiBottomRow}>
            <span className={styles.trendBadgeRed}>
              <ArrowUp size={14} />
              {Math.abs(kpis.conversionDelta).toFixed(1)}%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>
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
