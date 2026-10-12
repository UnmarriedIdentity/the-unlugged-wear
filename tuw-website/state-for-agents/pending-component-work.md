# Pending component work (replacement debt)

Explicit inventory of storefront blocks that NO existing component can absorb
pixel-perfect today. Nothing here authorizes building — each entry names the
future custom component so a later track can construct exactly this list.
Updated per page as audited. Rule: never force-fit these into an existing
primitive; that would restyle the page by accident.

Status key: `raw` = hand-written JSX + inline styles; `partial` = shell
primitive + raw interior; `done` = migrated + browser-verified.

## Existing primitives (no work needed)

`ui/`: Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Badge,
Modal, Drawer, Disclosure, Tabs, Tooltip, Pagination, Breadcrumb, Skeleton,
EmptyState, ImageWithFallback, IconButton (19, barrel-exported).
`commerce/`: ProductCard, ProductGrid, CollectionCard, FilterBar,
ProductGallery, VariantSelector, SizeGuideModal, PaymentSimulationPanel (8).
`layout/`: Header, Footer, AnnouncementBar, MobileMenu, CartDrawer (5).
No `Card` component exists yet although root AGENTS.md §4 lists it — see tasks.

## Template (per page/route)

```md
## <Route> (`<path>`)
| Block | Status | Why no existing component fits | Future component |
|---|---|---|---|
| ... | raw/partial | ... | ... |
Done here (existing components): ...
```

## Global exclusions (verify before listing as debt)

- Native `<select>` vs `ui/Select`: metric mismatch to be audited per site.
- Raw `<textarea>` vs `ui/Textarea`: per-site metrics vary.
- `cn.ts` is a naive join stub — `clsx` + `tailwind-merge` installed but unwired.
- Tests re-implement logic instead of importing `src/` — see tasks.
- Promo-code drift: tests cite `UNPLUG10`; store honors `UNPLUGGED10`/`MINIMAL10`.
