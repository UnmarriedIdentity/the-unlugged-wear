'use client';

import { useMemo, useState } from 'react';
import { useAdminState } from '@/mocks/state';
import type { OrderItem } from '@/mocks/fixtures';

// ---------------------------------------------------------------------------
// Dashboard data layer (D1).
// UI components consume `useDashboardData()` only. Live values derive from
// the demo store today; `DashboardAdapter` lets a future phase swap the
// static trend/alert/conversion feeds for real endpoints without touching JSX.
// ---------------------------------------------------------------------------

export interface SalesTrendPoint {
  day: string;
  lastWeek: number;
  thisWeek: number;
  lastVal: string;
  thisVal: string;
}

export type AlertSeverity = 'Critical' | 'Low';

export interface InventoryAlert {
  id: number;
  severity: AlertSeverity;
  unitsLeft: string;
  itemName: string;
  velocity: string;
  filledSegments: number;
}

export interface SalesTrendFeed {
  points: SalesTrendPoint[];
  total: string;
  delta: number;
  legendPast: string;
  legendCurrent: string;
  compareLabel: string;
}

export interface DashboardAdapter {
  getSalesTrend(range: string): SalesTrendFeed;
  getInventoryAlerts(): InventoryAlert[];
  getTopProducts(sort: string): TopProduct[];
  getConversionRate(): { value: number; delta: number };
}

export const SALES_RANGES = ['This week', 'Last week', 'This month'] as const;
export const PRODUCT_SORTS = ['By revenue', 'By units sold'] as const;

export interface TopProduct {
  name: string;
  priceLabel: string;
  sold: number;
  soldTotal: number;
  stockLabel: string;
  progressPct: number;
  image: string;
  alt: string;
}

// Curated demo display order for the default 'By revenue' view (Figma Frame 1:20300).
const curatedTopProducts: TopProduct[] = [
  { name: 'Boyfriend Poplin Shirt', priceLabel: '₹3,490', sold: 492, soldTotal: 500, stockLabel: 'Stock: 8 units', progressPct: 92, image: '/products/1.jpeg', alt: 'Boyfriend Poplin Shirt' },
  { name: 'Tailored Blazer Suit', priceLabel: '₹6,890', sold: 369, soldTotal: 450, stockLabel: 'Stock: 34 units', progressPct: 82, image: '/products/2.jpeg', alt: 'Tailored Blazer Suit' },
  { name: 'Belted Safari Ensemble', priceLabel: '₹5,490', sold: 592, soldTotal: 800, stockLabel: 'Stock: 26 units', progressPct: 74, image: '/products/3.jpeg', alt: 'Belted Safari Ensemble' },
];

// Mock adapter: deterministic demo feeds (Figma Frame 1:20300 values for This week).
export const mockDashboardAdapter: DashboardAdapter = {
  getSalesTrend: (range: string) => {
    if (range === 'Last week') {
      return {
        points: [
          { day: 'Mon', lastWeek: 34, thisWeek: 38, lastVal: '₹2,400', thisVal: '₹2,800' },
          { day: 'Tue', lastWeek: 45, thisWeek: 49, lastVal: '₹3,600', thisVal: '₹4,000' },
          { day: 'Wed', lastWeek: 78, thisWeek: 82, lastVal: '₹6,200', thisVal: '₹6,800' },
          { day: 'Thu', lastWeek: 44, thisWeek: 48, lastVal: '₹3,600', thisVal: '₹4,000' },
          { day: 'Fri', lastWeek: 83, thisWeek: 87, lastVal: '₹6,800', thisVal: '₹7,200' },
          { day: 'Sat', lastWeek: 63, thisWeek: 67, lastVal: '₹5,000', thisVal: '₹5,400' },
          { day: 'Sun', lastWeek: 58, thisWeek: 62, lastVal: '₹4,600', thisVal: '₹5,000' },
        ],
        total: '₹36,180',
        delta: 6.1,
        legendPast: '2 weeks ago',
        legendCurrent: 'Last week',
        compareLabel: 'vs 2 weeks ago',
      };
    }
    if (range === 'This month') {
      return {
        points: [
          { day: 'W1', lastWeek: 42, thisWeek: 55, lastVal: '₹18,200', thisVal: '₹24,600' },
          { day: 'W2', lastWeek: 58, thisWeek: 71, lastVal: '₹26,400', thisVal: '₹31,800' },
          { day: 'W3', lastWeek: 76, thisWeek: 88, lastVal: '₹34,000', thisVal: '₹39,400' },
          { day: 'W4', lastWeek: 64, thisWeek: 79, lastVal: '₹28,800', thisVal: '₹35,200' },
        ],
        total: '₹1,31,000',
        delta: 11.2,
        legendPast: 'Last month',
        legendCurrent: 'This month',
        compareLabel: 'vs last month',
      };
    }
    return {
      points: [
        { day: 'Mon', lastWeek: 38, thisWeek: 44, lastVal: '₹2,800', thisVal: '₹3,200' },
        { day: 'Tue', lastWeek: 49, thisWeek: 62, lastVal: '₹4,000', thisVal: '₹5,600' },
        { day: 'Wed', lastWeek: 82, thisWeek: 72, lastVal: '₹6,800', thisVal: '₹6,000' },
        { day: 'Thu', lastWeek: 48, thisWeek: 61, lastVal: '₹4,000', thisVal: '₹5,200' },
        { day: 'Fri', lastWeek: 87, thisWeek: 99, lastVal: '₹7,200', thisVal: '₹8,500' },
        { day: 'Sat', lastWeek: 67, thisWeek: 80, lastVal: '₹5,400', thisVal: '₹6,400' },
        { day: 'Sun', lastWeek: 62, thisWeek: 68, lastVal: '₹5,000', thisVal: '₹6,000' },
      ],
      total: '₹39,190',
      delta: 8.4,
      legendPast: 'Last week',
      legendCurrent: 'This week',
      compareLabel: 'vs last week',
    };
  },
  getInventoryAlerts: () => [
    { id: 1, severity: 'Critical', unitsLeft: '5 units left', itemName: 'Boyfriend Poplin Shirt', velocity: 'Sells: 3 pcs/day', filledSegments: 2 },
    { id: 2, severity: 'Low', unitsLeft: '8 units left', itemName: 'Tailored Blazer Suit', velocity: 'Sells: 2 pcs/day', filledSegments: 2 },
    { id: 3, severity: 'Low', unitsLeft: '10 units left', itemName: 'Floral dress', velocity: 'Sells: 4 pcs/day', filledSegments: 2 },
  ],
  getTopProducts: (sort: string) =>
    sort === 'By units sold'
      ? [...curatedTopProducts].sort((a, b) => b.sold - a.sold)
      : curatedTopProducts,
  getConversionRate: () => ({ value: 3.2, delta: -0.3 }),
};

export interface DashboardKpis {
  revenueToday: number;
  revenueDelta: number;
  ordersToday: number;
  ordersDelta: number;
  averageOrder: number;
  averageOrderDelta: number;
  conversionRate: number;
  conversionDelta: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  salesTrend: SalesTrendPoint[];
  salesTotal: string;
  salesDelta: number;
  salesLegendPast: string;
  salesLegendCurrent: string;
  salesCompareLabel: string;
  inventoryAlerts: InventoryAlert[];
  recentOrders: OrderItem[];
  topProducts: TopProduct[];
  timeRange: string;
  setTimeRange: (range: string) => void;
  productSort: string;
  setProductSort: (sort: string) => void;
}

export function useDashboardData(adapter: DashboardAdapter = mockDashboardAdapter): DashboardData {
  const { orders } = useAdminState();
  const [timeRange, setTimeRange] = useState('This week');
  const [productSort, setProductSort] = useState('By revenue');

  return useMemo(() => {
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const revenueToday = paidOrders.reduce((sum, o) => sum + (o.paidAmount || o.total), 0);
    const ordersToday = orders.length;
    const averageOrder = paidOrders.length > 0 ? revenueToday / paidOrders.length : 0;
    const conversion = adapter.getConversionRate();
    const trend = adapter.getSalesTrend(timeRange);
    return {
      kpis: {
        revenueToday,
        revenueDelta: 12.3,
        ordersToday,
        ordersDelta: 5,
        averageOrder,
        averageOrderDelta: 7.1,
        conversionRate: conversion.value,
        conversionDelta: conversion.delta,
      },
      salesTrend: trend.points,
      salesTotal: trend.total,
      salesDelta: trend.delta,
      salesLegendPast: trend.legendPast,
      salesLegendCurrent: trend.legendCurrent,
      salesCompareLabel: trend.compareLabel,
      inventoryAlerts: adapter.getInventoryAlerts(),
      recentOrders: orders.slice(0, 6),
      topProducts: adapter.getTopProducts(productSort),
      timeRange,
      setTimeRange,
      productSort,
      setProductSort,
    };
  }, [orders, adapter, timeRange, productSort]);
}
