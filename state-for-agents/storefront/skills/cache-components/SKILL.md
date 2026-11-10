# Skill: Cache Components (static shell + streamed holes)

Global authority for caching in `tuw-website`. With `cacheComponents: true`,
Partial Prerendering is the default: cached and static parts form an instant
shell, request-bound parts stream inside `<Suspense>`. Docs:
`node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`.

## Rules

1. Same-for-everyone data (PDP body, collections, journal, FAQ, policies,
   nav) is an async component/function with `'use cache'`, an explicit
   `cacheLife(...)` and `cacheTag(...)`.
2. Per-shopper data (bag, wishlist, account) uses `'use cache: private'` or
   no cache, always inside `<Suspense>` with a same-size skeleton.
3. Never read `cookies()`, `headers()`, `searchParams` or `connection()`
   inside `'use cache'`; read outside, pass plain values in. Never put emails
   or tokens in arguments or tags (keys are stored as plain text).
4. Tags: `products`, `product:<id>`, `collection:<id>`, `category:<id>`,
   `cms:<pageKey>`, `faqs`, `settings`, `nav`, `cart:<cartId>`, `orders:<userId>`.
5. After a write in a Server Action: `updateTag(tag)` (read-your-own-writes).
   From a route handler/webhook: `revalidateTag(tag, 'max')` — the second
   argument is required in Next 16. Revalidate before `redirect()`.
   Exception: `settings` uses `{ expire: 0 }` (it changes prices shown —
   the next request re-reads instead of serving one stale page).
6. Lifetimes: `days` for policies/journal, `hours` for products/collections,
   `minutes` for stock badges. `seconds` drops out of the shell (becomes a hole).
7. Old route configs `dynamic`, `revalidate`, `fetchCache` are errors now.

## Good / bad

- ✅ `getCollection(slug)` with `'use cache'`, `cacheLife('hours')`,
  `cacheTag('collection:' + id)`; admin edits revalidate that tag.
- ❌ `'use cache'` on `getCart()` — one shopper's bag served to everyone.
- ✅ `addToCart` action ends with `updateTag('cart:' + cartId)`.
- ❌ `revalidateTag('products')` with one argument (deprecated, expires instantly).

Related: `server-components`, `nextjs-rendering`, `performance-budgets`.
