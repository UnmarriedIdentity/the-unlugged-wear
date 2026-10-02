'use client';

import React from 'react';
import { UserPlus, Download } from 'lucide-react';
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

const customersList = [
  {
    id: 1,
    name: 'Sarah Michelle',
    email: 'sarah.michelle@example.com',
    orders: 14,
    totalSpent: '$1,840.50',
    status: 'VIP Customer',
    badgeVariant: 'success' as const,
    color: '#7539FF',
  },
  {
    id: 2,
    name: 'Jessica Smith',
    email: 'jessichasmith94@gmail.com',
    orders: 8,
    totalSpent: '$920.00',
    status: 'Active',
    badgeVariant: 'info' as const,
    color: '#175CD3',
  },
  {
    id: 3,
    name: 'Michael Chang',
    email: 'm.chang@outlook.com',
    orders: 5,
    totalSpent: '$640.20',
    status: 'Active',
    badgeVariant: 'info' as const,
    color: '#187343',
  },
  {
    id: 4,
    name: 'Elena Rostova',
    email: 'elena.rostova@design.co',
    orders: 19,
    totalSpent: '$2,780.00',
    status: 'VIP Customer',
    badgeVariant: 'success' as const,
    color: '#6025DB',
  },
  {
    id: 5,
    name: 'David Kim',
    email: 'david.kim@techcorp.io',
    orders: 2,
    totalSpent: '$180.00',
    status: 'New',
    badgeVariant: 'warning' as const,
    color: '#856300',
  },
  {
    id: 6,
    name: 'Amara Okafor',
    email: 'amara.okafor@gmail.com',
    orders: 11,
    totalSpent: '$1,430.80',
    status: 'Active',
    badgeVariant: 'info' as const,
    color: '#009E5C',
  },
];

export default function CustomersView() {
  return (
    <DashboardShell pageTitle="Customers" activeNav="customers">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Customers Directory</h2>
          <p className={styles.pageSubtitle}>View customer profiles, lifetime value, and order history.</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="md"
            icon={<Download size={16} />}
            onClick={() => alert('Exporting Customers Directory...')}
          >
            <span>Export</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus size={16} />}
            onClick={() => alert('New Customer Registration Modal')}
          >
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Customers"
          value="2,840"
          trend="↑ 148 new this month"
          trendType="up"
        />
        <StatCard
          label="Active Now"
          value="2 online"
          trend="Browsing storefront"
          trendType="neutral"
        />
        <StatCard
          label="Repeat Rate"
          value="46.8%"
          trend="↑ 3.2% vs industry avg"
          trendType="up"
        />
        <StatCard
          label="Average LTV"
          value="$428.50"
          trend="↑ 7.1% increase"
          trendType="up"
        />
      </div>

      {/* Main Customers Table */}
      <ContentCard>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersList.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      {c.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                  </div>
                </TableCell>
                <TableCell style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{c.email}</TableCell>
                <TableCell>{c.orders} orders</TableCell>
                <TableCell style={{ fontWeight: 600 }} className="tabular-nums">
                  {c.totalSpent}
                </TableCell>
                <TableCell>
                  <Badge variant={c.badgeVariant}>{c.status}</Badge>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <Button variant="secondary" size="sm" onClick={() => alert(`View Profile: ${c.name}`)}>
                    View Profile
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ContentCard>
    </DashboardShell>
  );
}
