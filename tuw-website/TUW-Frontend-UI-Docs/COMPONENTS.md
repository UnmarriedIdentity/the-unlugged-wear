# Component inventory

Maintain separate component implementations in each application's `src/components/`. Reuse within an app first. Do not import source files directly from the other application.

## Foundations for both applications

Button/link button; text field; textarea; select/combobox; checkbox; radio group; switch; badge; dialog; drawer; disclosure; tabs; tooltip; toast; pagination; breadcrumb; skeleton; empty/error state; image with fallback; accessible icon button.

## Website components

- Layout: header, footer, desktop navigation, mobile menu and announcement area only if needed.
- Catalog: product card/grid, collection card, filter controls/drawer, sort selector, result count and colour swatch.
- Product: gallery, size selector, quantity selector, price, availability message, size-guide dialog and information disclosures.
- Shopping: cart item, cart drawer, order summary, address form, checkout step indicator and payment simulation panel.
- Account: profile form, address card/editor, order card/detail, return request form and account navigation.
- Editorial: hero, image/text section, journal card/article body, FAQ disclosure and policy layout.

## Admin components

- Layout: sidebar, mobile navigation, page header, breadcrumb and action bar.
- Data: table, column header/sort, row selection, filter bar, bulk action bar and pagination.
- Reporting: metric card, chart container with labels, date filter and equivalent summary table.
- Forms: field wrapper, product/variant editor, media picker, upload preview, validation summary and unsaved-change notice.
- Operations: status badge, order timeline, customer summary, fulfillment issue card, payment/refund summary and activity entry.
- Feedback: confirmation dialog, save indicator, permission preview and action result toast.

## Component contract

For each reusable component document its purpose, props, variants, states, keyboard behaviour and responsive layout. Prefer semantic controls and accessible established primitives. Controls must have accessible names; support loading without duplicate submissions. Do not create separate components for every colour if a semantic variant is sufficient.

## Illustrative variants

Buttons: primary, secondary, subtle, destructive; regular and compact sizing. Badges: neutral, info, success, warning, error. Fields: default, invalid, disabled, read-only. Tables: populated, loading, empty and error. Dialogs: informational, confirmation and form.

## Organisation

Small UI primitives belong under `components/ui/`. Domain-specific composites belong under the relevant component or feature folder. Routes assemble components rather than owning all rendering and mock state logic.
