# Skill: Decorative Graphics (stems, curves, washes, art)

Global authority for non-utility visuals: tree guides, gradient overlays,
ambient washes, brand artwork. Used anywhere such treatments appear.

## Patterns

- Tree stems/curves/overlays: pseudo-elements with `calc()` geometry and token
  colors (`nav-guide`, `nav-guide-active`); overlay boxes must coincide exactly
  with what they cover (same `left`/`width`/span) or seams and double-darkening
  appear. z-order contract: base stem (z-1, earlier) < card/row content <
  accent (z-2, topmost) — an accent-colored bar over a white card means the
  card lost its stacking, not that geometry is wrong.
- Segmented coloring: container-indexed `:nth-child` ranges
  (`.navStemTo2 > :nth-child(-n+3)::after`); verify child counts — extra element
  children silently shift every range.
- Art gradients (hero overlay, form washes): retained custom CSS or a single
  `bg-[radial-gradient(...)]`; never approximated with flat colors.

## Good / bad

- ✅ Overlay `top:-6px; bottom:0` exactly covering the gap it bridges.
- ❌ `height: calc(50% + 6px)` where the box can resolve against indefinite
  heights — prefer anchored `top`/`bottom` pairs.
- ✅ Terminal overlay deleted when it painted over the active card.
- ❌ Widening/narrowing art to "fix" a stacking bug (fix z-order instead).

## Case log: sidebar trunk saga

Successive fixes, each verified before the next: full-box overlaps for gapless
trunks → terminal-bar deletion (paint-over-card) → trunk/arm border-color
split (light curve covered dark trunk at higher z) → white-card `z-1` lift
(stem painted over `z-auto` cards) → continuous-geometry proof → overlay
bounding. Lesson encoded above: diagnose paint order before geometry.
