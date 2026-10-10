# Pending component work (replacement debt)

Explicit inventory of page blocks that NO existing component can absorb
pixel-perfect today. Nothing here authorizes building — each entry names
the future custom component so a later track can construct exactly this
list. Updated per page as audited. Rule: never force-fit these into an
existing primitive; that would restyle the page by accident.

Status key: `raw` = hand-written JSX + inline styles; `partial` = shell
primitive + raw interior.

## Orders page (`orders/_components/OrdersView.tsx`)

| Block | Status | Why no existing component fits | Future component |
|---|---|---|---|
| Page header layout (title + subtitle + actions row) | done | `ui/PageHeader(title, subtitle?, actions?, eyebrow?, page|doc)` — 25 call sites, subtitles dropped, dashboard unified, doc variant for design-system | PH1+PHMIG |
| Order detail drawer sections (status pills, items, financial summary, address, timeline) | raw | Drawer shell is primitive; interior blocks are bespoke per workflow | `DrawerSection`, `KeyValueList`, `Timeline` |
| Create-order form grid | partial | `Modal` + `Input` primitive; raw `<select>`s (40px vs `ui/Select` 42px — verified mismatch) | `FormSelect` (40px treatment) |
| Refund form grid | partial | Same select mismatch + validated-amount box | `FormSelect` |
| Empty table row text | raw (deliberate) | `EmptyState` would restyle it (48px pad + icon + CTA vs plain centered text); pinned at inherited 16px | Keep raw unless empty-state standardization is approved |
| Filter label spans (`Payment:` / `Fulfillment:`) | raw | Typography labels, not components | Fold into `FilterPills` labeled-group variant later if desired |

Done here (existing components): `StatCard` strip, `ContentCard` shells,
`Button` (Export/Create/Details/modal footers), `Badge` pills, `Input`
search, `Pagination`, `Drawer`/`Modal` shells, `FilterPills` filter
groups (O-P1), `Table` family table (O-T1), universal 16px/700 headers
(TBL-1).

## Template (next pages)

```md
## <Page> (`<path>`)
| Block | Status | Why no existing component fits | Future component |
|---|---|---|---|
| ... | raw/partial | ... | ... |
Done here (existing components): ...
```

## Global exclusions (verified, not debt)

- Raw `<select>` (40px) vs `ui/Select` (42px): metric mismatch, all pages.
- Raw `<textarea>` vs `ui/Textarea`: per-site metrics vary.
- Hand-rolled tab strips vs `ui/Tabs`: different treatment.
- `MetricSparkline`: zero consumers — retire, don't migrate.
- Dashboard `home-*` treatments: frozen by design, never force-fit into `ui/*`.
