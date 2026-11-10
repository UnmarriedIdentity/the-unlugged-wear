# Skill: Next.js 16 Rendering — Cache Components, PPR, Server vs Client

Global authority for how admin pages render. Goal: instant navigation
between workspace pages — a prerendered shell (sidebar, header, page
chrome) served immediately, with staff-specific data streaming in. Source of truth: the Next.js 16.3.8 docs in
`node_modules/next/dist/docs/01-app/` (this version differs from older
Next.js — read them before using an API you are unsure of).

## 0. The model in one paragraph

With `cacheComponents: true` in `next.config.ts`, **Partial Prerendering is
the default** (`experimental.ppr` no longer exists). At build time each
route becomes a **static shell**: everything that is static or cached
(`'use cache'`) plus the fallbacks of `<Suspense>` boundaries. Anything that
needs the request — `cookies()`, `headers()`, `searchParams`, unknown
`params`, uncached DB reads — must sit **inside `<Suspense>`** and streams
in at request time (a "dynamic hole"). There is no page-level SSR/SSG
switch any more: you choose per component. Segment configs `dynamic`,
`revalidate`, `fetchCache` error under Cache Components; `runtime = 'edge'`
is not supported.

## 1. Decide per component

Almost every admin screen shows staff-only, frequently changing data, so
the admin shell is small and most content is a dynamic hole. That is
expected — the win is that the chrome paints instantly and each card
streams independently.

| The component shows… | Put it in | How |
|---|---|---|
| Layout chrome: sidebar, top bar, page titles, empty-state art | **Static shell** | plain Server Components, no request data |
| Staff identity, role-gated menu items, notification bell count | Dynamic hole | `<Suspense>` + `'use cache: private'` session read |
| Lists and tables (orders, products, customers, returns, tickets) | Dynamic hole per table | `<Suspense>` around the table; filters/pagination from the `searchParams` promise awaited inside |
| Dashboard KPI cards / charts | One hole **per card** | separate `<Suspense>` per card so a slow query never blocks the others; `'use cache'` + `cacheLife('minutes')` + `cacheTag('report:<name>')` for rollups |
| Reference data reused everywhere (categories, attribute library, roles, store settings) | Cached | `'use cache'` + `cacheLife('hours')` + `cacheTag('settings')` / `cacheTag('categories')`, invalidated on edit |
| Editors, drawers, modals, filters, drag-and-drop, charts' interaction | **Client Component leaf** | `'use client'`, data passed as props, writes via Server Actions |
| Random/time values | `io()` / `connection()` inside Suspense, or inside `'use cache'` | |

Rule: **a Suspense boundary goes as low as possible** — per card, per
table — never around the whole page.

## 2. Admin route map (target)

| Route | Shell | Dynamic holes |
|---|---|---|
| `/dashboard`, `/reports` | grid layout, card frames | each KPI/chart card |
| `/orders`, `/returns`, `/refunds`, `/payments`, `/shipments`, `/fulfillment`, `/abandoned` | filters bar chrome | table + counts (`searchParams`) |
| `/products`, `/collections`, `/discounts`, `/designs` | chrome | lists; cached reference data (categories, attribute library) inside editors |
| `/customers`, `/support` | chrome | lists, threads, unread counts |
| `/content/*` (blog, pages, media) | editor chrome | document being edited (uncached — staff must see their own writes) |
| `/settings/*`, `/team` | form chrome | current values (cached `settings` tag, `updateTag` on save) |
| `/login`, `/forgot-password`, `/reset-password`, `/accept-invite` | whole page static | form result |

## 3. Caching rules

- Directive at the top of an **async** function/component/file:
  `'use cache'` (shared), `'use cache: private'` (per user, may read
  `cookies()`/`headers()`; kept in the browser only), `'use cache: remote'`
  (durable shared handler — only for slow/expensive backends).
- **Never read `cookies()`, `headers()`, `searchParams` or `connection()`
  inside `'use cache'`** — read them outside and pass plain values in.
  Never pass a runtime promise (e.g. the cookies store) as an argument.
- Arguments/returns must be serializable (plain objects, arrays, Date,
  Map, Set). No class instances, no functions (except pass-through
  children/actions).
- **Cache keys and tags are stored as plain text**: never put emails,
  tokens or other secrets in arguments or tags. Use ids.
- Always set `cacheLife` explicitly. Presets: `seconds`, `minutes`,
  `hours`, `days`, `weeks`, `max` (`default` = 5m stale / 15m revalidate).
  `seconds` (or `expire` < 5 min) is excluded from the shell → it becomes
  a dynamic hole. Custom profiles go in `next.config.ts` `cacheLife`.
- Use the **same tag names as the storefront** (`products`, `product:<id>`,
  `collection:<id>`, `category:<id>`, `cms:<pageKey>`, `faqs`, `settings`,
  `nav`) plus admin-only ones (`report:<name>`, `orders:list`).
- The two apps are separate deployments with separate caches: an admin
  edit invalidates admin caches directly, and reaches the storefront through
  its revalidation webhook (`POST /api/revalidate` on the storefront,
  secret-protected, calling `revalidateTag(tag, 'max')`).
- `use cache` storage is in-memory per server instance by default and
  never survives a deploy — fine for page data; never rely on it as a
  store of record.

## 4. Invalidation after writes

| Situation | Call |
|---|---|
| Staff edit that must show immediately (save product, change order status, update settings) | `updateTag('product:'+id)` — **Server Actions only**, then notify the storefront revalidation endpoint |
| Background/webhook/admin-driven change, stale-while-revalidate is OK | `revalidateTag('product:'+id, 'max')` — the profile argument is **required** in 16 |
| Must be gone right now from a route handler/webhook | `revalidateTag(tag, { expire: 0 })` |
| Re-render the current page without touching caches | `refresh()` — Server Actions only |
| Whole path | `revalidatePath('/products/[slug]', 'page')` |

Call revalidation **before** `redirect()` (redirect throws).

## 5. Server vs Client Components

- Server Components by default. They fetch data (through the module
  services in `packages/core`), hold secrets, and send zero JS.
- `'use client'` only on interactive leaves; everything that file imports
  joins the client bundle, so keep it tiny and import nothing server-side.
- Props across the boundary must be serializable; functions cannot be
  passed — only Server Actions (props named `action` / `*Action`).
- Composition: a Client Component receives server-rendered UI as
  `children`/slots (`<Drawer><OrderTimeline/></Drawer>`) instead of importing it.
- Context providers are `'use client'` files rendered as deep as possible,
  wrapping `{children}`, never `<html>`. To share the current user, pass an
  **un-awaited promise** into the provider and unwrap it with `use()`.
- Every server-only module starts with `import 'server-only'`. Only
  `NEXT_PUBLIC_*` env vars reach the browser.
- `useSearchParams` always needs a `<Suspense>`; `usePathname`/`useParams`
  need one on routes with unknown params.
- Cache Components keeps hidden routes mounted (`<Activity>`): form state
  and open drawers survive back/forward — reset them deliberately when
  needed.

## 6. Navigation and prefetching

- `<Link>` in the sidebar prefetches each route's App Shell, so section
  switches are instant; row links in big tables use the default prefetch
  (never `prefetch={true}` on hundreds of rows).
- `export const instant = false` on routes still being migrated.

## 7. Performance checklist (per page)

- [ ] Sidebar/header are static Server Components; no session read in the
      layout (role-gated menu items stream in their own Suspense).
- [ ] One Suspense per card/table with a same-size skeleton.
- [ ] Filters and pagination read the `searchParams` promise inside the
      table's Suspense child.
- [ ] Client bundle: editors/charts are leaves; no data libraries in client
      files.
- [ ] Every mutation calls `updateTag` and pings storefront revalidation
      when the change is customer-visible.
- [ ] Dev overlay shows no `blocking-prerender-*` insights.

## Good / bad

```tsx
// GOOD — dashboard: each card streams on its own
export default function Dashboard() {
  return (
    <Grid>
      <Suspense fallback={<KpiSkeleton />}><RevenueCard /></Suspense>
      <Suspense fallback={<KpiSkeleton />}><OrdersCard /></Suspense>
      <Suspense fallback={<TableSkeleton />}><RecentOrders /></Suspense>
    </Grid>
  );
}

async function RevenueCard() {
  'use cache';
  cacheLife('minutes');
  cacheTag('report:revenue');
  const data = await analytics.revenueSummary();
  return <Kpi label="Revenue" value={data.total} />;
}
```

```tsx
// BAD — one await at the top blocks the whole dashboard on the slowest query
export default async function Dashboard() {
  const [rev, orders, recent] = await Promise.all([...]); // ✗
  return <Grid>…</Grid>;
}
```

Related: `backend-readiness`, `performance-budgets`, `server-data-and-auth`.
