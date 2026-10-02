'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Eye,
  CreditCard,
  Package,
  Layers,
  ChevronDown
} from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, sub- prefix).
// Verbatim port of SubPages.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });
import { StatCard, ContentCard, Button, Badge } from '@/components/ui';

export default function AnalyticsView() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardShell pageTitle="Analytics" activeNav="analytics">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Analytics & Insights</h2>
          <p className={styles.pageSubtitle}>
            Comprehensive overview of store sales, conversion funnels, and customer acquisition.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="md"
            icon={<Calendar size={16} />}
            onClick={() => setTimeRange(timeRange === '30d' ? '7d' : '30d')}
          >
            <span>{timeRange === '30d' ? 'Last 30 Days' : 'Last 7 Days'}</span>
            <ChevronDown size={14} style={{ marginLeft: 4 }} />
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Download size={16} />}
            onClick={() => alert('Exporting Analytics Report as PDF/CSV...')}
          >
            <span>Download Report</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics (Design System StatCards) */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Revenue"
          value="$184,920.00"
          trend="↑ +14.2% vs previous period"
          trendType="up"
        />
        <StatCard
          label="Total Orders"
          value="1,482"
          trend="↑ +8.6% vs previous period"
          trendType="up"
        />
        <StatCard
          label="Conversion Rate"
          value="3.24%"
          trend="↑ +0.32% vs benchmark"
          trendType="up"
        />
        <StatCard
          label="Average Order Value"
          value="$124.62"
          trend="↑ +$7.10 from last month"
          trendType="up"
        />
      </div>

      {/* Main Interactive Revenue Trend Chart Card */}
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#242424', margin: 0 }}>
              Sales & Revenue Performance
            </h3>
            <span style={{ fontSize: '13px', color: '#6C6C6C' }}>
              Daily gross sales and total orders processed
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: '#115D5D' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#115D5D' }} />
              Current Period
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: '#9A9A9A', marginLeft: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#E0E7E6' }} />
              Previous Period
            </span>
          </div>
        </div>

        {/* Pure SVG Revenue Trend Chart */}
        <div style={{ width: '100%', height: '220px', marginTop: 12, position: 'relative' }}>
          <svg
            viewBox="0 0 900 200"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#115D5D" stopOpacity="0.28" />
                <stop offset="85%" stopColor="#115D5D" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#115D5D" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="40" x2="900" y2="40" stroke="#F0F4F4" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="900" y2="90" stroke="#F0F4F4" strokeDasharray="4 4" />
            <line x1="0" y1="140" x2="900" y2="140" stroke="#F0F4F4" strokeDasharray="4 4" />
            <line x1="0" y1="190" x2="900" y2="190" stroke="#F0F4F4" />

            {/* Previous Period Ghost Curve */}
            <path
              d="M 0 160 Q 150 140 300 130 T 600 110 T 900 95"
              fill="none"
              stroke="#D2DCDA"
              strokeWidth="2"
              strokeDasharray="5 5"
            />

            {/* Current Period Area */}
            <path
              d="M 0 150 Q 100 120 200 135 T 400 80 T 600 90 T 800 45 L 900 35 L 900 190 L 0 190 Z"
              fill="url(#analyticsGrad)"
            />

            {/* Current Period Stroke */}
            <path
              d="M 0 150 Q 100 120 200 135 T 400 80 T 600 90 T 800 45 L 900 35"
              fill="none"
              stroke="#115D5D"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Active Data Key Points */}
            <circle cx="200" cy="135" r="4.5" fill="#FFFFFF" stroke="#115D5D" strokeWidth="2.5" />
            <circle cx="400" cy="80" r="4.5" fill="#FFFFFF" stroke="#115D5D" strokeWidth="2.5" />
            <circle cx="600" cy="90" r="4.5" fill="#FFFFFF" stroke="#115D5D" strokeWidth="2.5" />
            <circle cx="800" cy="45" r="5.5" fill="#115D5D" stroke="#FFFFFF" strokeWidth="2.5" />
            <circle cx="900" cy="35" r="4.5" fill="#FFFFFF" stroke="#115D5D" strokeWidth="2.5" />
          </svg>

          {/* X Axis labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#9A9A9A',
              fontWeight: 500,
              marginTop: 8,
              padding: '0 4px'
            }}
          >
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Grid: Revenue by Channel & Conversion Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', width: '100%' }}>
        {/* Sales by Channel Card */}
        <div className={styles.contentCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#242424', margin: 0 }}>
              Acquisition Channels
            </h3>
            <span style={{ fontSize: '13px', color: '#115D5D', fontWeight: 600 }}>By Revenue</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#242424' }}>Direct Storefront</span>
                <span style={{ fontWeight: 600, color: '#242424' }}>$112,400 (60.8%)</span>
              </div>
              <div style={{ height: '8px', background: '#E7EFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '60.8%', height: '100%', background: '#115D5D', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#242424' }}>Social Marketing (IG & TikTok)</span>
                <span style={{ fontWeight: 600, color: '#242424' }}>$44,200 (23.9%)</span>
              </div>
              <div style={{ height: '8px', background: '#E7EFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '23.9%', height: '100%', background: '#00CB75', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#242424' }}>Organic Search & SEO</span>
                <span style={{ fontWeight: 600, color: '#242424' }}>$28,320 (15.3%)</span>
              </div>
              <div style={{ height: '8px', background: '#E7EFEF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '15.3%', height: '100%', background: '#C6EAA0', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Funnel Card */}
        <div className={styles.contentCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#242424', margin: 0 }}>
              Conversion Funnel
            </h3>
            <span style={{ fontSize: '13px', color: '#009E5C', fontWeight: 600 }}>Healthy Flow</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAF9', borderRadius: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6C6C6C' }}>1. Storefront Visitors</span>
              <span style={{ fontWeight: 700, color: '#242424' }}>45,200</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAF9', borderRadius: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6C6C6C' }}>2. Product Views</span>
              <span style={{ fontWeight: 700, color: '#242424' }}>24,800 (54.8%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAF9', borderRadius: '10px', fontSize: '13px' }}>
              <span style={{ color: '#6C6C6C' }}>3. Add to Cart</span>
              <span style={{ fontWeight: 700, color: '#242424' }}>6,400 (14.1%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#EDF8E2', borderRadius: '10px', color: '#115D5D', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>4. Completed Checkout</span>
              <span style={{ fontWeight: 700 }}>1,482 (3.24%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#242424', margin: 0 }}>
            Top Grossing Products
          </h3>
          <span style={{ fontSize: '13px', color: '#6C6C6C' }}>
            Ranked by units sold & total revenue
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.customTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th>Product Name</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Unit Price</th>
                <th className={styles.alignRight}>Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.tableDataRow}>
                <td style={{ fontWeight: 600 }}>White Classic T-Shirt</td>
                <td>Apparel</td>
                <td>480</td>
                <td>$29.00</td>
                <td className={`${styles.alignRight}`} style={{ fontWeight: 700, color: '#115D5D' }}>$13,920.00</td>
              </tr>
              <tr className={styles.tableDataRow}>
                <td style={{ fontWeight: 600 }}>Floral Breeze Dress</td>
                <td>Dresses</td>
                <td>324</td>
                <td>$54.00</td>
                <td className={`${styles.alignRight}`} style={{ fontWeight: 700, color: '#115D5D' }}>$17,496.00</td>
              </tr>
              <tr className={styles.tableDataRow}>
                <td style={{ fontWeight: 600 }}>Casual Summer Sundress</td>
                <td>Summer Wear</td>
                <td>290</td>
                <td>$62.00</td>
                <td className={`${styles.alignRight}`} style={{ fontWeight: 700, color: '#115D5D' }}>$17,980.00</td>
              </tr>
              <tr className={styles.tableDataRow}>
                <td style={{ fontWeight: 600 }}>Unisex Minimal Hoodie</td>
                <td>Outerwear</td>
                <td>185</td>
                <td>$78.00</td>
                <td className={`${styles.alignRight}`} style={{ fontWeight: 700, color: '#115D5D' }}>$14,430.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
