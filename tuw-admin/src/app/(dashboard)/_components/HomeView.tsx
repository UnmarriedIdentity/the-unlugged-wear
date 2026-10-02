'use client';

import React, { useState } from 'react';
import { ArrowUp, Calendar, ChevronDown } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
// Verbatim port of HomePage.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });


// Chart Data matching Figma Frame 1:20300
const salesData = [
  { day: 'Mon', lastWeek: 38, thisWeek: 44, lastVal: '$2,800', thisVal: '$3,200' },
  { day: 'Tue', lastWeek: 49, thisWeek: 62, lastVal: '$4,000', thisVal: '$5,600' },
  { day: 'Wed', lastWeek: 82, thisWeek: 72, lastVal: '$6,800', thisVal: '$6,000' },
  { day: 'Thu', lastWeek: 48, thisWeek: 61, lastVal: '$4,000', thisVal: '$5,200' },
  { day: 'Fri', lastWeek: 87, thisWeek: 99, lastVal: '$7,200', thisVal: '$8,500' },
  { day: 'Sat', lastWeek: 67, thisWeek: 80, lastVal: '$5,400', thisVal: '$6,400' },
  { day: 'Sun', lastWeek: 62, thisWeek: 68, lastVal: '$5,000', thisVal: '$6,000' },
];

// Inventory Alerts Data
const inventoryAlerts = [
  {
    id: 1,
    severity: 'Critical',
    dotClass: styles.alertDotRed,
    textClass: styles.alertStatusCritical,
    segmentClass: styles.segmentFilledRed,
    filledSegments: 2,
    unitsLeft: '5 units left',
    itemName: 'Summer dress',
    velocity: 'Sells: 3 pcs/day',
  },
  {
    id: 2,
    severity: 'Low',
    dotClass: styles.alertDotOrange,
    textClass: styles.alertStatusLow,
    segmentClass: styles.segmentFilledOrange,
    filledSegments: 2,
    unitsLeft: '8 units left',
    itemName: 'Ankle boots',
    velocity: 'Sells: 2 pcs/day',
  },
  {
    id: 3,
    severity: 'Low',
    dotClass: styles.alertDotOrange,
    textClass: styles.alertStatusLow,
    segmentClass: styles.segmentFilledOrange,
    filledSegments: 2,
    unitsLeft: '10 units left',
    itemName: 'Floral dress',
    velocity: 'Sells: 4 pcs/day',
  },
];

// Recent Orders Data matching Figma Frame 1:20300
const recentOrders = [
  { id: '#1247', time: '2 min ago', total: '$24.50', status: 'Shipped', statusClass: styles.badgeShipped },
  { id: '#1246', time: '5 mins ago', total: '$18.00', status: 'Process', statusClass: styles.badgeProcess },
  { id: '#1245', time: '8 min ago', total: '$31.25', status: 'Deliver', statusClass: styles.badgeDeliver },
  { id: '#1244', time: '12 min ago', total: '$15.50', status: 'Shipped', statusClass: styles.badgeShipped },
  { id: '#1243', time: '15 min ago', total: '$28.00', status: 'Pending', statusClass: styles.badgePending },
  { id: '#1242', time: '19 min ago', total: '$13.00', status: 'Shipped', statusClass: styles.badgeShipped },
  { id: '#1241', time: '23 min ago', total: '$13.00', status: 'Process', statusClass: styles.badgeProcess },
];

export default function HomeView() {
  const [timeRange, setTimeRange] = useState('This week');
  const [productSort, setProductSort] = useState('By revenue');

  return (
    <DashboardShell pageTitle="Home" activeNav="home">
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

          <button type="button" className={styles.dateFilterBtn}>
            <Calendar size={18} />
            <span>Today</span>
          </button>
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
            <span className={styles.kpiValue}>$5,234</span>
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
              12.3%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 2: Orders Today */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Orders today</span>
          <div className={styles.kpiMiddleRow}>
            <span className={styles.kpiValue}>42</span>
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
              5%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 3: Average Order */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Average order</span>
          <div className={styles.kpiMiddleRow}>
            <span className={styles.kpiValue}>$124,62</span>
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
              7.1%
            </span>
            <span className={styles.trendVs}>vs yesterday</span>
          </div>
        </div>

        {/* KPI 4: Conversion Rate */}
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Conversion rate</span>
          <div className={styles.kpiMiddleRow}>
            <span className={styles.kpiValue}>$3,2%</span>
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
              0.3%
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
              <span className={styles.salesLargeNumber}>$39,190</span>
              <span className={styles.trendBadgeGreen}>
                <ArrowUp size={14} />
                8.4%
              </span>
            </div>
          </div>

          {/* Chart Plot Area */}
          <div className={styles.chartContainer}>
            {/* Y-Axis Labels */}
            <div className={styles.yAxisLabels}>
              <span>$10K</span>
              <span>$8K</span>
              <span>$6K</span>
              <span>$4K</span>
              <span>$2K</span>
              <span>$0</span>
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
                {salesData.map((item) => (
                  <div key={item.day} className={styles.barGroup}>
                    <div
                      className={`${styles.barColumn} ${styles.barColumnLastWeek}`}
                      style={{ height: `${item.lastWeek}%` }}
                    />
                    <div
                      className={`${styles.barColumn} ${styles.barColumnThisWeek}`}
                      style={{ height: `${item.thisWeek}%` }}
                    />
                    {/* Hover Tooltip */}
                    <div className={styles.barTooltip}>
                      <strong>{item.day}</strong>: Last week {item.lastVal} | This week {item.thisVal}
                    </div>
                  </div>
                ))}
              </div>

              {/* X-Axis Days */}
              <div className={styles.xAxisLabels}>
                {salesData.map((item) => (
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
            {/* Product 1: Summer Dress (Pure SVG Illustration) */}
            <div className={styles.productCardItem}>
              <div
                className={styles.productIllustrationWrapper}
                style={{ background: 'linear-gradient(135deg, #EBF4F8 0%, #D8EBF5 100%)' }}
              >
                <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 7C22 5.8 24 5.8 25 7" stroke="#7A93A2" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M19 8L16 17H32L29 8L24 13L19 8Z" fill="#3D7EAA" />
                  <path d="M19 8L24 13L29 8" stroke="#2B648C" strokeWidth="1.2" />
                  <rect x="15.5" y="17" width="17" height="3" rx="1.5" fill="#2B5B7D" />
                  <path d="M16 20L10 38C12 40 18 41 24 41C30 41 36 40 38 38L32 20H16Z" fill="#4E8CBA" />
                  <path d="M19 20L17 39.5" stroke="#3D75A0" strokeWidth="1.2" />
                  <path d="M24 20V41" stroke="#31678E" strokeWidth="1.2" />
                  <path d="M29 20L31 39.5" stroke="#3D75A0" strokeWidth="1.2" />
                  <path d="M14 29C18 31 30 31 34 29" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.35" />
                </svg>
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>Summer dress</span>
                <div className={styles.productStatsRow}>
                  <span className={styles.productPrice}>$2,340</span>
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

            {/* Product 2: Floral Dress (Pure SVG Illustration) */}
            <div className={styles.productCardItem}>
              <div
                className={styles.productIllustrationWrapper}
                style={{ background: 'linear-gradient(135deg, #FAF0EB 0%, #F5E2DA 100%)' }}
              >
                <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="8" x2="18" y2="15" stroke="#252525" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="30" y1="8" x2="30" y2="15" stroke="#252525" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M16 15C16 13 32 13 32 15L31 22H17L16 15Z" fill="#1E2022" />
                  <rect x="16.5" y="22" width="15" height="2.5" fill="#141517" />
                  <path d="M17 24.5L12 39C16 41 32 41 36 39L31 24.5H17Z" fill="#1E2022" />
                  <circle cx="20" cy="18" r="2.5" fill="#E8826F" />
                  <circle cx="20" cy="18" r="1" fill="#FFE8B2" />
                  <circle cx="27" cy="19" r="2.2" fill="#EAA3B3" />
                  <circle cx="27" cy="19" r="0.8" fill="#FFFFFF" />
                  <circle cx="24" cy="28" r="2.8" fill="#F8B195" />
                  <circle cx="24" cy="28" r="1.1" fill="#FFF1C5" />
                  <circle cx="17" cy="33" r="2.4" fill="#E8826F" />
                  <circle cx="17" cy="33" r="0.9" fill="#FFF1C5" />
                  <circle cx="31" cy="32" r="2.5" fill="#EAA3B3" />
                  <circle cx="31" cy="32" r="1" fill="#FFFFFF" />
                  <circle cx="24" cy="36" r="2.2" fill="#E8826F" />
                  <circle cx="24" cy="36" r="0.8" fill="#FFF1C5" />
                  <ellipse cx="22" cy="16.5" rx="1.2" ry="0.6" fill="#84A98C" transform="rotate(25 22 16.5)" />
                  <ellipse cx="26" cy="30" rx="1.2" ry="0.6" fill="#84A98C" transform="rotate(-30 26 30)" />
                  <ellipse cx="19" cy="35" rx="1.2" ry="0.6" fill="#84A98C" transform="rotate(45 19 35)" />
                </svg>
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>Floral dress</span>
                <div className={styles.productStatsRow}>
                  <span className={styles.productPrice}>$1,680</span>
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

            {/* Product 3: White T-Shirt (Pure SVG Illustration) */}
            <div className={styles.productCardItem}>
              <div
                className={styles.productIllustrationWrapper}
                style={{ background: 'linear-gradient(135deg, #F0F3F6 0%, #E3E7ED 100%)' }}
              >
                <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16 11L9 16L12 21L15 19V38H33V19L36 21L39 16L32 11C30 14 27 15 24 15C21 15 18 14 16 11Z"
                    fill="#FFFFFF"
                    stroke="#B8C4CE"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 11.5C19.5 13.5 21.6 14.5 24 14.5C26.4 14.5 28.5 13.5 30 11.5"
                    stroke="#A2B0BD"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path d="M12 21L15 19" stroke="#CCD5DE" strokeWidth="1" />
                  <path d="M36 21L33 19" stroke="#CCD5DE" strokeWidth="1" />
                  <rect x="21" y="20" width="6" height="3" rx="1" fill="#115D5D" opacity="0.85" />
                  <line x1="22" y1="25" x2="26" y2="25" stroke="#8E9DAE" strokeWidth="1" strokeLinecap="round" />
                  <line x1="16" y1="36" x2="32" y2="36" stroke="#CCD5DE" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.productInfo}>
                <span className={styles.productName}>White Tshirt</span>
                <div className={styles.productStatsRow}>
                  <span className={styles.productPrice}>$1,890</span>
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
            <button type="button" className={styles.seeAllBtn}>
              See all
            </button>
          </div>

          <div className={styles.alertsList}>
            {inventoryAlerts.map((alert) => (
              <div key={alert.id} className={styles.alertItem}>
                <div className={styles.alertTopRow}>
                  <div className={styles.alertStatusGroup}>
                    <span className={alert.dotClass} />
                    <span className={alert.textClass}>{alert.severity}</span>
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
                        idx <= alert.filledSegments ? alert.segmentClass : styles.segmentEmpty
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
            <button type="button" className={styles.seeAllBtn}>
              See all
            </button>
          </div>

          <div className={styles.ordersTableWrapper}>
            <table className={styles.ordersTable}>
              <thead>
                <tr className={styles.ordersTableHeaderRow}>
                  <th>Order</th>
                  <th>Time</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className={styles.orderDataRow}>
                    <td className={styles.orderIdCell}>{order.id}</td>
                    <td className={styles.orderTimeCell}>{order.time}</td>
                    <td className={styles.orderTotalCell}>{order.total}</td>
                    <td className={styles.orderStatusCell}>
                      <span className={order.statusClass}>{order.status}</span>
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
