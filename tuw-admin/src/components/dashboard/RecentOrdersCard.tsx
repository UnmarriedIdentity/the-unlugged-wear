import React from 'react';
import Link from 'next/link';
import { DashboardCard } from './DashboardCard';
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
        <Link href="/orders" className={styles.seeAllBtn} style={{ textDecoration: 'none' }}>
          See all
        </Link>
      }
    >
      <div className={styles.ordersTableWrapper}>
        <table className={styles.ordersTable}>
          <thead>
            <tr className={styles.ordersTableHeaderRow}>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const badge = statusBadge(order.fulfillmentStatus);
              return (
                <tr key={order.id} className={styles.orderDataRow}>
                  <td className={styles.orderIdCell}>
                    <Link href="/orders" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {order.id}
                    </Link>
                  </td>
                  <td className={styles.orderTimeCell}>{order.customerName}</td>
                  <td className={`${styles.orderTotalCell} tuw-tabular-nums`}>₹{order.total.toFixed(2)}</td>
                  <td className={styles.orderStatusCell}>
                    <span className={badge.badgeClass}>{badge.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
