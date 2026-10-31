# Skill: Performance Budgets (storefront UI stays fast)

Global authority for keeping interactions and builds within budget.

## Rules

1. Derive, don't recompute: memoize per-render flag arrays; keep `useState`
   initializers pure and cheap.
2. Storage discipline: read `localStorage` once per mount (client-only effect),
   write on explicit transitions only — never per keystroke or per render.
   Keys stay namespaced (`tuw_website_v2_*`).
3. Icons: import named lucide icons per file; never barrel-import the set.
   Product imagery gets explicit dimensions + `priority` only above the fold
   (PDP hero); below-fold grids lazy-load.
4. Animation paint cost: prefer `transform`/`opacity`-only motion; blur and
   backdrop filters are budgeted per surface.
5. Long catalog/journal lists paginate past ~100 rows (plan before implementing).
6. Build stays green and fast: `typecheck` + `test` + `build` per block;
   investigate any step exceeding prior baselines before committing.

## Good / bad

- ✅ Cart totals derived once per render from minor-unit lines.
- ❌ Recomputing totals per line item per render.
- ✅ `backdrop-blur` confined to one open surface at a time.
- ❌ Full-page blur wrappers stacking multiple filters.
