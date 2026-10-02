'use client';

import React, { useState } from 'react';
import { Download, Filter, Plus } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, sub- prefix).
// Verbatim port of SubPages.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });
import {
  StatCard,
  ContentCard,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';

type OrderStatus = 'Shipped' | 'Process' | 'Deliver' | 'Pending';

const ordersList: {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: OrderStatus;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger';
}[] = [
  { id: '#1247', customer: 'Sophia Anderson', date: '16 Apr 2026, 14:32', items: 3, total: '$148.50', status: 'Shipped', badgeVariant: 'success' },
  { id: '#1246', customer: 'Liam Miller', date: '16 Apr 2026, 14:15', items: 1, total: '$18.00', status: 'Process', badgeVariant: 'warning' },
  { id: '#1245', customer: 'Emma Watson', date: '16 Apr 2026, 13:48', items: 2, total: '$31.25', status: 'Deliver', badgeVariant: 'info' },
  { id: '#1244', customer: 'Oliver Davis', date: '16 Apr 2026, 13:12', items: 1, total: '$15.50', status: 'Shipped', badgeVariant: 'success' },
  { id: '#1243', customer: 'Ava Wilson', date: '16 Apr 2026, 12:55', items: 2, total: '$28.00', status: 'Pending', badgeVariant: 'danger' },
  { id: '#1242', customer: 'Lucas Taylor', date: '16 Apr 2026, 12:20', items: 1, total: '$13.00', status: 'Shipped', badgeVariant: 'success' },
  { id: '#1241', customer: 'Mia Brown', date: '16 Apr 2026, 11:45', items: 1, total: '$13.00', status: 'Process', badgeVariant: 'warning' },
  { id: '#1240', customer: 'Noah Johnson', date: '16 Apr 2026, 11:10', items: 4, total: '$240.00', status: 'Shipped', badgeVariant: 'success' },
  { id: '#1239', customer: 'Isabella Garcia', date: '16 Apr 2026, 10:35', items: 2, total: '$95.50', status: 'Deliver', badgeVariant: 'info' },
  { id: '#1238', customer: 'Ethan Martinez', date: '16 Apr 2026, 09:50', items: 1, total: '$42.00', status: 'Shipped', badgeVariant: 'success' },
];

export default function OrdersView() {
  const [activeTab, setActiveTab] = useState('All');

  const filteredOrders =
    activeTab === 'All'
      ? ordersList
      : ordersList.filter((o) => o.status === activeTab);

  return (
    <DashboardShell pageTitle="Orders" activeNav="orders">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Order Management</h2>
          <p className={styles.pageSubtitle}>Monitor, inspect, and fulfill store orders in real-time.</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={16} />}
            onClick={() => alert('Exporting Orders CSV...')}
          >
            <span>Export CSV</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => alert('New Order Creation')}
          >
            <span>Create Order</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Orders"
          value="1,428"
          trend="↑ 8.2% vs last month"
          trendType="up"
        />
        <StatCard
          label="Processing"
          value="18"
          trend="Requires fulfillment"
          trendType="neutral"
        />
        <StatCard
          label="Delivered Today"
          value="42"
          trend="↑ 12.3% on-time rate"
          trendType="up"
        />
        <StatCard
          label="Gross Volume"
          value="$39,190"
          trend="↑ 8.4% this week"
          trendType="up"
        />
      </div>

      {/* Main Table Card */}
      <ContentCard>
        <div className={styles.filterBar}>
          <ul className={styles.tabList}>
            {['All', 'Process', 'Shipped', 'Deliver', 'Pending'].map((tab) => (
              <li
                key={tab}
                className={`${styles.tabItem} ${activeTab === tab ? styles.tabItemActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'All' ? 'All Orders' : tab}
              </li>
            ))}
          </ul>

          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            <span>Filter</span>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell style={{ fontWeight: 600 }}>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{order.date}</TableCell>
                <TableCell>{order.items} pcs</TableCell>
                <TableCell style={{ fontWeight: 600 }} className="tabular-nums">
                  {order.total}
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <Badge variant={order.badgeVariant}>{order.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ContentCard>
    </DashboardShell>
  );
}
