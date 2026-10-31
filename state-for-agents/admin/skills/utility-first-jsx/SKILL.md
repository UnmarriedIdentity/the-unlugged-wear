# Skill: Utility-First JSX (Tailwind v4 in `className`)

Global authority for writing component markup with utilities instead of custom
CSS in `tuw-admin`.

## Rules

1. Layout/spacing/type/color/radius/shadow come from tokens or the framework
   scale — never hex codes, never `[...]` arbitraries, except documented
   geometry: Figma fractions (`49.444%`), px art (clamps, gradients, fixed art
   boxes like `27px` monograms), and size-only type without declared
   line-height (`text-[14px]`, `text-[24px]`).
2. Scale-native values need no tokens: bare multiples of `--spacing`
   (`h-13` = 52px, `px-3.5` = 14px, `h-4.5` = 18px, `gap-2.5` = 10px,
   `pb-17` = 68px, `w-65` = 260px, `w-55` = 220px).
3. State overrides use **ternary class swaps** (`active ? 'bg-X …' :
   'bg-Y …'`). Never a base utility plus a conditional same-property utility —
   same-layer order is uncontrolled (this exact bug once made checked
   checkboxes and error states invisible). The ternary must enumerate ALL
   state-varying properties **including `bg-*`**.
4. Lucide icons: `color="currentColor"` + `className="text-<token>"` (never hex
   props). Inline `style`: colors only as `var(--color-*)`; geometry stays
   until its block pass.
5. `cn()` merges conditional branches; IDs, handlers, state logic, copy
   (incl. typos), and `next/image` props stay untouched during conversion.

## Good / bad

- ✅ `className="flex h-13 … border-auth-line …"` (scale + role token).
- ❌ `className="flex h-[52px] … border-[#E9E9E9]"` (arbitrary + hex).
- ✅ `${active ? 'bg-auth-teal border-auth-teal' : 'bg-white border-auth-terms-line'}`.
- ❌ `bg-white ${active && 'bg-auth-teal'}` (white sorts last — fill never shows).
- ✅ `<Check color="currentColor" className="text-white" />`.
- ❌ `<Check color="#FFFFFF" />`.
