import { adminListOrders } from '@tuw/heart/modules/orders';
import { session } from '@/server/session';
import OrdersView from './_components/OrdersView';

// Server Component: the first page of orders arrives with the HTML; filters,
// search and paging then ask the server (server/order-actions.ts).
export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const claims = await session.requireStaff('order.view', '/orders');
  const [initial, params] = await Promise.all([adminListOrders({ perPage: 10 }), searchParams]);
  const openOrder = params.open && /^[A-Z0-9-]{5,30}$/i.test(params.open) ? params.open : undefined;
  return <OrdersView initial={initial} perms={claims.perms} openOrder={openOrder} />;
}
