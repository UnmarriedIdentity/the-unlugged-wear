import { adminListCategories, adminListProducts, listLibrary, listSizeCharts } from '@tuw/heart/modules/catalog';
import { session } from '@/server/session';
import type { ProductItem } from '@/mocks/fixtures';
import ProductsView from './_components/ProductsView';

// Server Component: any staff member can read the catalog; each write checks
// its own permission again in server/catalog-actions.ts.
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const claims = await session.requireStaff(undefined, '/products');
  const [products, categories, library, sizeCharts, params] = await Promise.all([adminListProducts(), adminListCategories(), listLibrary(), listSizeCharts(), searchParams]);
  const openId = params.open && /^[0-9a-f-]{36}$/i.test(params.open) ? params.open : undefined;
  return <ProductsView initialProducts={products as unknown as ProductItem[]} categories={categories.map((c) => c.name)} perms={claims.perms} storefrontOrigin={process.env.STOREFRONT_URL ?? ''} initialLibrary={library} initialSizeCharts={sizeCharts} openId={openId} />;
}
