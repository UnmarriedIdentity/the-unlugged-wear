'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@/components/ui';

export interface OrderItem {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
}

interface OrdersTableProps {
  orders: OrderItem[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow hoverable={false}>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead style={{ textAlign: 'right' }}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell style={{ fontWeight: 600 }}>{order.id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{order.date}</TableCell>
            <TableCell>{order.items} pcs</TableCell>
            <TableCell style={{ fontWeight: 600 }} className="tabular-nums">
              {order.total}
            </TableCell>
            <TableCell style={{ textAlign: 'right' }}>
              <Badge variant={order.badgeVariant}>{order.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
