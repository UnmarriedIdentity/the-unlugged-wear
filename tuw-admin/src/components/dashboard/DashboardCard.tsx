import React from 'react';
import SurfaceCard from '@/components/ui/SurfaceCard';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

export type DashboardCardVariant = 'sales' | 'products' | 'inventory' | 'orders';

interface DashboardCardProps {
  variant: DashboardCardVariant;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  subheader?: React.ReactNode;
  children: React.ReactNode;
}

// Shared card shell for dashboard panels. Variant selects the Figma card
// treatment; header/title/action slots stay identical across panels.
// `subheader` renders inside the same wrapper as the header row (mirrors the
// original sales card: header + stat row pinned together as one flex item,
// so space-between cards never stretch the gap between them).
export function DashboardCard({ variant, title, subtitle, action, subheader, children }: DashboardCardProps) {
  const cardClass =
    variant === 'sales'
      ? styles.salesTrendCard
      : variant === 'products'
        ? styles.topProductCard
        : variant === 'inventory'
          ? styles.inventoryCard
          : styles.recentOrdersCard;
  return (
    <SurfaceCard padding="20px 24px" className={cardClass}>
      <div>
        <div className={styles.cardHeaderRow}>
          <div>
            <h3 className={styles.cardTitle}>{title}</h3>
            {subtitle ? <p className={styles.subHeading}>{subtitle}</p> : null}
          </div>
          {action ?? null}
        </div>
        {subheader ?? null}
      </div>
      {children}
    </SurfaceCard>
  );
}
