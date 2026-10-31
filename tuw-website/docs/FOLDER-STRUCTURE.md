# tuw-website (storefront) — Folder Structure (Lean / One Source Root / No `features/`)

> Stack: Next.js 16 App Router + TypeScript + Tailwind + CSS vars.
> Rule: one CSS entry (`src/app/globals.css`), no `src/features/`, no `src/services/` — grow only on pain.

## Full tree

```text
tuw-website/
  docs/FOLDER-STRUCTURE.md      # this file
  public/fonts/ logos/ icons/ images/
  tests/
  src/
    app/                        # ROUTES ONLY — thin, SEO-focused
      layout.tsx                # root layout: fonts, SEO meta, imports ./globals.css
      globals.css               # THE ONLY CSS: tailwind + @theme tokens + base + utilities
      providers.tsx             # CartProvider AuthProvider WishlistProvider
      page.tsx                  # homepage
      shop/page.tsx
      products/[slug]/page.tsx  # PDP
      collections/[slug]/page.tsx
      search/page.tsx
      size-guide/page.tsx
      faq/page.tsx
      about/page.tsx
      contact/page.tsx
      journal/page.tsx
      journal/[slug]/page.tsx
      policies/[slug]/page.tsx
      cart/page.tsx
      checkout/page.tsx
      track-order/page.tsx
      wishlist/page.tsx
      account/orders/page.tsx
      account/profile/page.tsx
      account/addresses/page.tsx
      account/returns/page.tsx
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      api/                    # checkout, razorpay webhook, search proxy only
    storefront/                 # @storefront/* — source for the routes above
      components/               # SHARED ONLY — used in 2+ routes, dumb + presentational
        ui/                     # primitives: Button Input Select Badge Card Tabs Dialog
        layout/                 # Header Footer AnnouncementBar Breadcrumbs CartDrawer
        commerce/               # ProductCard ProductGallery VariantSelector CartDrawer
        editorial/              # journal, lookbook and story blocks
      lib/                      # FLAT helpers — no subfolders until >8 files
        supabase.ts             # browser + server clients
        razorpay.ts             # Razorpay checkout + webhook verify (website-only)
        cn.ts                   # clsx + tailwind-merge
        format.ts               # currency (INR), date formatters
        site.ts                 # navigation, footer links, SEO defaults
        types.ts                # Product Collection Cart Order shared types
        qikink.ts               # partner fulfilment seam
      mocks/                    # typed fixtures + local state adapter
```

## One source root, one alias

`tuw-admin` is a separate package in this workspace with its own `src/`. Nothing in this
package imports it and it imports nothing from here, so a specifier always names the
storefront root.

| Alias | Resolves to | Owns |
|-------|-------------|------|
| `@storefront/*` | `src/storefront/*` | everything the routes import |
| `@/*` | `src/*` | escape hatch — the route files themselves |

Because the surface has exactly one alias, moving a folder inside it is a single edit in
`tsconfig.json`, not a sweep through every importing file.


## Inline purpose — what goes where (and what does NOT)

| Path | Purpose | Put here | Do NOT put here |
|------|---------|----------|-----------------|
| `src/app/` | URL = folder. Each `page.tsx` fetches + composes. Keep thin for SEO/streaming. | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `_components/` (route-private), `_actions.ts` | Reusable UI, cart logic used twice |
| `src/app/globals.css` | Single storefront design-system entry. Imported once in `layout.tsx`. Holds `@import "tailwindcss"`, `@theme` tokens, `body` base, utilities. | All storefront CSS | Second CSS files, CSS modules |
| `src/storefront/components/ui/` | V2 primitives at storefront theme values. No commerce knowledge. | `Button.tsx`, `Input.tsx` | `ProductCard.tsx` |
| `src/storefront/components/layout/` | Site chrome. Only place Header/Footer live. | `Header.tsx`, `Footer.tsx`, `AnnouncementBar.tsx` | Page content |
| `src/storefront/components/commerce/` | Generic commerce widgets reused across shop/PDP/cart/checkout. | `ProductCard.tsx`, `VariantSelector.tsx`, `CartDrawer.tsx` | Checkout-specific form — lives in `app/checkout/_components/` |
| `src/storefront/components/editorial/` | Journal, lookbook and story blocks. | `JournalCard.tsx`, `LookbookGrid.tsx` | Commerce logic |
| `src/storefront/lib/` | Flat toolbox. Import as `@storefront/lib/cn`. | Pure helpers + clients | Components, route code |
| `public/` | Static served as-is. | Fonts, logos, product placeholders | Code |
| `tests/` | Mirror of `src/` when added. | `*.test.ts(x)` | — |

## Colocation rule (replaces `features/`)

```text
src/app/checkout/
  page.tsx              # thin: fetch cart + <CheckoutForm/>
  _components/
    CheckoutForm.tsx    # ONLY used here
    AddressStep.tsx     # ONLY used here
  _actions.ts           # place-order, calls @storefront/lib/razorpay + @storefront/lib/supabase
  _schemas.ts           # zod schema, private
```

If `VariantSelector.tsx` is needed in `shop/` + `products/[slug]/` + `cart/`, it already lives in `storefront/components/commerce/`. Only promote when reused. Underscore prefix (`_components`) = "not a route" to Next.js.

## When to graduate (do NOT pre-create)

1. `_components/X.tsx` imported by 2+ routes → move to `src/storefront/components/commerce/` or `src/storefront/components/ui/`.
2. `src/storefront/lib/` has >8 files or `razorpay.ts` >200 lines → split to `src/storefront/services/razorpay/`.
3. One domain (e.g. `cart`) has 5+ private files reused → create `src/storefront/features/cart/` then.
4. `globals.css` >500 lines → use comment blocks (`/* Tokens */`, `/* Base */`, `/* Utilities */`), still 1 file.
5. `useX` used in 3+ routes → create `src/storefront/hooks/useX.ts`. Until then keep next to route.

## Where the storefront source came from

- Was loose at `src/components/`, `src/lib/` and `src/mocks/` — moved to `src/storefront/` so every import names the surface it belongs to, and so the same component name can exist in both packages independently.
- Kept: `src/storefront/components/ui/`, all `src/app/` routes.
- Added: `src/storefront/components/{layout,commerce,editorial}/`, `src/app/globals.css`, `src/storefront/lib/*.ts`, the `@storefront/*` alias, this doc.
