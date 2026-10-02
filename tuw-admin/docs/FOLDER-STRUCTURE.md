# tuw-admin — Folder Structure (Lean / Single `app.css` / No `features/`)

> Stack: Next.js 14+ App Router + TypeScript + Tailwind + CSS vars.
> Rule: one CSS entry (`src/app/globals.css`), no `src/features/`, no `src/services/` — grow only on pain.

## Full tree

```text
tuw-admin/
  design/                       # Figma reference only, never imported by code
  docs/FOLDER-STRUCTURE.md      # this file
  public/fonts/urbanist/ logos/ icons/
  tests/
  src/
    app/                        # ROUTES ONLY — thin wrappers, no business logic
      layout.tsx                # root layout: Urbanist font, <providers>, imports ./globals.css
      globals.css               # THE ONLY CSS FILE: tailwind + @theme tokens + base + utilities
      providers.tsx             # client providers: query-client, theme, auth
      (auth)/                   # no dashboard chrome
        login/page.tsx
        forgot-password/page.tsx
        reset-password/page.tsx
        accept-invite/page.tsx
      (dashboard)/              # staff area with dashboard chrome
        layout.tsx              # Sidebar + Header + guards only
        page.tsx                # overview
        products/page.tsx       # each route may contain _components/ _actions.ts colocated
        designs/page.tsx
        collections/page.tsx
        orders/page.tsx
        fulfillment/page.tsx
        shipments/page.tsx
        returns/page.tsx
        refunds/page.tsx
        customers/page.tsx
        payments/page.tsx
        reports/page.tsx
        support/page.tsx
        team/page.tsx
        audit-log/page.tsx
        content/journal/page.tsx
        content/pages/page.tsx
        content/media/page.tsx
        content/navigation/page.tsx
        settings/brand/page.tsx
        settings/general/page.tsx
        settings/shipping/page.tsx
        settings/fulfillment/page.tsx
        settings/payments/page.tsx
        settings/taxes/page.tsx
        settings/notifications/page.tsx
      api/                      # route handlers only (webhooks, proxies)
    components/                 # SHARED ONLY — used in 2+ routes, dumb + presentational
      ui/                       # primitives: Button Input Select Badge Card Tabs Tooltip Dialog
      layout/                   # Sidebar Header PageHeader EmptyState ErrorState
      data-display/             # DataTable Pagination StatCard Charts Filters
      forms/                    # Form Field wrappers around react-hook-form + zod
    lib/                        # FLAT helpers — no subfolders until >8 files
      qikink.ts                 # Qikink POD client (admin-only)
      cn.ts                     # clsx + tailwind-merge
      format.ts                 # currency, date, order-id formatters
      permissions.ts            # roles, policies, server guards (replaces old src/permissions/)
      site.ts                   # nav, site meta, env accessor (replaces old src/config/)
      types.ts                  # Product Order Customer shared types (replaces old src/types/)
```

## Inline purpose — what goes where (and what does NOT)

| Path | Purpose | Put here | Do NOT put here |
|------|---------|----------|-----------------|
| `src/app/` | URL mapping only. Each `page.tsx` fetches + composes. | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `_components/` (route-private), `_actions.ts` (route-private server actions) | Reusable UI, Supabase queries used twice, validation schemas shared across routes |
| `src/app/globals.css` | Single design-system entry. Imported once in `layout.tsx`. Holds `@import "tailwindcss"`, `@theme` tokens (Urbanist, brand colors, radius, shadow), `body` base, scrollbar/line-clamp utilities. | All CSS | Second CSS files, CSS modules, per-component CSS |
| `src/app/(auth)/` vs `(dashboard)/` | Route groups (parentheses = no URL segment). Auth = no sidebar. Dashboard = sidebar + staff guard. | Auth pages vs staff pages | Business logic |
| `src/components/ui/` | Copy of V2 design system primitives. Dumb, no Supabase, no router. Same API copied to website, evolved independently. | `Button.tsx`, `Input.tsx`, `Badge.tsx` | `ProductTable.tsx`, anything with `supabase.from()` |
| `src/components/layout/` | Dashboard chrome. Only place Sidebar/Header live (old `components/header` + `components/sidebar` merged here). | `Sidebar.tsx`, `Header.tsx`, `PageHeader.tsx` | Page content |
| `src/components/data-display/` | Tables/charts/dialogs merged. Only generic versions. | `DataTable.tsx`, `Charts.tsx`, `StatCard.tsx` | `Product-specific` columns — those live in `app/(dashboard)/products/_components/` |
| `src/components/forms/` | Shared form plumbing. | `Form.tsx`, `Field.tsx` | Zod schemas for products — those live next to the route in `_schemas.ts` |
| `src/lib/` | Flat toolbox. Import as `@/lib/cn`, `@/lib/supabase`. No nesting until painful. Replaces old `lib/ + services/ + hooks/ + config/ + types/ + permissions/` sprawl. | Pure helpers + single-purpose clients | React components, route code |
| `src/lib/permissions.ts` | Staff RBAC. Used in `(dashboard)/layout.tsx` + `api/` handlers. | `isAdmin()`, `requireStaff()` | UI |
| `design/` | Figma SVGs + plugin. Reference only. | `.svg`, import instructions | Anything imported by `src/` |
| `public/` | Static served as-is. | Fonts, logos, icons | Code |
| `tests/` | Mirror of `src/` when added. | `*.test.ts(x)` | — |

## Colocation rule (replaces `features/`)

```text
src/app/(dashboard)/products/
  page.tsx              # thin: fetch + <ProductList/>
  _components/
    ProductList.tsx     # ONLY used by this route
    ProductForm.tsx     # ONLY used by this route
  _actions.ts           # create/update product, calls @/lib/supabase
  _schemas.ts           # zod schema, private to this route
```

If `ProductForm` later needed in `collections/`, promote it to `src/components/data-display/` or create `src/features/` then. Until then, underscore prefix (`_components`) tells Next.js "not a route".

## When to graduate (do NOT pre-create)

1. `_components/X.tsx` imported by 2+ routes → move to `src/components/`.
2. `src/lib/` has >8 files or `qikink.ts` >200 lines → split to `src/services/qikink/`.
3. One domain (e.g. `orders`) has 5+ private files reused across routes → create `src/features/orders/` then.
4. `globals.css` >500 lines → split `tokens` to top of same file with comment blocks, still 1 file. Only create `src/styles/` if designers demand it.
5. `useX` used in 3+ routes → create `src/hooks/useX.ts`. Until then keep hook next to route.

## Deleted vs old scaffold

- Deleted: `src/features/`, `src/hooks/`, `src/services/`, `src/config/`, `src/types/`, `src/permissions/`, `src/design-system/`, `src/components/charts|tables|dialogs|header|sidebar/` — merged as above.
- Kept: `src/components/ui/`, `src/components/forms/`, all `src/app/` routes.
- Added: `src/components/layout/`, `src/components/data-display/`, `src/app/globals.css`, `src/lib/*.ts`, this doc.
