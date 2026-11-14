import { listRefunds } from '@tuw/heart/modules/orders';
import { session } from '@/server/session';
import RefundsView from './_components/RefundsView';

// Server Component: refunds come from the database. ?order=<number> opens the
// refund form for that order (linked from Orders and Payments).
export default async function RefundsPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const claims = await session.requireStaff('order.view', '/refunds');
  const [initial, params] = await Promise.all([listRefunds({ perPage: 10 }), searchParams]);
  const order = params.order && /^[A-Z0-9-]{5,30}$/i.test(params.order) ? params.order : undefined;
  return <RefundsView initial={initial} perms={claims.perms} openForOrder={order} />;
}
