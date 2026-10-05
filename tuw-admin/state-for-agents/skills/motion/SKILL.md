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
- ✅ `hover:-translate-y-0.5` where the card design specifies lift.
- ❌ Adding entrance animations to static content.
