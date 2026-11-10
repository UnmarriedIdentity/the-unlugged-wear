# Skill: Client Components (small interactive leaves only)

Global authority for `'use client'` in `tuw-website`. A Client Component
ships JavaScript to every shopper, so it exists only where the page must
react to input.

## When to use one

1. State, event handlers or effects: variant picker, quantity stepper,
   size-guide toggle, cart drawer, gallery swipe, filter chips, forms with
   live validation.
2. Browser APIs (`localStorage` for demo-only screens, `IntersectionObserver`,
   media queries) or hooks (`useState`, `useActionState`, `useOptimistic`).
3. Everything else stays a Server Component — text, images, layout, lists.

## Rules

1. `'use client'` sits at the top of the smallest file that needs it.
   Everything it imports joins the bundle, so it imports no data or server code.
2. Data arrives as props from a Server Component; writes go through Server
   Actions passed as props (`addToCartAction`) or imported from `actions.ts`.
3. Server-rendered UI goes in as `children` (`<CartDrawer><CartLines/></CartDrawer>`),
   never imported into the client file.
4. Context providers wrap `{children}` as deep as possible, never `<html>`.
   Share the shopper by passing an un-awaited promise and reading it with `use()`.
5. `useSearchParams` needs a `<Suspense>` parent. Cache Components keeps
   hidden routes mounted (`<Activity>`), so reset drawers/forms on purpose.

## Good / bad

- ✅ `ProductCard` is a Server Component; only its `<WishlistHeart>` is client.
- ❌ `'use client'` on `ProductGrid` because one heart button needs `onClick`.
- ✅ `<form action={addToCartAction}>` + `useOptimistic` for the bag count.
- ❌ `useEffect(() => fetch('/api/cart'))` to load the bag after render.

Related: `server-components`, `server-actions` (backend skills), `hooks`.
