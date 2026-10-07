import React from 'react';
import Link from 'next/link';
import { DashboardCard } from './DashboardCard';
import { SeeAllLink } from './SeeAllLink';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import type { FulfillmentStatus, OrderItem } from '@/mocks/fixtures';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

// Figma 26px status pill: ui Badge carries the token treatment; only the
// dashboard-specific metrics ride along (no new size variant introduced).
const STATUS_BADGE_STYLE: React.CSSProperties = {
  height: '26px',
  padding: '0 12px',
  fontSize: '12px',
};

interface RecentOrdersCardProps {
  orders: OrderItem[];
}

// Fulfillment status -> ui Badge variant + demo label.
function statusBadge(status: FulfillmentStatus): { variant: 'success' | 'info' | 'warning' | 'danger'; label: string } {
  if (status === 'shipped') return { variant: 'success', label: 'Shipped' };
  if (status === 'delivered') return { variant: 'info', label: 'Delivered' };
  if (status === 'submission_failed') return { variant: 'danger', label: 'Failed' };
  if (status === 'printing') return { variant: 'warning', label: 'Printing' };
  return { variant: 'warning', label: 'Queued' };
}

export function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  return (
    <DashboardCard
      variant="orders"
      title="Recent orders"
      action={
        <SeeAllLink href="/orders" />
      }
    >
      <Table style={{ marginTop: '16px', minWidth: '600px' }}>
        <TableHeader>
          <TableRow hoverable={false}>
            <TableHead style={{ padding: '12px 14px' }}>Order</TableHead>
            <TableHead style={{ padding: '12px 14px' }}>Customer</TableHead>
            <TableHead style={{ padding: '12px 14px' }}>Total</TableHead>
            <TableHead style={{ padding: '12px 14px', textAlign: 'right' }}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => {
            const badge = statusBadge(order.fulfillmentStatus);
            const last = i === orders.length - 1;
            return (
              <TableRow
                key={order.id}
                className={styles.orderDataRow}
                style={last ? { borderBottom: 'none' } : {}}
              >
                <TableCell className={styles.orderIdCell} style={{ padding: '14px 14px' }}>
                  <Link href="/orders" style={{ color: 'inherit', textDecoration: 'none' }}>
                    {order.id}
                  </Link>
                </TableCell>
                <TableCell style={{ padding: '14px 14px', color: 'var(--tuw-text-secondary, #5D6772)' }}>{order.customerName}</TableCell>
                <TableCell className="tuw-tabular-nums" style={{ padding: '14px 14px', fontWeight: 600 }}>₹{order.total.toFixed(2)}</TableCell>
                <TableCell style={{ padding: '14px 14px', textAlign: 'right' }}>
                  <Badge variant={badge.variant} style={STATUS_BADGE_STYLE}>{badge.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DashboardCard>
  );
}
