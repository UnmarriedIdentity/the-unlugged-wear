# Skill: Decorative Graphics (washes, art, editorial treatments)

Global authority for non-utility visuals: gradient overlays, ambient washes,
editorial artwork. Used anywhere such treatments appear — the image-led
storefront needs this skill more than any other surface.

## Patterns

- Overlay boxes must coincide exactly with what they cover (same
  `left`/`width`/span) or seams and double-darkening appear.
- Art gradients (lookbook heroes, campaign washes): retained custom CSS or a
  single gradient utility; never approximated with flat colors.
- Segmented coloring: container-indexed `:nth-child` ranges; verify child
  counts — extra element children silently shift every range.
- z-order contract: base < content < accent (topmost) — an accent-colored bar
  over a card means the card lost its stacking, not that geometry is wrong.

## Good / bad

- ✅ Lookbook hero overlay exactly covering the image it shades.
- ❌ `height: calc(50% + 6px)` where the box can resolve against indefinite
  heights — prefer anchored `top`/`bottom` pairs.
- ✅ Campaign wash kept as a multi-stop gradient, not flattened.
- ❌ Widening/narrowing art to "fix" a stacking bug (fix z-order instead).

## Case log

- (Seed: first editorial-graphics incident lands here with route + evidence.)
