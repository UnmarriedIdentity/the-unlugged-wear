'use client';

import React, { useState } from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button, Input } from '@/components/ui';
import { Truck, Search, Filter, Download, ExternalLink, Calendar } from 'lucide-react';

interface ShipmentItem {
  trackingId: string;
  orderId: string;
  carrier: string;
  destination: string;
  pieces: number;
  dispatchDate: string;
  estimatedDelivery: string;
  status: 'delivered' | 'in_transit' | 'out_for_delivery' | 'exception';
}

const mockShipments: ShipmentItem[] = [
  {
    trackingId: 'DHL-489102834',
    orderId: '#ORD-8819',
    carrier: 'DHL Express Worldwide',
    destination: 'Brooklyn, NY, USA',
    pieces: 2,
    dispatchDate: 'Oct 01, 2026',
    estimatedDelivery: 'Oct 03, 2026',
    status: 'in_transit',
  },
  {
    trackingId: 'FDX-771209381',
    orderId: '#ORD-8815',
    carrier: 'FedEx Priority',
    destination: 'London, UK',
    pieces: 1,
    dispatchDate: 'Sep 30, 2026',
    estimatedDelivery: 'Oct 01, 2026',
    status: 'out_for_delivery',
  },
  {
    trackingId: 'UPS-102938472',
    orderId: '#ORD-8810',
    carrier: 'UPS Ground',
    destination: 'Toronto, ON, Canada',
    pieces: 3,
    dispatchDate: 'Sep 29, 2026',
    estimatedDelivery: 'Sep 30, 2026',
    status: 'delivered',
  },
  {
    trackingId: 'DHL-489101192',
    orderId: '#ORD-8798',
    carrier: 'DHL Express Worldwide',
    destination: 'Berlin, Germany',
    pieces: 1,
    dispatchDate: 'Sep 28, 2026',
    estimatedDelivery: 'Sep 30, 2026',
    status: 'exception',
  },
];

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredShipments = mockShipments.filter(
    (item) =>
      item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell pageTitle="Shipments">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Carrier Shipments
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Real-time multi-carrier transit metrics, dispatch manifests, and customs clearances.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="secondary" size="md" icon={<Download size={16} />}>
            Export Manifest
          </Button>
          <Button variant="primary" size="md" icon={<Truck size={16} />}>
            Create Shipment
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="Dispatched (24h)" value="68 parcels" trend="↑ 18% vs yesterday" trendType="up" />
        <StatCard label="Out for Delivery" value="19" subtitle="Arriving by 8:00 PM" trendType="neutral" />
        <StatCard label="On-Time Delivery" value="98.6%" trend="Within target SLA" trendType="up" />
        <StatCard label="Customs Exceptions" value="1" subtitle="Requires documentation" trendType="down" />
      </div>

      <ContentCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div style={{ maxWidth: 360, width: '100%' }}>
            <Input
              placeholder="Search by order #, tracking ID, destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefixIcon={<Search size={16} />}
            />
          </div>
          <Button variant="secondary" size="sm" icon={<Filter size={14} />}>
            Filter Carrier
          </Button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Tracking #</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Order</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Carrier</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Destination</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Items</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Est. Delivery</th>
                <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--tuw-text-secondary, #5D6772)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment.trackingId} style={{ borderBottom: '1px solid var(--tuw-border-subtle, #E2E4E6)' }}>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--tuw-text-info, #175CD3)' }}>
                    {shipment.trackingId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-action-primary, #7539FF)', fontWeight: 500 }}>
                    {shipment.orderId}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--tuw-text-primary, #262626)' }}>
                    {shipment.carrier}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {shipment.destination}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {shipment.pieces} pkgs
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--tuw-text-secondary, #5D6772)' }}>
                    {shipment.estimatedDelivery}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {shipment.status === 'delivered' && <Badge variant="success">Delivered</Badge>}
                    {shipment.status === 'in_transit' && <Badge variant="info">In Transit</Badge>}
                    {shipment.status === 'out_for_delivery' && <Badge variant="warning">Out for Delivery</Badge>}
                    {shipment.status === 'exception' && <Badge variant="error">Exception</Badge>}
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
