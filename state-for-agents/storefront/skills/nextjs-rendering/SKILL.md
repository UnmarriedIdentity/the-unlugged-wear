# Skill: Next.js 16 Rendering — Cache Components, PPR, Server vs Client

Global authority for how storefront pages render. Goal: the fastest LCP/FCP
— a prerendered static shell served instantly, with only the truly
per-request parts streaming in. Source of truth: the Next.js 16.3.8 docs in
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

| The component shows… | Put it in | How |
|---|---|---|
| Same content for everyone, changes rarely (product page body, collection grid, journal article, policies, FAQ, nav/megamenu, footer) | **Static shell, cached** | async Server Component with `'use cache'` + `cacheLife('hours'\|'days')` + `cacheTag(...)` |
| Same for everyone but time-sensitive (stock badge, "back in stock") | Cached with a short life, or a dynamic hole | `cacheLife('minutes')`; if it must be live, `<Suspense>` + uncached read |
| Depends on the visitor (cart count, wishlist hearts, account menu, "hi Asha") | **Dynamic hole** | `<Suspense fallback={<Skeleton/>}>` around a component that reads the session; use `'use cache: private'` for per-user reads |
| Depends on `searchParams` (shop filters, search results, sort) | Dynamic hole | pass the `searchParams` promise down; await inside the Suspense child |
| Interactive (variant picker, quantity stepper, drawer, carousel, forms with state) | **Client Component leaf** | `'use client'` file, as small as possible, receives data as props |
| Random/time values (`Date.now()`, `Math.random()`) | Behind `io()` (preferred, from `next/cache`) or `connection()` inside Suspense, or inside `'use cache'` | |

Rule: **a Suspense boundary goes as low as possible**, directly around the
part that needs the request — never around the whole page.

## 2. Storefront route map (target)

| Route | Shell (cached) | Dynamic holes |
|---|---|---|
| `/` home | hero, sections, featured products (`cacheTag('cms:home','products')`) | header cart count, account icon |
| `/shop`, `/collections/[slug]` | page chrome, collection header | product grid driven by `searchParams` (filters/sort) |
| `/products/[slug]` | gallery, title, description, size chart, FAQs (`cacheTag('product:'+id)`) — prerender top slugs via `generateStaticParams` (must return ≥ 1) | live stock/price badge (short cacheLife), "in your bag" state, recently viewed |
| `/cart`, `/checkout` | layout chrome only | everything else (session-bound) |
| `/account/*` | layout chrome | all content (`'use cache: private'` per user) |
| `/journal`, `/journal/[slug]`, `/faq`, `/policies/*`, `/about`, `/size-guide` | whole page cached (`cacheLife('days')`) | none |
| `/track-order` | form shell | result (request-bound) |
| `/search` | chrome | results (`searchParams`) |

Unknown dynamic params are fine: call `notFound()` for slugs that do not
exist (`dynamicParams` is not supported).

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
- Tag by entity: `products`, `product:<id>`, `collection:<id>`,
  `category:<id>`, `cms:<pageKey>`, `faqs`, `settings`, `nav`,
  `cart:<cartId>`, `orders:<userId>`.
- `use cache` storage is in-memory per server instance by default and
  never survives a deploy — fine for page data; never rely on it as a
  store of record.

## 4. Invalidation after writes

| Situation | Call |
|---|---|
| Customer action that must show their own change immediately (add to cart, save address, request exchange) | `updateTag('cart:'+id)` — **Server Actions only** |
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
  `children`/slots (`<Drawer><CartLines/></Drawer>`) instead of importing it.
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

- `<Link>` prefetches each route's shared App Shell. With
  `partialPrefetching: true` (requires `cacheComponents`), URL-dependent
  content streams after navigation unless the link sets `prefetch={true}`
  (one extra server call per link) — use it for PDP links in grids above
  the fold, not for every link on a page.
- Segment config: `export const prefetch = 'partial' | 'force-disabled'`;
  `export const instant = false` opts a route out of instant-navigation
  validation during migration.

## 7. Performance checklist (per page)

- [ ] LCP element (hero/product image) is in the static shell, uses
      `next/image` with `priority` and correct `sizes`.
- [ ] No `await` at the top of a layout; `params`/`searchParams` awaited
      inside Suspense children.
- [ ] Every Suspense fallback reserves the final size (no layout shift).
- [ ] No session read outside Suspense; no auth check in layouts.
- [ ] Client bundle: interactive leaves only; no data libraries in client
      files.
- [ ] Every cached function has `cacheLife` + `cacheTag`; every mutation
      calls the matching `updateTag`/`revalidateTag`.
- [ ] Dev overlay shows no `blocking-prerender-*` insights.

## Good / bad

```tsx
// GOOD — PDP: cached body in the shell, live stock in a hole
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <ProductBody params={params} />           {/* 'use cache' inside */}
      <Suspense fallback={<StockBadgeSkeleton />}>
        <LiveStock params={params} />           {/* uncached read */}
      </Suspense>
    </>
  );
}

async function ProductBody({ params }: { params: Promise<{ slug: string }> }) {
  'use cache';
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();
  cacheLife('hours');
  cacheTag('products', `product:${product.id}`);
  return <ProductLayout product={product} />;
}
```

```tsx
// BAD — reading the cart cookie at the top of the layout makes every page wait
export default async function Layout({ children }) {
  const cart = await getCart((await cookies()).get('sid')?.value); // ✗
  return <Shell cartCount={cart.count}>{children}</Shell>;
}
```

Related: `backend-readiness`, `performance-budgets`, `server-data-and-auth`.
