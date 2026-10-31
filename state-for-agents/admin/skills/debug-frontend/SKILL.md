# Skill: Debug Frontend (diagnosis playbook)

Global authority for diagnosing visual defects without guessing.

## Playbook (in order)

1. **Reconcile the build first.** Confirm the running code contains the fix:
   compare deployed tip vs branch tip; rebuild + hard refresh before any
   forensics. Stale builds have mimicked real bugs repeatedly.
2. **Prove utility generation at selector level** (`\.util\{` escaped) in built
   production CSS. Substring counts are invalid (token definitions contaminate
   them). A missing utility falls back to `currentColor`/transparent — black
   borders and invisible boxes are the classic symptoms.
3. **Paint order before geometry.** For stray marks: list every painter (element
   + pseudos) with `position`, `z-index`, and box; explicit `z-1` beats `z-auto`
   regardless of DOM order. Fix stacking, not sizes.
4. **State determinism.** Hydration mismatches come from server/client-divergent
   initializers (`localStorage` in `useState`, `Date.now()`, locale formatting).
   Initialize deterministically; hydrate client-only in effects.
5. **Counting traps.** `:nth-child` counts element children only; extra wrapper
   divs silently shift ranges. SSR-render the route and count hooks/classes.
6. **Specificity arithmetic.** Compare `(ids, classes, elements)` tuples;
   equal specificity resolves by source order — never rely on it, use
   ternaries or stronger selectors deliberately.

## Good / bad

- ✅ "`.bg-primary` absent in built CSS → transparent logo box" (proven, fixed).
- ❌ "Maybe the radius is wrong" without measuring a single box.
- ✅ SSR HTML class audit proving exactly one `navStemTo{idx}`.
- ❌ Editing geometry three times for a stacking bug.
