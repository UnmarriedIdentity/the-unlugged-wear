import React from 'react';
import { DashboardCard } from './DashboardCard';
import { SeeAllLink } from './SeeAllLink';
import { SegmentedBar } from './SegmentedBar';
import type { InventoryAlert } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface InventoryAlertsCardProps {
  alerts: InventoryAlert[];
}

export function InventoryAlertsCard({ alerts }: InventoryAlertsCardProps) {
  return (
    <DashboardCard
      variant="inventory"
      title="Inventory alerts"
      subtitle={`${alerts.length} items need attention`}
      action={
        <SeeAllLink href="/products" />
      }
    >
      <div className={styles.alertsList}>
        {alerts.map((alert) => (
          <div key={alert.id} className={styles.alertItem}>
            <div className={styles.alertTopRow}>
              <div className={styles.alertStatusGroup}>
                <span className={alert.severity === 'Critical' ? styles.alertDotRed : styles.alertDotOrange} />
                <span className={alert.severity === 'Critical' ? styles.alertStatusCritical : styles.alertStatusLow}>{alert.severity}</span>
              </div>
              <span className={styles.alertUnitsLeft}>{alert.unitsLeft}</span>
            </div>

            <div className={styles.alertMiddleRow}>
              <span className={styles.alertItemName}>{alert.itemName}</span>
              <span className={styles.alertVelocity}>{alert.velocity}</span>
            </div>

            <SegmentedBar filled={alert.filledSegments} tone={alert.severity === 'Critical' ? 'red' : 'orange'} />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
