'use client';

import React, { useState } from 'react';
import { Plus, Filter, ArrowUpRight, Search } from 'lucide-react';
import DashboardShell from '@/components/layout/DashboardShell';
// Class map - selectors live in src/app/globals.css (single app.css, sub- prefix).
// Verbatim port of SubPages.module.css; JSX untouched for zero pixel drift.
const styles = new Proxy<Record<string, string>>({}, { get: (_t, p) => 'sub-' + String(p) });
import { StatCard, ContentCard, Button, Badge } from '@/components/ui';

const catalogProducts = [
  {
    id: 1,
    name: 'Summer dress',
    category: 'Dresses',
    price: '$2,340',
    stock: 8,
    status: 'Critical Low',
    statusClass: styles.badgeRed,
    sold: 492,
    bg: 'linear-gradient(135deg, #EBF4F8 0%, #D8EBF5 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <path d="M21 7C22 5.8 24 5.8 25 7" stroke="#7A93A2" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M19 8L16 17H32L29 8L24 13L19 8Z" fill="#3D7EAA" />
        <path d="M19 8L24 13L29 8" stroke="#2B648C" strokeWidth="1.2" />
        <rect x="15.5" y="17" width="17" height="3" rx="1.5" fill="#2B5B7D" />
        <path d="M16 20L10 38C12 40 18 41 24 41C30 41 36 40 38 38L32 20H16Z" fill="#4E8CBA" />
        <path d="M19 20L17 39.5" stroke="#3D75A0" strokeWidth="1.2" />
        <path d="M24 20V41" stroke="#31678E" strokeWidth="1.2" />
        <path d="M29 20L31 39.5" stroke="#3D75A0" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 2,
    name: 'Floral dress',
    category: 'Dresses',
    price: '$1,680',
    stock: 34,
    status: 'Low Stock',
    statusClass: styles.badgeOrange,
    sold: 369,
    bg: 'linear-gradient(135deg, #FAF0EB 0%, #F5E2DA 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <line x1="18" y1="8" x2="18" y2="15" stroke="#252525" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="30" y1="8" x2="30" y2="15" stroke="#252525" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 15C16 13 32 13 32 15L31 22H17L16 15Z" fill="#1E2022" />
        <rect x="16.5" y="22" width="15" height="2.5" fill="#141517" />
        <path d="M17 24.5L12 39C16 41 32 41 36 39L31 24.5H17Z" fill="#1E2022" />
        <circle cx="20" cy="18" r="2.5" fill="#E8826F" />
        <circle cx="27" cy="19" r="2.2" fill="#EAA3B3" />
        <circle cx="24" cy="28" r="2.8" fill="#F8B195" />
      </svg>
    ),
  },
  {
    id: 3,
    name: 'White Tshirt',
    category: 'Tops',
    price: '$1,890',
    stock: 26,
    status: 'In Stock',
    statusClass: styles.badgeGreen,
    sold: 592,
    bg: 'linear-gradient(135deg, #F0F3F6 0%, #E3E7ED 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <path
          d="M16 11L9 16L12 21L15 19V38H33V19L36 21L39 16L32 11C30 14 27 15 24 15C21 15 18 14 16 11Z"
          fill="#FFFFFF"
          stroke="#B8C4CE"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M18 11.5C19.5 13.5 21.6 14.5 24 14.5C26.4 14.5 28.5 13.5 30 11.5" stroke="#A2B0BD" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="21" y="20" width="6" height="3" rx="1" fill="#115D5D" opacity="0.85" />
      </svg>
    ),
  },
  {
    id: 4,
    name: 'Ankle boots',
    category: 'Footwear',
    price: '$2,150',
    stock: 8,
    status: 'Low Stock',
    statusClass: styles.badgeOrange,
    sold: 215,
    bg: 'linear-gradient(135deg, #F7EFE8 0%, #EDE1D5 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <path d="M14 14H24V28L36 31V37H14V14Z" fill="#5A3A28" />
        <path d="M14 37H36V40H14V37Z" fill="#2E1C12" />
        <line x1="20" y1="18" x2="20" y2="26" stroke="#C49B7A" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 5,
    name: 'Denim Jacket',
    category: 'Outerwear',
    price: '$3,420',
    stock: 54,
    status: 'In Stock',
    statusClass: styles.badgeGreen,
    sold: 180,
    bg: 'linear-gradient(135deg, #E6EEF5 0%, #D2DEEB 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <path d="M14 10L8 16L12 26L16 23V39H32V23L36 26L40 16L34 10H14Z" fill="#2E5A88" stroke="#1D3E62" strokeWidth="1.5" />
        <line x1="24" y1="10" x2="24" y2="39" stroke="#1D3E62" strokeWidth="1.5" />
        <rect x="17" y="16" width="4" height="4" fill="#24486E" />
        <rect x="27" y="16" width="4" height="4" fill="#24486E" />
      </svg>
    ),
  },
  {
    id: 6,
    name: 'Silk Scarf',
    category: 'Accessories',
    price: '$890',
    stock: 42,
    status: 'In Stock',
    statusClass: styles.badgeGreen,
    sold: 310,
    bg: 'linear-gradient(135deg, #FAF3F7 0%, #EFE1EB 100%)',
    svg: (
      <svg width="60" height="60" viewBox="0 0 48 48" fill="none">
        <path d="M12 12C20 8 28 20 36 14C38 22 28 32 34 38C26 36 18 26 12 30V12Z" fill="#9C4D78" />
        <circle cx="24" cy="22" r="3" fill="#E8B4CE" />
      </svg>
    ),
  },
];

export default function ProductsView() {
  const [selectedCat, setSelectedCat] = useState('All');

  const filteredProducts = selectedCat === 'All'
    ? catalogProducts
    : catalogProducts.filter(p => p.category === selectedCat);

  return (
    <DashboardShell pageTitle="Products" activeNav="products">
      <div className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <h2 className={styles.pageTitle}>Product Catalog</h2>
          <p className={styles.pageSubtitle}>Organize stock, inventory alerts, and product merchandising.</p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="md"
            icon={<Filter size={16} />}
            onClick={() => alert('Filter Catalog')}
          >
            <span>Filter</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => alert('Add New Product Modal (Figma Frame 3:0:1)')}
          >
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statGrid}>
        <StatCard
          label="Total Products"
          value="86"
          trend="↑ 4 added this week"
          trendType="up"
        />
        <StatCard
          label="Low Stock Alerts"
          value="3"
          trend="Needs re-stock"
          trendType="down"
        />
        <StatCard
          label="Out of Stock"
          value="0"
          trend="100% available"
          trendType="up"
        />
        <StatCard
          label="Categories"
          value="12"
          trend="Active departments"
          trendType="neutral"
        />
      </div>

      {/* Catalog Grid */}
      <ContentCard>
        <div className={styles.filterBar}>
          <ul className={styles.tabList}>
            {['All', 'Dresses', 'Tops', 'Outerwear', 'Footwear', 'Accessories'].map((cat) => (
              <li
                key={cat}
                className={`${styles.tabItem} ${selectedCat === cat ? styles.tabItemActive : ''}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.cardGrid}>
          {filteredProducts.map((p) => (
            <div key={p.id} className={styles.productCatalogCard}>
              <div className={styles.productThumbFrame} style={{ background: p.bg }}>
                {p.svg}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{p.name}</span>
                <Badge
                  variant={
                    p.status === 'In Stock'
                      ? 'success'
                      : p.status === 'Low Stock'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--tuw-text-secondary, #5D6772)', fontSize: '13px' }}>
                <span>Stock: {p.stock} units</span>
                <span>Sold: {p.sold}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tuw-text-primary, #262626)' }}>{p.price}</span>
                <Button variant="secondary" size="sm" onClick={() => alert(`Manage: ${p.name}`)}>
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>
    </DashboardShell>
  );
}
