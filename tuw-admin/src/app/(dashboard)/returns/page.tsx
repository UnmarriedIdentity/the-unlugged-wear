'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { Undo2, Search, Filter, ArrowRight, PackageCheck, Truck } from 'lucide-react';

interface ReturnItem {
  id: string;
  orderId: string;
  customer: string;
  items: string;
  trackingNumber: string;
  carrier: string;
  stage: 'in_transit' | 'inspected' | 'restocked' | 'disputed';
  date: string;
}

const mockReturns: ReturnItem[] = [
  {
    id: 'RET-1092',
    orderId: '#ORD-8802',
    customer: 'Alex Rivera',
    items: 'Urbanist Heavyweight Tee (M) × 2',
    trackingNumber: 'TRK-99281726',
    carrier: 'DHL Express',
    stage: 'in_transit',
    date: 'Oct 01, 2026',
  },
  {
    id: 'RET-1091',
    orderId: '#ORD-8780',
    customer: 'Chloe Zhao',
    items: 'Signature Boxy Hoodie (L)',
    trackingNumber: 'TRK-99281512',
    carrier: 'FedEx Ground',
    stage: 'inspected',
    date: 'Sep 30, 2026',
  },
  {
    id: 'RET-1090',
    orderId: '#ORD-8745',
    customer: 'Liam O\'Connor',
    items: 'Relaxed Cargo Pant (32)',
    trackingNumber: 'TRK-99280911',
    carrier: 'UPS Standard',
    stage: 'restocked',
    date: 'Sep 29, 2026',
  },
  {
    id: 'RET-1089',
    orderId: '#ORD-8704',
    customer: 'Marcus Bennett',
    items: 'Core Crewneck Sweatshirt (XL)',
    trackingNumber: 'TRK-99279820',
    carrier: 'USPS Priority',
    stage: 'disputed',
    date: 'Sep 28, 2026',
  },
];

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReturns = mockReturns.filter(
    (item) =>
      item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Returns">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Returns & RMA
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Inspect reverse logistics, track incoming return parcels, and trigger warehouse restocking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="primary" size="md" icon={<Undo2 size={16} />}>
            Create RMA Label
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="In-Transit Returns" value="9" subtitle="En route to fulfillment center" trendType="neutral" />
        <StatCard label="Pending Inspection" value="4" subtitle="Arrived today" trendType="neutral" />
        <StatCard label="Restocked (30d)" value="41 units" trend="↑ 98% salvage rate" trendType="up" />
        <StatCard label="Dispute Rate" value="0.2%" subtitle="Below alert threshold" trendType="up" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by customer, return ID, tracking #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Stage
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Return ID</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Returned Items</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Carrier & Tracking</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
                    {ret.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {ret.orderId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {ret.customer}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {ret.items}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    <div>{ret.carrier}</div>
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--tuw-text-info, #175CD3)' }}>{ret.trackingNumber}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {ret.stage === 'in_transit' && <Badge variant="warning">In Transit</Badge>}
                    {ret.stage === 'inspected' && <Badge variant="info">Inspected</Badge>}
                    {ret.stage === 'restocked' && <Badge variant="success">Restocked</Badge>}
                    {ret.stage === 'disputed' && <Badge variant="error">Disputed</Badge>}
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
