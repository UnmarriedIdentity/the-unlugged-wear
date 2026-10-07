import React from 'react';
import Link from 'next/link';
import { DashboardCard } from './DashboardCard';
import { SeeAllLink } from './SeeAllLink';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import type { FulfillmentStatus, OrderItem } from '@/mocks/fixtures';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface RecentOrdersCardProps {
  orders: OrderItem[];
}

// Fulfillment status -> Figma badge treatment + demo label.
function statusBadge(status: FulfillmentStatus): { badgeClass: string; label: string } {
  if (status === 'shipped') return { badgeClass: styles.badgeShipped, label: 'Shipped' };
  if (status === 'delivered') return { badgeClass: styles.badgeDeliver, label: 'Delivered' };
  if (status === 'submission_failed') return { badgeClass: styles.badgePending, label: 'Failed' };
  if (status === 'printing') return { badgeClass: styles.badgeProcess, label: 'Printing' };
  return { badgeClass: styles.badgeProcess, label: 'Queued' };
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
                <TableCell className={styles.orderTimeCell} style={{ padding: '14px 14px' }}>{order.customerName}</TableCell>
                <TableCell className={`${styles.orderTotalCell} tuw-tabular-nums`} style={{ padding: '14px 14px' }}>₹{order.total.toFixed(2)}</TableCell>
                <TableCell className={styles.orderStatusCell} style={{ padding: '14px 14px' }}>
                  <span className={badge.badgeClass}>{badge.label}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DashboardCard>
  );
}
