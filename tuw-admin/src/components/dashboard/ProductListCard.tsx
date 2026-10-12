'use client';

import React from 'react';
import Image from 'next/image';
import { DashboardCard } from './DashboardCard';
import { FilterMenu } from './FilterMenu';
import { ProgressBar } from './ProgressBar';
import { PRODUCT_SORTS, type TopProduct } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface ProductListCardProps {
  products: TopProduct[];
  sort: string;
  onSortChange: (sort: string) => void;
}

export function ProductListCard({ products, sort, onSortChange }: ProductListCardProps) {
  return (
    <DashboardCard
      variant="products"
      title="Top product"
      action={
        <FilterMenu
          options={PRODUCT_SORTS.map((option) => ({ value: option, label: option }))}
          value={sort}
          onChange={onSortChange}
          ariaLabel="Product sort order"
        />
      }
    >
      <div className={styles.productList}>
        {products.map((product) => (
          <div key={product.name} className={styles.productCardItem}>
            <div className={styles.productIllustrationWrapper} style={{ position: 'relative' }}>
              <Image
                src={product.image}
                alt={product.alt}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.productInfo}>
              <span className={styles.productName}>{product.name}</span>
              <div className={styles.productStatsRow}>
                <span className={`${styles.productPrice} tuw-tabular-nums`}>{product.priceLabel}</span>
                <span className={styles.statBullet}>•</span>
                <span className={styles.productSoldGreen}>{product.sold}</span>
                <span className={styles.productSoldGray}>/{product.soldTotal} Sold</span>
              </div>
              <span className={styles.productStock}>{product.stockLabel}</span>
              <ProgressBar pct={product.progressPct} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
