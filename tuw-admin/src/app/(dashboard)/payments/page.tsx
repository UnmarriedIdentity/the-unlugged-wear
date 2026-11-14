import { listPayments } from '@tuw/heart/modules/orders';
import { listProviders } from '@tuw/heart/integrations/registry';
import { session } from '@/server/session';
import PaymentsView from './_components/PaymentsView';

// Server Component: payments and the payment providers come from the database;
// collecting cash or refunding asks the server again (server/money-actions.ts).
export default async function PaymentsPage() {
  const claims = await session.requireStaff('order.view', '/payments');
  const [initial, providers] = await Promise.all([listPayments({ perPage: 10 }), listProviders('payment')]);
  return (
    <PaymentsView
      initial={initial}
      providers={providers.map((p) => ({ slug: p.slug, name: p.name, environment: p.environment, isActive: p.isActive, hasAdapter: p.hasAdapter }))}
      perms={claims.perms}
    />
  );
}
