import { adminListOrders } from '@tuw/heart/modules/orders';
import { session } from '@/server/session';
import OrdersView from './_components/OrdersView';

// Server Component: the first page of orders arrives with the HTML; filters,
// search and paging then ask the server (server/order-actions.ts).
export default async function OrdersPage() {
  const claims = await session.requireStaff('order.view', '/orders');
  const initial = await adminListOrders({ perPage: 10 });
  return <OrdersView initial={initial} perms={claims.perms} />;
}
