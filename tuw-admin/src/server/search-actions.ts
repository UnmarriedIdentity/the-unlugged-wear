'use server';

import { z } from 'zod';
import { adminSearchProducts } from '@tuw/heart/modules/catalog';
import { listCustomers } from '@tuw/heart/modules/customers';
import { adminListOrders } from '@tuw/heart/modules/orders';
import { AppError } from '@tuw/heart/platform/errors';
import { guards } from './session';

// Spotlight search (TL-BE-08.09). One request searches every area the staff
// member may read, in parallel; an area they lack permission for is simply
// left out. Five hits per area keeps it fast.

const LIMIT = 5;

export const globalSearchAction = guards.action({ access: 'customer', input: z.object({ q: z.string().trim().max(100), scope: z.enum(['orders', 'products', 'customers']).optional() }) }, async ({ input, ctx }) => {
  const user = ctx.user!;
  if (!user.roles.some((r) => r !== 'customer')) throw new AppError('FORBIDDEN', 'Staff access required.');
  const q = input.q;
  const wants = (area: 'orders' | 'products' | 'customers') => !input.scope || input.scope === area;
  if (q.length < 2) return { orders: [], products: [], customers: [] };
  const [orders, products, customers] = await Promise.all([
    wants('orders') && user.permissions.includes('order.view') ? adminListOrders({ q, perPage: LIMIT }).then((r) => r.rows) : Promise.resolve([]),
    wants('products') ? adminSearchProducts(q, LIMIT) : Promise.resolve([]),
    wants('customers') && user.permissions.includes('customer.view') ? listCustomers({ q, perPage: LIMIT }).then((r) => r.data) : Promise.resolve([]),
  ]);
  return {
    orders: orders.map((o) => ({ orderNumber: o.orderNumber, customerName: o.customerName, totalPaise: o.totalPaise, status: o.status, paymentStatus: o.paymentStatus })),
    products: products.map((p) => ({ id: p.id, name: p.name, category: p.category, status: p.status, pricePaise: p.pricePaise, stock: p.stock, madeToOrder: p.madeToOrder })),
    customers: customers.map((cu) => ({ profileId: cu.profileId, name: cu.name, email: cu.email ?? '', city: cu.city ?? '' })),
  };
});
