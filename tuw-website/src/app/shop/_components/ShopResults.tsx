import Link from 'next/link';
import Breadcrumb from '@storefront/components/ui/Breadcrumb';
import ProductGrid from '@storefront/components/commerce/ProductGrid';
import { getCatalog } from '@/server/catalog';
import {
  SHOP_PAGE_SIZE,
  filterShopProducts,
  parseShopQuery,
  shopFacetCounts,
  shopHeading,
  shopQueryHref,
  type ShopSearchParams,
} from '@storefront/lib/shop-query';
import ShopToolbar from './ShopToolbar';

// The dynamic hole: filters live in the URL, the catalogue is the cached read,
// and the filtering itself is a pure pass over it. Nothing here is per-user.
export default async function ShopResults({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const [params, { products }] = await Promise.all([searchParams, getCatalog()]);
  const query = parseShopQuery(params);
  const matching = filterShopProducts(products, query);
  const visible = Math.min(query.show, matching.length);

  return (
    <>
      <div className="mb-5 sm:mb-6 space-y-2">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop' },
          ]}
        />
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl font-heading font-medium tracking-tight text-store-charcoal">
            {shopHeading(query)}
          </h1>
          <span className="text-sm text-store-text-secondary tuw-tabular-nums" aria-live="polite">
            {matching.length} {matching.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      <ShopToolbar query={query} resultCount={matching.length} productCounts={shopFacetCounts(products)} />

      <div className="pt-6">
        <h2 className="sr-only">Products</h2>
        <ProductGrid products={matching.slice(0, visible)} />
        {matching.length > visible && (
          <div className="mt-12 flex flex-col items-center gap-2">
            <Link
              href={shopQueryHref({ ...query, show: visible + SHOP_PAGE_SIZE })}
              className="inline-flex items-center h-11 px-6 rounded-full border border-store-charcoal text-store-charcoal text-xs font-medium uppercase tracking-wider hover:bg-store-charcoal hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-gold"
            >
              Load more
            </Link>
            <p className="text-xs text-store-text-secondary" aria-live="polite">
              Showing {visible} of {matching.length}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
