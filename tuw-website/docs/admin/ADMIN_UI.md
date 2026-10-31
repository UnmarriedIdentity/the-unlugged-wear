# Admin UI requirements

## Direction and shell

Use Urbanist and the V2 light-mode design system. Navigation is calm and information-focused. Desktop has sidebar, page header, breadcrumbs where useful, and main content. Tablet may collapse the sidebar; mobile uses an accessible navigation drawer. Keep global and page-level actions visually distinct.

## Staff preview

Provide a labelled demo session and role selector for Owner, Operations, Content and Read-only scenarios. Role-based UI visibility demonstrates future permissions; it does not provide security. Login and invitation pages simulate outcomes only.

## Screen requirements

| Area | Required UI and interactions |
|---|---|
| Overview | Revenue/order/fulfillment metrics, date selector, activity, recent orders and operational issues |
| Products | Search/filter/sort, publication badges, create/edit form, variant editor, pricing, gallery and draft/publish preview |
| Collections | Ordered product selection, title, slug and editorial image preview |
| Designs | Artwork/mockup library, print placement metadata and upload preview |
| Orders | Search, independent payment/fulfillment filters, pagination and detail drawer/page |
| Order detail | Items, immutable purchase summary, contact/address, payment, shipment, timeline and permitted demo actions |
| Fulfillment | Queued/printing/submission-failed scenarios, issue details and simulated retry |
| Shipments | Carrier/reference, timeline, status and tracking preview |
| Payments/refunds | Transaction list, payment detail and validated simulated refund dialog |
| Returns | Request detail, item/reason, approve/decline preview and refund link |
| Customers | List, profile, addresses, purchase history and notes preview |
| Support | Ticket queue, detail, response draft and simulated send |
| Content | Page/article editor, navigation ordering, media picker and publish preview |
| Reports | Date filters, labelled charts, summary tables and CSV export of mock data |
| Team | Staff list, invitation, role selection and removal confirmation |
| Settings | Editable mock forms grouped by general, brand, payments, fulfillment, shipping, taxes and notifications |

## Form conventions

Show labels, helper text, required indicators and inline errors. Product forms include name, slug, description, category, colours/sizes, mock partner mapping, artwork placement, media and publication status. Warn about unsaved changes where navigation would discard work. Keep credentials out of mock settings: integration views show connection previews, not real secret inputs.

## Tables

Use stable column definitions, explicit status labels, right-aligned amounts, selectable rows where bulk actions make sense and pagination for long lists. Preserve filters after opening and returning from an item. Provide a mobile card/list alternative or labelled horizontal scrolling when a table genuinely needs it.

## Action behaviour

Mock save/create/retry/publish actions update local data and display feedback. Deletion, cancellation, refund and staff removal use a dialog describing the affected entity. Validate refund amounts against the mock paid amount and existing refunds. Payment status and fulfillment status are separate fields.

## Failure and empty states

Include no data, no search matches, save failure, fulfillment retry failure, upload rejection, unauthorized demo role and stale form scenarios. Provide a relevant recovery action. Mock uploads should enforce documented size/type limits and remain local previews.
