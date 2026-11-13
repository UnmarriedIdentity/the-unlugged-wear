import { adminListDiscounts } from '@tuw/heart/modules/orders';
import { listProductDiscounts } from '@tuw/heart/modules/catalog';
import { session } from '@/server/session';
import DiscountsView from './_components/DiscountsView';

// Server Component: codes and schedules come from the database; every change
// needs discount.manage again in server/discount-actions.ts.
export default async function DiscountsPage() {
  const claims = await session.requireStaff(undefined, '/discounts');
  const [codes, schedules] = await Promise.all([adminListDiscounts(), listProductDiscounts()]);
  return <DiscountsView initialCodes={codes} initialSchedules={schedules} perms={claims.perms} />;
}
