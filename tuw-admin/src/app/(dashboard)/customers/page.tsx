import * as customers from '@tuw/heart/modules/customers';
import { session } from '@/server/session';
import CustomersView from './_components/CustomersView';

// Customer directory (TL-BE-03.03). Search, paging and the open profile all
// live in the URL (?q=&page=&customer=), so the server does every read.
export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; perPage?: string; customer?: string }> }) {
  await session.requireStaff('customer.view', '/customers');
  const params = await searchParams;
  const query = customers.customerSchemas.customerList.safeParse(params);
  const { q, page, perPage } = query.success ? query.data : {};
  const [list, stats, detail] = await Promise.all([
    customers.listCustomers({ q, page, perPage: perPage ?? 10 }),
    customers.customerStats(),
    params.customer && /^[0-9a-f-]{36}$/i.test(params.customer) ? customers.getCustomerDetail(params.customer).catch(() => null) : Promise.resolve(null),
  ]);
  return <CustomersView list={list} stats={stats} detail={detail} selectedId={params.customer ?? null} query={q ?? ''} />;
}
