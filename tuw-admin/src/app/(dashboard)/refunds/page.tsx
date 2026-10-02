'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { RotateCcw, Search, Filter, Download, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface RefundItem {
  id: string;
  orderId: string;
  customer: string;
  reason: string;
  amount: string;
  method: string;
  date: string;
  status: 'completed' | 'processing' | 'rejected';
}

const mockRefunds: RefundItem[] = [
  {
    id: 'REF-2041',
    orderId: '#ORD-8821',
    customer: 'Sarah Jenkins',
    reason: 'Size exchange not available',
    amount: '$128.00',
    method: 'Original Payment (Visa)',
    date: 'Oct 01, 2026',
    status: 'completed',
  },
  {
    id: 'REF-2040',
    orderId: '#ORD-8794',
    customer: 'Michael Chang',
    reason: 'Defective stitching on collar',
    amount: '$84.50',
    method: 'Store Credit',
    date: 'Sep 30, 2026',
    status: 'processing',
  },
  {
    id: 'REF-2039',
    orderId: '#ORD-8762',
    customer: 'Emma Watson',
    reason: 'Color differs from photography',
    amount: '$210.00',
    method: 'Original Payment (Mastercard)',
    date: 'Sep 29, 2026',
    status: 'completed',
  },
  {
    id: 'REF-2038',
    orderId: '#ORD-8711',
    customer: 'David Kim',
    reason: 'Package arrived damaged',
    amount: '$65.00',
    method: 'Original Payment (Apple Pay)',
    date: 'Sep 28, 2026',
    status: 'rejected',
  },
];

export default function RefundsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRefunds = mockRefunds.filter(
    (item) =>
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Refunds">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Refund Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Process customer refunds, gateway disbursements, and store credit issuances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" size="md" icon={<Download size={16} />}>
            Export Log
          </Button>
          <Button variant="primary" size="md" icon={<RotateCcw size={16} />}>
            Issue Refund
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Total Refunded (30d)" value="$2,480.00" trend="↓ 14% vs last month" trendType="up" />
        <StatCard label="Pending Approval" value="3" subtitle="Requiring manager signoff" trendType="neutral" />
        <StatCard label="Avg. Resolution Time" value="1.4 days" trend="Within SLA target" trendType="up" />
        <StatCard label="Refund Rate" value="1.8%" subtitle="Benchmark < 2.5%" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by customer, refund ID, order #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Status
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Refund ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Reason</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Method</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {refund.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {refund.orderId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {refund.customer}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {refund.reason}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {refund.amount}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {refund.method}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {refund.status === 'completed' && <Badge variant="success">Completed</Badge>}
                    {refund.status === 'processing' && <Badge variant="warning">Processing</Badge>}
                    {refund.status === 'rejected' && <Badge variant="error">Rejected</Badge>}
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
