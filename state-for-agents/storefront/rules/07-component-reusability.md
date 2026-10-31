# Rule 07 — Component Reusability & DRY Architecture (inviolable)

Never create ad-hoc inline duplicates of UI elements that repeat across pages, templates, or views. Every recurring UI section, block, card, or interaction pattern must be abstracted into a clean, atomic, reusable component.

## Principles

1. **DRY (Don't Repeat Yourself)**:
   - If a layout block, card, quote, review widget, specification table, or button group appears more than once — or is designed to appear across multiple product templates, editorial pages, or routes — it MUST be authored as a reusable component.
   - Never copy-paste 50+ lines of JSX into multiple page files.
2. **Layered Directory Organization**:
   - `src/components/ui/`: Atomic, domain-free UI primitives (`Button`, `Badge`, `Input`, `Modal`, `Drawer`, `Select`, `Breadcrumb`).
   - `src/components/commerce/`: Commerce-specific domain components (`ProductCard`, `ProductGallery`, `ColorSwatchSelector`, `VariantPillSelector`, `RadioOptionSelector`, `DynamicDataTable`, `DynamicAccordionFaq`).
   - `src/components/editorial/`: Brand editorial and storytelling blocks (`EditorialQuote`, `EditorialFeatureSplit`, `LifestyleBanner`).
   - `src/components/layout/`: Chrome and shell components (`Header`, `Footer`, `CartDrawer`).
3. **Props-In, Render-Out Contract**:
   - Reusable components must receive their content via typed props (`Product`, `ReviewItem[]`, `quote`, `title`, `imageSrc`).
   - Reusable components must never import mock fixtures directly or couple themselves to a single hardcoded page route.
   - Always accept an optional `className?: string` prop for layout composition.
4. **Conditional Guard Invariant**:
   - Reusable components must safely guard against empty/null data and return `null` when their essential data is missing, completely omitting themselves and their outer wrappers from the DOM without phantom spacing.

## Good / Bad Examples

- ✅ Extracting the Quote Card into `<EditorialQuote quote="..." author="..." />` and reusing it on PDP and About Us.
- ✅ Extracting the "Products made with love" split section into `<EditorialFeatureSplit title="..." body="..." imageSrc="..." />`.
- ❌ Copy-pasting 80 lines of customer review cards directly into `products/[slug]/page.tsx` and repeating it in `shop/page.tsx`.
- ❌ Re-writing custom table markup for every new product instead of feeding polymorphic column/row schemas to `<DynamicDataTable />`.

## Enforcement

Every agent session and work report must state:
`component-reusability: <reusable components created/consumed and verified DRY>`.
A task that introduces repeated inline JSX where a reusable component should exist violates this rule.

