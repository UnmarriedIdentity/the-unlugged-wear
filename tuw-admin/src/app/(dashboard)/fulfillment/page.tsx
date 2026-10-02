'use client';

import React from 'react';
import DashboardShell from '@/components/layout/DashboardShell';
import { ContentCard, StatCard, Badge, Button } from '@/components/ui';
import { PackageCheck, Truck, Clock, Filter } from 'lucide-react';

export default function FulfillmentPage() {
  return (
    <DashboardShell pageTitle="Fulfillment">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
            Order Fulfillment
          </h2>
          <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
            Manage warehouse queue, printing, packaging, and dispatch tracking.
          </p>
        </div>
        <Button variant="primary" size="md">
          <span>Batch Dispatch</span>
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <StatCard label="In Queue" value="14" subtitle="Awaiting print confirmation" trendType="neutral" />
        <StatCard label="Printing / Pack" value="8" subtitle="Active on floor" trendType="up" />
        <StatCard label="Ready for Courier" value="22" subtitle="Manifest created" trendType="up" />
        <StatCard label="Shipped Today" value="56" subtitle="On track" trendType="up" />
      </div>

      <ContentCard>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>
          Active Fulfillment Queue
        </h3>
        <p style={{ fontSize: 14, color: 'var(--tuw-text-secondary, #5D6772)' }}>
          Orders are automatically dispatched based on inventory allocation priority.
        </p>
      </ContentCard>
    </DashboardShell>
  );
}
