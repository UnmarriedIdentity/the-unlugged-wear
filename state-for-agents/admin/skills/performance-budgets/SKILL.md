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

## Good / bad

- ✅ `childActiveIndex(flags)` computed once per render, reused by container.
- ❌ `getIsActive()` re-evaluated per class string (15× per render).
- ✅ `backdrop-blur` confined to the open mobile drawer.
- ❌ Full-page blur wrappers stacking multiple filters.
