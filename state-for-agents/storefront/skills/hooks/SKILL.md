# Skill: Hooks (when custom, naming, seams)

Global authority for custom hooks in `tuw-website`. Hooks are the seam layer
between mock adapters today and backend handlers tomorrow.

## When to create one

1. Shared stateful logic with 2+ consumers (cart totals, filter state,
   pagination cursors, session shape) — not one-off component state.
2. Backend seams: every mock read/mutation the UI needs flows through a
   named hook (`useStore` today; per-domain seam hooks as surfaces grow),
   so the backend swap re-points hooks, never components.
3. Never fetch inside components — data arrives via hooks; loading/empty/
   error states render from hook return values.

## Naming and placement

- `useX` camelCase (`useStore`, `useCartTotals`, `usePagination`); files
  colocate with their surface (`_components/useX.ts`) until a second
  consumer appears, then promote to a shared location.
- Hook returns are data + named actions (`{ items, addItem, clear }`),
  never raw setters passed down three levels.
- Money crossing a hook boundary is minor units; display converts at render.

## Good / bad

- ✅ `usePagination(items)` returning `{ page, pageSize, pageItems, setPage }`
  shared by shop grid and journal list.
- ❌ `useState` + slice math copy-pasted in two routes.
- ✅ Components calling `addToCart(...)` from the seam hook.
- ❌ `fetch('/api/cart')` inside `ProductCard`.
