# Skill: Utility-First JSX (Tailwind v4 in `className`)

Global authority for writing component markup with utilities instead of custom
CSS in `tuw-website`.

## Rules

1. Layout/spacing/type/color/radius/shadow come from tokens or the framework
   scale — never hex codes, never `[...]` arbitraries, except documented
   geometry: Figma fractions, px art (clamps, gradients, fixed art boxes),
   and size-only type without declared line-height.
2. Scale-native values need no tokens: bare multiples of `--spacing`.
3. State overrides use **ternary class swaps** (`active ? 'bg-X …' :
   'bg-Y …'`). Never a base utility plus a conditional same-property utility —
   same-layer order is uncontrolled. The ternary must enumerate ALL
   state-varying properties **including `bg-*`**.
4. Lucide icons: `color="currentColor"` + `className="text-<token>"` (never hex
   props). Inline `style`: colors only as token `var()`; geometry stays
   until its block pass.
5. `cn()` merges conditional branches (see tasks: `cn.ts` wiring follow-up);
   IDs, handlers, state logic, copy, and `next/image` props stay untouched
   during conversion.

## Good / bad

- ✅ `className="flex … border-store-line …"` (scale + role token).
- ❌ `className="flex h-[52px] … border-[#E9E9E9]"` (arbitrary + hex).
- ✅ `${selected ? 'bg-store-accent …' : 'bg-white …'}` (full ternary).
- ❌ `bg-white ${selected && 'bg-store-accent'}` (order decides, not you).
- ✅ `<Check color="currentColor" className="text-white" />`.
- ❌ `<Check color="#FFFFFF" />`.
