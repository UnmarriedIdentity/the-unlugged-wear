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
import { StatCard, ContentCard, Button, Badge } from '@/components/ui';
import { useAdminState } from '@/mocks/state';

const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });

export default function AnalyticsView() {
  const { orders, products, customers, refunds } = useAdminState();
  const [timeRange, setTimeRange] = useState<'30d' | '7d'>('30d');

  // Compute live metrics from state
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalOrdersCount = orders.length;
  const aov = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const totalRefundsSum = refunds.reduce((sum, r) => sum + r.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Report Metric', 'Value', 'Time Scope'];
    const rows = [
      ['Total Gross Revenue', `₹${totalRevenue.toLocaleString()}`, timeRange],
      ['Total Processed Orders', String(totalOrdersCount), timeRange],
      ['Average Order Value (AOV)', `₹${Math.round(aov).toLocaleString()}`, timeRange],
      ['Total Refund Disbursements', `₹${totalRefundsSum.toLocaleString()}`, timeRange],
      ['Active Catalog Garments', String(products.length), 'Current'],
      ['Registered Client Base', String(customers.length), 'Current'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.map((x) => `"${x}"`).join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `tuw_analytics_report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell pageTitle="Analytics" activeNav="analytics">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Analytics & Operational Reports</h2>
          <p className={styles.pageSubtitle}>
            Comprehensive overview of store sales, conversion metrics, customer acquisition, and fulfillment SLA.
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
            onClick={handleExportCSV}
          >
            <span>Export CSV Report</span>
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          trend="Derived from paid order records"
          trendType="up"
        />
        <StatCard
          label="Total Orders"
          value={String(totalOrdersCount)}
          trend="Active store order volume"
          trendType="up"
        />
        <StatCard
          label="Average Order Value"
          value={`₹${Math.round(aov).toLocaleString()}`}
          trend="Per settled transaction"
          trendType="up"
        />
        <StatCard
          label="Refund Volume"
          value={`₹${totalRefundsSum.toLocaleString()}`}
          subtitle={`${refunds.length} processed adjustments`}
          trendType="neutral"
        />
      </div>

      {/* Main Interactive Revenue Trend Chart Card */}
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tuw-text-primary, #262626)', margin: 0 }}>
              Sales & Revenue Performance
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--tuw-text-secondary, #5D6772)' }}>
              Gross sales trends across {timeRange === '30d' ? 'the past 30 days' : 'the past 7 days'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: 'var(--tuw-action-primary, #7539FF)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--tuw-action-primary, #7539FF)' }} />
              Active Period
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: 'var(--tuw-border-control, #90979F)', marginLeft: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--tuw-border-subtle, #E2E4E6)' }} />
              Prior Period
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
              <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7539FF" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7539FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Horizontal Lines */}
            <line x1="0" y1="40" x2="900" y2="40" stroke="var(--tuw-border-subtle, #E2E4E6)" strokeDasharray="4 4" />
            <line x1="0" y1="90" x2="900" y2="90" stroke="var(--tuw-border-subtle, #E2E4E6)" strokeDasharray="4 4" />
            <line x1="0" y1="140" x2="900" y2="140" stroke="var(--tuw-border-subtle, #E2E4E6)" strokeDasharray="4 4" />

            {/* Prior Period Trend (Muted Gray) */}
            <path
              d="M0,150 Q150,130 300,120 T600,80 T900,110"
              fill="none"
              stroke="var(--tuw-border-control, #90979F)"
              strokeWidth="2"
              strokeDasharray="5 5"
            />

            {/* Area Fill */}
            <path
              d="M0,140 Q150,110 300,90 T600,45 T900,60 L900,200 L0,200 Z"
              fill="url(#analyticsGrad)"
            />

            {/* Main Trend Line */}
            <path
              d="M0,140 Q150,110 300,90 T600,45 T900,60"
              fill="none"
              stroke="#7539FF"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Data Point Marker */}
            <circle cx="600" cy="45" r="5" fill="#7539FF" stroke="#FFFFFF" strokeWidth="2.5" />
          </svg>
        </div>

        {/* X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '12px', marginTop: '8px' }}>
          <span>Wk 1</span>
          <span>Wk 2</span>
          <span>Wk 3</span>
          <span>Wk 4</span>
        </div>
      </div>

      {/* Product Merchandising Breakdown */}
      <ContentCard>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', marginBottom: 12 }}>
          Product Merchandising Sales Summary
        </h3>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Unit Price</th>
                <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Units Sold</th>
                <th style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase', textAlign: 'right' }}>Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 6).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {p.category}
                  </td>
                  <td className="tuw-tabular-nums" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    ₹{p.price.toLocaleString()}
                  </td>
                  <td className="tuw-tabular-nums" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--tuw-text-primary, #262626)' }}>
                    {p.soldCount}
                  </td>
                  <td className="tuw-tabular-nums" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)', textAlign: 'right' }}>
                    ₹{(p.price * p.soldCount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
