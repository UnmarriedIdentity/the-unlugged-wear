# Skill: Motion (storefront animation system)

Global authority for every animation in the storefront — drawer slides,
hovers, fades, accordions, gallery transitions. One motion language everywhere.

> **PROVISIONAL — Figma pending.** Timings below are ported working values,
> NOT finalized motion design. If Figma motion references demand different
> curves or durations, update this skill first (per skill-maintenance), then
> retime. Do not present these numbers as final.

## Standards

- Drawer/overlay panels: slide travel with faster-out exit; render follows
  visibility so exits complete before unmount.
- Micro-interactions: `transition-all duration-150/200`; exact spec timings
  via arbitraries (`duration-[180ms]`) where demanded.
- Chevron/icon rotation: `rotate-180` with `transition-transform`.
- Hover feedback must be non-displacing: border tint, background wash, glow,
  shadow. No translate/float lifts — displacement reads as instability.
  Reserve translate for state changes (drawer slides, selection moves).
- `prefers-reduced-motion` global rule is load-bearing; every animation must
  degrade to instant under it.

## Data changes (grids, feeds, cart lines)

- When data changes identity (filter, pagination, cart update), prefer stable
  keys + value transitions on persistent nodes over unmount/remount. Mounts
  pop in; unmounts vanish — neither animates.
- Never rely on mount/unmount to animate a data change.

## Good / bad

- ✅ Persistent `CartLine` keyed by variant key, quantities transition in place.
- ❌ Label-keyed rows that pop out and pop in when the cart changes shape.
- ✅ Hover that tints the border and washes the background in place.
- ❌ Card hover that floats the whole card upward.
- ✅ Exit curve → unmount → parent state sync.
- ❌ Flipping the open flag and letting the tree vanish mid-frame.
