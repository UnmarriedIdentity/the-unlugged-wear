# Skill: Performance Budgets (admin UI stays fast)

Global authority for keeping interactions and builds within budget.

## Rules

1. Derive, don't recompute: memoize per-render flag arrays (e.g. active-path
   predicates); keep `useState` initializers pure and cheap.
2. Storage discipline: read `localStorage` once per mount (client-only effect),
   write on explicit transitions only — never per keystroke or per render.
3. Icons: import named lucide icons per file; never barrel-import the set.
   Decorative images get explicit dimensions + `priority` only above the fold.
4. Animation paint cost: prefer `transform`/`opacity`-only motion; blur and
   backdrop filters are budgeted per surface (backdrop once per open drawer).
5. Accordion/tree content stays mounted only where animation needs it;
   long lists virtualize past ~100 rows (plan before implementing).
6. Build stays green and fast: `typecheck` + `test` + `build` per block;
   investigate any step exceeding prior baselines before committing.

## Speed budgets (p75, measured on `next build && next start`)

| Metric | Budget | How it is met |
|---|---|---|
| TTFB (time to first byte) | ≤ 800 ms for staff pages (dynamic by design) | Static shell from Cache Components; DB calls only inside Suspense holes; no `await` at the top of layouts |
| FCP | ≤ 1.5 s | Shell has no blocking scripts; fonts `display: swap` via `next/font` |
| LCP | ≤ 2.5 s on desktop broadband | LCP image in the shell, `next/image` with `priority` + real `sizes`; no LCP element inside a Suspense hole |
| INP (time to respond to the first and every interaction) | ≤ 200 ms | Small client leaves; no heavy work in click handlers; `useOptimistic` for instant feedback |
| TBT (lab) | ≤ 200 ms | First-load JS per route ≤ 170 KB gzip; split rarely used widgets with `next/dynamic` |
| CLS | ≤ 0.1 | Fixed image boxes; Suspense fallbacks the same size as content; no late banners |

Measure each route that changed: Lighthouse (mobile for storefront,
desktop for admin) on the production build, the route size table from
`next build`, and `useReportWebVitals` logs in dev. Over budget = not done;
log the numbers in the task.

## Good / bad

- ✅ PDP LCP 1.9 s, INP 120 ms, CLS 0.02 logged in the task before closing it.
- ❌ "Feels fast locally" with only `next dev` numbers.

- ✅ `childActiveIndex(flags)` computed once per render, reused by container.
- ❌ `getIsActive()` re-evaluated per class string (15× per render).
- ✅ `backdrop-blur` confined to the open mobile drawer.
- ❌ Full-page blur wrappers stacking multiple filters.

## Changelog

- 2026-11-10: added the speed budgets table (TTFB, FCP, LCP, INP, TBT, CLS) — owner request.
