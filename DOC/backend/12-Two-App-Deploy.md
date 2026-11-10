# UI Merge & Single Deploy — Groups, Isolation, Sequence

> Status: Filling | Last Updated: 2026-10-15
> Goal: one URL, one deploy, zero style/logic cross-load. Non-goal: no
> visual redesign during the move — pixel-parity per route is the
> acceptance bar. Gate spec: `14-Single-URL-Gating.md`.

## Canonical merged tree (`tuw-admin/` after merge)

```
src/
  middleware.ts                    ← role gate (file 14 matcher map)
  app/
    layout.tsx                     ← html shell + reset CSS only (no tokens, no fonts)
    globals.css                    ← reset + Tailwind core only
    providers.tsx                  ← admin providers (storefront wraps its own)
    api/<domain>/route.ts          ← thin handlers, no /v1 (file 13)
    (admin)/
      layout.tsx                   ← Urbanist (next/font) + admin-tokens scope
      admin-tokens.module.css      ← .scope { --tuw-*: … } — admin routes only
      dashboard/ orders/ products/ fulfillment/ customers/ content/
      settings/ team/ support/ reports/ refunds/ returns/ shipments/ ...
    (storefront)/
      layout.tsx                   ← editorial stack (next/font) + store-tokens scope
      store-tokens.module.css      ← .scope { --store-*: … } — storefront only
      page.tsx  products/ cart/ checkout/ account/ journal/ faq/ ...
  components/
    ui/ dashboard/ layout/ ...     ← admin's, frozen
    storefront/                    ← website components/ (ui/, commerce/ inside)
  lib/ (+ storefront/) · hooks/ · mocks/ (+ storefront/) · server/ · tests/
```

`server/` tree and repo map: `00-README.md`. Route contracts: file 13.

## CSS isolation spec (separate stylesheets, zero cross-load)

- Root global holds reset + Tailwind core only (deduped utilities,
  cached across both experiences — splitting it would duplicate bytes).
- Each group layout imports its token module and wraps its tree in
  `.scope`; custom properties cascade to descendants, so modules resolve
  tokens within scope. Next splits modules per route: storefront HTML
  never contains the admin scope element and never downloads
  `admin-tokens.module.css` (and vice versa).
- Fonts via `next/font` per group layout — Urbanist downloads on admin
  routes only, editorial on storefront only. Global font `<link>`s die.
- Portal safety: drawers/menus/overlays render inside the React tree
  under the scope wrapper — tokens inherit, no orphan styling.
- Per-route proof: network panel shows only that experience's token
  sheet + font; visual pass against pre-merge screenshots.

## Namespace & import law

- Same-name dirs nest, never merge (`lib/storefront/`,
  `mocks/storefront/`, `components/storefront/`); admin originals never
  move. No file is ever overwritten by the move.
- Nothing in `(admin)` imports from `(storefront)` and vice versa —
  today's zero-cross-import law restated as directory law (directional
  lint later).
- `server/` is UI-free; UI never imports `server/` (`server-only`
  enforcement). `api/` is logic-free (~30-line handler limit).

## Migration sequence (each step independently shippable)

1. Create groups; move one low-risk storefront route (FAQ) → gates +
   network + visual proof.
2. Remaining storefront routes in batches → per-batch commits + proofs.
3. Token-module extraction + font split → per-route network proof.
4. Middleware gate on `/dashboard/*` + `/api/admin/*` (file 14).
5. Delete `tuw-website/` only after every route proves parity + isolation.

## Rollback rule

Each step is one commit; a failed proof reverts that step alone — never
the batch. The old app keeps serving until step 5 lands.
