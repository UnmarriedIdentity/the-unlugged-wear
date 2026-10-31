# Skill: Responsive System (breakpoints + width standards)

Global authority for adaptive layout in the admin panel.

## Standards

- Sidebar rail: 240px desktop (`w-60`), 220px tablet 768–1024 (`md:w-55`),
  80px collapsed rail (`w-20`, all sizes), 290px overlay drawer on mobile
  (`max-md:`, `86vw` cap). Main offsets track exactly (`ml-60/md:ml-55/lg:ml-60`,
  `ml-20`, `max-md:ml-0`).
- Breakpoints: Tailwind defaults (`md:` 768, `lg:` 1024); non-standard widths
  use arbitrary variants (`max-[900px]:`, signup `@media 900px` port).
- Collapsed/responsive/conditional widths must be **ternary-exclusive**:
  variant rules beat unprefixed regardless of order, so additive
  (`w-60` + conditional `w-20`) is a silent conflict.
- Drawer pattern: `fixed` + translate in/out + backdrop + Escape/scroll-lock;
  drawer ignores collapse state.

## Good / bad

- ✅ `isCollapsed ? 'w-20 …' : 'w-60 md:w-55 lg:w-60 …'` (mutually exclusive).
- ❌ `w-60` base + `isCollapsed && 'w-20'` (variant/base order decides, not you).
- ✅ `max-[900px]:h-[320px]` for a 900px Figma breakpoint.
- ❌ `md:` approximating a 900px spec (768 ≠ 900).
