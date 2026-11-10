# Skill: Server Components (the default for every storefront file)

Global authority for what runs on the server in `tuw-website`. Every
component is a Server Component unless it needs the browser. Source of
truth: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## Rules

1. Pages, layouts and anything that reads data are Server Components.
   They call `@tuw/heart` module functions directly (`catalog.getProduct`,
   `cart.getCart`) — never `fetch('/api/...')` to our own routes.
2. Modules that touch the DB, env secrets or provider keys start with
   `import 'server-only'`. Only `NEXT_PUBLIC_*` env vars may reach the browser.
3. Request data (`cookies()`, `headers()`, `searchParams`, unknown `params`)
   is read inside a `<Suspense>` child, never at the top of a layout or page.
   Pass the `params` / `searchParams` promise down and `await` it there.
4. No auth checks in layouts (they do not re-render on navigation). Check in
   the page section that shows the data, through the DAL (`requireCustomer()`).
5. Pass Client Components plain, serializable props (DTOs: strings, numbers,
   arrays, plain objects). Never a full DB row, a class instance or a function
   (Server Actions are the one allowed function prop).
6. Money crosses to the UI as integer paise from the module DTO; format only
   at render (`formatINR`).

## Good / bad

- ✅ `products/[slug]/page.tsx` awaits `params` inside `<ProductBody>` and
  calls `catalog.getProductBySlug(slug)`; calls `notFound()` for unknown slugs.
- ❌ `fetch('http://localhost:3007/api/products/' + slug)` from a page.
- ✅ Header shell is static; `<Suspense><CartCount /></Suspense>` reads the cart.
- ❌ `const sid = (await cookies()).get('sid')` at the top of `app/layout.tsx`.
- ✅ `<VariantSelector product={toPdpDto(product)} />` (only what it renders).
- ❌ `<VariantSelector product={row} />` passing cost price and Qikink SKU.

Related: `client-components`, `cache-components`, `nextjs-rendering`.
