# Skill: Motion (admin animation system)

Global authority for every animation in the admin panel — accordion expands,
hovers, lifts, fades, drawer slides. One motion language everywhere.

## Standards

- Accordion expand: always-mounted `grid-rows-[0fr]` → `grid-rows-[1fr]` wrapper
  + `min-h-0 overflow-hidden` inner, `transition-[grid-template-rows]`
  `duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]`. Never conditional-mount
  (mounting snaps — no height to animate).
- Micro-interactions: `transition-all duration-150/200`; exact legacy timings
  via arbitraries (`duration-[180ms]`) where the spec demands them.
- Chevron/icon rotation: `rotate-180` with `transition-transform`.
- Hover lifts (`translateY(-1px)`) and scale (`scale-[1.08]`) only where the
  design already has them — never invent motion.
- `prefers-reduced-motion` global rule is load-bearing; every animation must
  degrade to instant under it.

## Good / bad

- ✅ `{open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}` around a persistent tree.
- ❌ `{open && <Tree/>}` (appears suddenly — nothing to transition).
- ✅ `duration-[180ms]` preserving a legacy `0.18s` toggle feel.
- ❌ `duration-200` "close enough" on a specified timing.
- ✅ `hover:-translate-y-0.5` only where a legacy design specifies lift and no B1 non-displacing treatment has replaced it.
- ❌ Adding entrance animations to static content.

## Data changes (B1 — charts, lists, feeds)

- When data changes identity (range switch, filter, live refresh), prefer
  stable keys + value transitions (height/width/opacity on persistent nodes)
  over unmount/remount. Mounts pop in; unmounts vanish — neither animates.
- Pad variable-length feeds to a fixed slot pool with zero-states (blank
  labels, suppressed tooltips) so enter AND exit travel through the same CSS
  transition — including to/from zero. Key slots by index, never by label.
- Never rely on mount/unmount to animate a data change.

## Hover language (B1 — dense admin surfaces)

- Hover feedback must be non-displacing: border tint, background wash,
  in-place zoom (overflow-hidden thumb + image scale), glow, shadow.
- No translate/float lifts on cards, rows, or bars — displacement on dense
  surfaces reads as instability, not delight. Reserve translate for state
  changes (popover travel, drawer slides, selection moves).
- Continuous/infinite motion (marching ants, perpetual pulse) is reserved
  for progress and drop targets — never for resting cards or rows.

## Exit choreography (B1 — closes)

- Closes play the reverse curve, then unmount (`usePopoverAnimation`):
  exit faster than enter (150ms in / 180ms out is the house ratio), same
  transform path mirrored.
- Under `prefers-reduced-motion`, exits collapse to instant unmount —
  never leave a dead timer wait.

## Good / bad (B1 additions)

- ✅ Index-keyed bar slots that shrink to zero and grow back on range switch.
- ❌ Label-keyed bars that pop out and pop in when the feed changes shape.
- ✅ Card hover that tints the border and washes the background in place.
- ❌ Card hover that floats the whole card upward.
- ✅ `requestClose()` → exit curve → unmount → parent state sync.
- ❌ Flipping the open flag and letting the tree vanish mid-frame.
