# Rule 00 — Pixel-Perfect (inviolable)

Every UI change must render byte-identically to the approved design except the
explicitly ordered delta. Tolerance is zero: one moved pixel fails the task.

## Protocol

1. Before deleting/replacing any style, record the computed values that matter
   (box metrics, color, type, spacing, radius, shadow, z-order) from a current build.
2. After the change, re-capture the same values on the same routes, states, and
   breakpoints (360 / 768 / 1024 / 1440px minimum, plus component `?state=` variants).
3. Any single differing pixel fails the pass — fix at the found fault, never by
   adjusting surrounding values to compensate (except explicitly ordered geometry
   such as border-for-padding swaps, which must be documented in the commit).

## Good / bad

- ✅ Replacing `border-radius: 10px` with `rounded-nav` (`--radius-nav: 10px`).
- ❌ Replacing `padding: 8px 12px` with `p-3` (12px vs 8px top — different box).
- ❌ "Close enough" screenshots without computed-style comparison.

## Enforcement

Every work report must state: "pixel-perfect: <how verified — computed capture
and/or screenshot matrix>". A report without it is incomplete.
