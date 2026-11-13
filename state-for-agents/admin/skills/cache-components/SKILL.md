# Skill: Cache Components (fast chrome, fresh staff data)

Global authority for caching in `tuw-admin`. Staff must always see their
own writes, so most admin data is uncached; caching is for reference data
and slow rollups. Docs: `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.

## Rules

1. Sidebar, top bar and page chrome are static (shell). Tables, counts and
   records being edited are uncached, inside `<Suspense>`.
2. Cache only: reference data (categories, attribute library, roles, store
   settings) with `cacheLife('hours')`, and report rollups with
   `cacheLife('minutes')`. Always set `cacheLife` and `cacheTag`.
3. Use the storefront's tag names for shared data (`products`,
   `product:<id>`, `collection:<id>`, `category:<id>`, `cms:<pageKey>`,
   `faqs`, `settings`, `nav`) plus `report:<name>`.
4. After a staff write: `updateTag(tag)` in the Server Action, then notify the
   storefront (`POST <storefront>/api/revalidate`, secret-protected, which
   calls `revalidateTag(tag, 'max')`) — the two apps have separate caches.
5. Never read `cookies()`/`headers()`/`searchParams` inside `'use cache'`;
   pass plain values. Never put customer emails in tags or arguments.
6. Old route configs `dynamic`, `revalidate`, `fetchCache` are errors now.

## Good / bad

- ✅ `getAttributeLibrary()` cached with `cacheTag('attributes')`, refreshed
  by the attribute editor's action.
- ❌ Caching `orders.list()` — staff see a stale queue after a status change.
- ✅ Saving a product: `updateTag('product:' + id)` + storefront revalidate ping.
- ❌ Updating the product and forgetting the storefront, which shows the old price.

Related: `server-components`, `nextjs-rendering`, `performance-budgets`.
