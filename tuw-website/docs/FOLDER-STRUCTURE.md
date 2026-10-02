# tuw-website (storefront) — Folder Structure (Lean / Single `app.css` / No `features/`)

> Stack: Next.js 14+ App Router + TypeScript + Tailwind + CSS vars.
> Rule: one CSS entry (`src/app/globals.css`), no `src/features/`, no `src/services/` — grow only on pain.

## Full tree

```text
tuw-website/
  docs/FOLDER-STRUCTURE.md      # this file
  public/fonts/ logos/ icons/ images/
  tests/
  src/
    app/                        # ROUTES ONLY — thin, SEO-focused
      layout.tsx                # root layout: Urbanist font, SEO meta, imports ./globals.css
      globals.css               # THE ONLY CSS FILE: tailwind + @theme tokens + base + utilities
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
      api/                      # checkout, razorpay webhook, search proxy only
    components/                 # SHARED ONLY — used in 2+ routes, dumb + presentational
      ui/                       # primitives: Button Input Select Badge Card Tabs Dialog (copied from admin V2, evolved independently)
      layout/                   # Header Footer AnnouncementBar Breadcrumbs SEO/JsonLd
      commerce/                 # ProductCard ProductGallery Price CartDrawer CheckoutSteps OrderTimeline
    lib/                        # FLAT helpers — no subfolders until >8 files
      supabase.ts               # browser + server clients
      razorpay.ts               # Razorpay checkout + webhook verify (website-only)
      cn.ts                     # clsx + tailwind-merge
      format.ts                 # currency (INR), date formatters
      currency.ts               # price helpers (or merged into format.ts if small)
      site.ts                   # navigation, footer links, SEO defaults (replaces old src/config/)
      types.ts                  # Product Collection Cart Order shared types (replaces old src/types/)
```

## Inline purpose — what goes where (and what does NOT)

| Path | Purpose | Put here | Do NOT put here |
|------|---------|----------|-----------------|
| `src/app/` | URL = folder. Each `page.tsx` fetches + composes. Keep thin for SEO/streaming. | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `_components/` (route-private), `_actions.ts` | Reusable UI, cart logic used twice |
| `src/app/globals.css` | Single design-system entry. Imported once in `layout.tsx`. Holds `@import "tailwindcss"`, `@theme` tokens (Urbanist, brand colors), `body` base, utilities. | All CSS | Second CSS files, CSS modules |
| `src/components/ui/` | V2 primitives, same contract as admin but storefront theme values. No commerce knowledge. | `Button.tsx`, `Input.tsx` | `ProductCard.tsx` |
| `src/components/layout/` | Site chrome. Only place Header/Footer live (old `components/header` + `components/footer` merged here). | `Header.tsx`, `Footer.tsx`, `AnnouncementBar.tsx` | Page content |
| `src/components/commerce/` | Generic commerce widgets reused across shop/PDP/cart/checkout (replaces old `components/cart|products|account|checkout/` scatter). | `ProductCard.tsx`, `Price.tsx`, `CartDrawer.tsx` | Checkout-specific form — lives in `app/checkout/_components/` |
| `src/lib/` | Flat toolbox. Import as `@/lib/cn`. Replaces old `lib/ + services/ + hooks/ + config/ + types/` sprawl. | Pure helpers + clients | Components, route code |
| `public/` | Static served as-is. | Fonts, logos, product placeholders | Code |
| `tests/` | Mirror of `src/` when added. | `*.test.ts(x)` | — |

## Colocation rule (replaces `features/`)

```text
src/app/checkout/
  page.tsx              # thin: fetch cart + <CheckoutForm/>
  _components/
    CheckoutForm.tsx    # ONLY used here
    AddressStep.tsx     # ONLY used here
  _actions.ts           # place-order, calls @/lib/razorpay + @/lib/supabase
  _schemas.ts           # zod schema, private
```

If `Price.tsx` needed in `shop/` + `products/[slug]/` + `cart/`, it already lives in `components/commerce/`. Only promote when reused. Underscore prefix (`_components`) = "not a route" to Next.js.

## When to graduate (do NOT pre-create)

1. `_components/X.tsx` imported by 2+ routes → move to `src/components/commerce/` or `src/components/ui/`.
2. `src/lib/` has >8 files or `razorpay.ts` >200 lines → split to `src/services/razorpay/`.
3. One domain (e.g. `cart`) has 5+ private files reused → create `src/features/cart/` then.
4. `globals.css` >500 lines → use comment blocks (`/* Tokens */`, `/* Base */`, `/* Utilities */`), still 1 file.
5. `useX` used in 3+ routes → create `src/hooks/useX.ts`. Until then keep next to route.

## Deleted vs old scaffold

- Deleted: `src/features/`, `src/hooks/`, `src/services/`, `src/config/`, `src/types/`, `src/styles/`, `src/components/account|cart|checkout|footer|header|products/` — merged as above.
- Kept: `src/components/ui/`, all `src/app/` routes.
- Added: `src/components/layout/`, `src/components/commerce/`, `src/app/globals.css`, `src/lib/*.ts`, this doc.
