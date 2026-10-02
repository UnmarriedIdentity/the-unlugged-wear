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
  Button,
} from '@/components/ui';

export interface CustomerItem {
  id: number;
  name: string;
  email: string;
  orders: number;
  totalSpent: string;
  status: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  color: string;
}

interface CustomersTableProps {
  customers: CustomerItem[];
  onViewProfile?: (customer: CustomerItem) => void;
}

export function CustomersTable({ customers, onViewProfile }: CustomersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow hoverable={false}>
          <TableHead>Customer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Total Orders</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: c.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                  }}
                >
                  {c.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
              </div>
            </TableCell>
            <TableCell style={{ color: 'var(--tuw-text-secondary, #5D6772)' }}>{c.email}</TableCell>
            <TableCell>{c.orders} orders</TableCell>
            <TableCell style={{ fontWeight: 600 }} className="tabular-nums">
              {c.totalSpent}
            </TableCell>
            <TableCell>
              <Badge variant={c.badgeVariant}>{c.status}</Badge>
            </TableCell>
            <TableCell style={{ textAlign: 'right' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (onViewProfile ? onViewProfile(c) : alert(`View Profile: ${c.name}`))}
              >
                View Profile
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
