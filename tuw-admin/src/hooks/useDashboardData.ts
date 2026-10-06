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

export interface DashboardAdapter {
  getSalesTrend(range: string): SalesTrendPoint[];
  getInventoryAlerts(): InventoryAlert[];
  getConversionRate(): { value: number; delta: number };
}

// Mock adapter: deterministic demo feeds (Figma Frame 1:20300 values).
export const mockDashboardAdapter: DashboardAdapter = {
  getSalesTrend: () => [
    { day: 'Mon', lastWeek: 38, thisWeek: 44, lastVal: '₹2,800', thisVal: '₹3,200' },
    { day: 'Tue', lastWeek: 49, thisWeek: 62, lastVal: '₹4,000', thisVal: '₹5,600' },
    { day: 'Wed', lastWeek: 82, thisWeek: 72, lastVal: '₹6,800', thisVal: '₹6,000' },
    { day: 'Thu', lastWeek: 48, thisWeek: 61, lastVal: '₹4,000', thisVal: '₹5,200' },
    { day: 'Fri', lastWeek: 87, thisWeek: 99, lastVal: '₹7,200', thisVal: '₹8,500' },
    { day: 'Sat', lastWeek: 67, thisWeek: 80, lastVal: '₹5,400', thisVal: '₹6,400' },
    { day: 'Sun', lastWeek: 62, thisWeek: 68, lastVal: '₹5,000', thisVal: '₹6,000' },
  ],
  getInventoryAlerts: () => [
    { id: 1, severity: 'Critical', unitsLeft: '5 units left', itemName: 'Boyfriend Poplin Shirt', velocity: 'Sells: 3 pcs/day', filledSegments: 2 },
    { id: 2, severity: 'Low', unitsLeft: '8 units left', itemName: 'Tailored Blazer Suit', velocity: 'Sells: 2 pcs/day', filledSegments: 2 },
    { id: 3, severity: 'Low', unitsLeft: '10 units left', itemName: 'Floral dress', velocity: 'Sells: 4 pcs/day', filledSegments: 2 },
  ],
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
  inventoryAlerts: InventoryAlert[];
  recentOrders: OrderItem[];
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
      salesTrend: adapter.getSalesTrend(timeRange),
      salesTotal: '₹39,190',
      salesDelta: 8.4,
      inventoryAlerts: adapter.getInventoryAlerts(),
      recentOrders: orders.slice(0, 6),
      timeRange,
      setTimeRange,
      productSort,
      setProductSort,
    };
  }, [orders, adapter, timeRange, productSort]);
}
