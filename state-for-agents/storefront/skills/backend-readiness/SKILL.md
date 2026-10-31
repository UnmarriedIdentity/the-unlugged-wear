# Skill: Backend Readiness (UI that survives a real backend)

Global authority for keeping the storefront pluggable: a proper backend
arrives later, and the UI must not need rewrites to meet it. Cart splits
explicitly: server-ownable data flows through seams; device-local UI state
stays frontend.

## Rules

1. Mock adapters stay isolated in `src/mocks/` (fixtures + `store.tsx`);
   components consume them through narrow hooks (`useStore`), never direct
   fixture imports in deep leaves. `src/api/` stubs mark where handlers will
   land — no live integrations as shortcuts.
2. Money: integer minor units end-to-end (paise: `priceMinorINR`);
   display converts only (`formatINR`). Never floats for amounts.
3. Cart identity is structural: variant key (`productId-color-size`) —
   no duplicate lines, quantities merge on key match.
4. Mutations go through named store actions (cart add/update/remove, wishlist
   toggle, address save, order place, return request), with explicit
   demo-truth copy ("Demo checkout sandbox — no payment will be collected")
   and input preservation on failure.
5. Every mutation path keeps a reset-demo action (`resetStoreData()`)
   clearing its namespaced keys (`tuw_website_v2_*`) and restoring fixtures.
6. Auth stays stub-first (`supabase.ts` stub → session hook shape); login and
   signup must work fully against the mock seam so the backend swap is
   adapter-only. Identities stay fictitious (`@example.com`, Indian mobiles).
   Never commit secrets or real customer data.

## Good / bad

- ✅ `addToCart(productId, color, size, qtyMinor)` merging on variant key.
- ❌ `cartTotal - discount > 0` in floating rupees inside a component.
- ✅ `resetStoreData()` clearing `tuw_website_v2_*` + fixtures restore.
- ❌ Fetching live endpoints "temporarily" to preview interactions.

## Known landmines (verify before trusting)

- Promo-code drift: tests cite `UNPLUG10`; the store honors
  `UNPLUGGED10`/`MINIMAL10`. Reconcile before building promos.
- Tests re-implement logic instead of importing `src/` — strengthen to
  adapter-level tests when touching those seams.
