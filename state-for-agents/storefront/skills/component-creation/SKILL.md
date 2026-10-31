# Skill: Component Creation (what qualifies, how to build, backend fit)

Global authority for creating components in `tuw-website` without ever
consulting another app. Clean, scalable, backend-attachable by construction.

## What qualifies as a base component (`ui/`)

1. Used 3+ times, OR encapsulates one token-level treatment (a radius, wash,
   focus ring) reused as a unit — e.g. `Button`, `Badge`, `Price`.
2. Pure props-in/render-out; zero domain knowledge (no product/cart/auth
   concepts); no mock imports, ever.
3. Carries its own states: loading, empty, error, disabled, focus — a base
   component that only renders the happy path is unfinished.

## Composed vs commerce

- Composed components assemble bases for one surface (checkout summary,
  auth form shell) — still props-fed, still mock-free.
- `commerce/` components are domain-aware (`ProductCard`, `CartDrawer`,
  `VariantSelector`) but stay props-fed: data arrives via props or seam
  hooks, never direct fixture imports in leaves.

## Creation checklist

1. Props interface first (required vs optional, defaults documented).
2. Token-only styling (theme-tokens); keyboard + ARIA from the first commit.
3. Demo-truth copy wherever an action is simulated (root AGENTS.md §5).
4. Barrel-export in the group `index.ts`; PascalCase file matching the export.
5. Paginate/stream past ~100 rows (plan before implementing); stable keys.

## Backend-attachability gates (must all hold before `done`)

- Narrow hook seams (hooks skill); minor-unit money; pagination adapters.
- Local state namespaced (`tuw_website_v2_*`) with a reset path.
- No fetch in leaves; no live endpoints as shortcuts (backend-readiness).

## Good / bad

- ✅ `Price({ minorINR })` converting paise at render, used by card/PDP/cart.
- ❌ `ProductCard` importing `STORE_PRODUCTS` directly in its leaf file.
- ✅ `CartDrawer` rendering `CartLine` rows keyed by variant key.
- ❌ New `SpecialPrice` duplicating `Price` for one route.
