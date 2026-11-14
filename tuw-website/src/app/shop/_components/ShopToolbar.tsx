'use client';

import { useRouter } from 'next/navigation';
import FilterBar, { type FilterState } from '@storefront/components/commerce/FilterBar';
import {
  SHOP_CATEGORY_PILLS,
  shopQueryHref,
  toShopSort,
  type ShopFacetCounts,
  type ShopQuery,
} from '@storefront/lib/shop-query';

// The toolbar owns no filter state: every change rewrites the query string and
// the server re-renders the grid from it, so the URL, heading and results agree.
export default function ShopToolbar({
  query,
  resultCount,
  productCounts,
}: {
  query: ShopQuery;
  resultCount: number;
  productCounts: ShopFacetCounts;
}) {
  const router = useRouter();
  const navigate = (href: string) => router.replace(href, { scroll: false });

  const filters: FilterState = {
    category: query.category,
    size: query.size,
    color: query.color,
    sort: query.sort,
    price: query.price,
  };

  return (
    <FilterBar
      filters={filters}
      onFilterChange={(next) =>
        navigate(
          shopQueryHref(query, {
            category: next.category,
            size: next.size,
            color: next.color,
            sort: toShopSort(next.sort),
            price: next.price ?? '',
          })
        )
      }
      onReset={() => navigate('/shop')}
      resultCount={resultCount}
      availableCategories={SHOP_CATEGORY_PILLS}
      productCounts={productCounts}
    />
  );
}
