'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { PRODUCT_SORTS, type TopProduct } from '@/hooks/useDashboardData';

// Class map - selectors live in src/app/globals.css (single app.css, home- prefix).
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'home-' + String(p) });

interface ProductListCardProps {
  products: TopProduct[];
  sort: string;
  onSortChange: (sort: string) => void;
}

export function ProductListCard({ products, sort, onSortChange }: ProductListCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <DashboardCard
      variant="products"
      title="Top product"
      action={
        <div className="relative">
          <button
            type="button"
            className={styles.filterSelectBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span>{sort}</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div role="menu" className={`${styles.rangeMenu} absolute right-0 top-full z-50 mt-2`}>
                {PRODUCT_SORTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option === sort}
                    className={option === sort ? styles.rangeMenuItemSelected : styles.rangeMenuItem}
                    onClick={() => {
                      onSortChange(option);
                      setMenuOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
              <div className={styles.productProgressContainer}>
                <div className={styles.progressBarTrack}>
                  <div className={styles.progressBarFill} style={{ width: `${product.progressPct}%` }} />
                </div>
                <span className={styles.progressPercentText}>{product.progressPct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
