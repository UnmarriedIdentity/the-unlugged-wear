import React from 'react';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

export type DashboardCardVariant = 'sales' | 'products' | 'inventory' | 'orders';

interface DashboardCardProps {
  variant: DashboardCardVariant;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

// Shared card shell for dashboard panels. Variant selects the Figma card
// treatment; header/title/action slots stay identical across panels.
export function DashboardCard({ variant, title, subtitle, action, children }: DashboardCardProps) {
  const cardClass =
    variant === 'sales'
      ? styles.salesTrendCard
      : variant === 'products'
        ? styles.topProductCard
        : variant === 'inventory'
          ? styles.inventoryCard
          : styles.recentOrdersCard;
  return (
    <div className={cardClass}>
      <div className={styles.cardHeaderRow}>
        <div>
          <h3 className={styles.cardTitle}>{title}</h3>
          {subtitle ? <p className={styles.subHeading}>{subtitle}</p> : null}
        </div>
        {action ?? null}
      </div>
      {children}
    </div>
  );
}
