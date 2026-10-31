# Skill: Responsive System (breakpoints + width standards)

Global authority for adaptive layout in the storefront.

## Standards

- Breakpoints: Tailwind defaults (`md:` 768, `lg:` 1024); non-standard widths
  use arbitrary variants (`max-[900px]:`); pixel-perfect matrix is
  360 / 768 / 1024 / 1440px+ (root AGENTS.md §7).
- Product grids reflow column counts down the matrix (never horizontal scroll
  for catalog); the cart drawer overlays on mobile with viewport caps.
- Conditional widths must be **ternary-exclusive**: variant rules beat
  unprefixed regardless of order, so additive (base + conditional same
  property) is a silent conflict.
- PDP gallery, cart drawer, and mobile menu ignore desktop chrome state.

## Good / bad

- ✅ `{open ? 'grid-cols-3 …' : 'grid-cols-4 …'}` (mutually exclusive).
- ❌ Base columns + conditional override of the same property.
- ✅ `max-[900px]:` for a 900px Figma breakpoint.
- ❌ `md:` approximating a 900px spec (768 ≠ 900).
