# Skill: Folder Structure (Next.js app-router mapping)

Global authority for where every file lives in `tuw-website/src`.
Follows the Next.js app-router structure; nothing custom-invented.

## Map

- `src/app/` — routes only. `page.tsx` per route, `[slug]/` for dynamic
  product/collection/journal pages, `layout.tsx` + `providers.tsx` (store
  wiring) at root, `error.tsx` + `not-found.tsx` beside the routes they
  cover. `api/` holds stubs marking where handlers land (never live logic
  before the backend track). Route segments are `kebab-case`.
- `src/components/ui/` — base primitives only (`Button`, `Input`, `Badge`,
  `Modal`…). `src/components/commerce/` — domain components (`ProductCard`,
  `CartDrawer`, `VariantSelector`…). `src/components/layout/` — chrome
  (`Header`, `Footer`, `MobileMenu`…). Each group has a barrel `index.ts`;
  groups never import sideways (`commerce` may use `ui`; nothing uses
  `commerce` except routes).
- `src/lib/` — pure modules only (`types.ts`, `format.ts`, `site.ts`,
  `cn.ts`, backend stubs). No JSX, no hooks, no state.
- `src/mocks/` — fixtures + `store.tsx`, isolated per backend-readiness.
- `src/app/globals.css` — the ONLY css file. `tests/*.test.mjs` beside it.

## Rules

1. New route → new folder under `app/` with `page.tsx`; shared route UI
   colocates as `_components/` (underscore = not a route).
2. New reusable UI → `ui/` if domain-free, `commerce/` if shop-domain,
   `layout/` if chrome. When unsure, apply component-creation.
3. Zero cross-app imports (`tuw-admin/` unreachable by rule 05).

## Good / bad

- ✅ `app/products/[slug]/page.tsx` + `_components/` for PDP sections.
- ❌ Route logic sprawling inside `components/ui/`.
- ✅ `lib/format.ts` pure `formatINR(paise)`.
- ❌ Fetch calls inside `lib/` (seams live in hooks/mocks).
