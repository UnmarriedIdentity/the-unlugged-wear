# The Unplugged Wear — Admin Operations Workspace (`tuw-admin`)

A state-of-the-art operational workspace for **The Unplugged Wear** staff, built with **Next.js 16.3.8 (Turbopack)**, **React 19**, **Tailwind CSS v4**, and **TypeScript 5.7**.

This application implements the complete **Urbanist V2 Design System** matching Figma file `WmpPcdGcXerVgqNpgr6Q6S` (Node: `1-26969`), running entirely independently with deterministic mock data and realistic state mutations.

---

## ⚡ Quick Start & Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Start the local development server (Turbopack)
pnpm run dev
# Running at: http://localhost:3000

# 3. Validate TypeScript types
pnpm run typecheck

# 4. Run automated business logic tests
pnpm run test

# 5. Create an optimized production build (pre-renders all 35 routes)
pnpm run build

# 6. Start the production server
pnpm run start
```

---

## 🎨 Design System & Foundations

* **Pure Urbanist Typography**: Loaded via Google Fonts (`Urbanist:wght@300..800`). No mixing with Montserrat, Plus Jakarta Sans, or Inter.
* **9-Level Type Scale**: Defined in `src/app/globals.css`:
  * `.tuw-type-display` (40–48px / 600)
  * `.tuw-type-heading-page` (32px / 600)
  * `.tuw-type-heading-section` (24px / 600)
  * `.tuw-type-heading-subsection` (20px / 600)
  * `.tuw-type-heading-card` (18px / 600)
  * `.tuw-type-body-large` (16px / 400)
  * `.tuw-type-body-default` (14px / 400)
  * `.tuw-type-label-control` (14px / 500)
  * `.tuw-type-caption-default` (12px / 400)
* **Tabular Numerals**: `.tuw-tabular-nums` applied to right-aligned currency columns, counts, and financial tables.
* **18 Semantic Color Roles**: Canvas (`#F7F8F9`), Surface (`#FFFFFF`), Primary Text (`#262626`), Secondary Text (`#5D6772`), Subtle Border (`#E2E4E6`), Control Border (`#90979F`), Action Primary (`#7539FF`), Action Hover (`#6025DB`), Selected (`#F8F5FF`), On-Primary (`#FFFFFF`), Info (`#175CD3` / `#F4F9FE`), Success (`#187343` / `#F4FBF7`), Warning (`#856300` / `#FEFBF5`), Error (`#C91818` / `#FEF4F4`).
* **Interactive Design System Specimen**: Available in the app at [`/design-system`](file:///d:/unplugg/tuw-admin/src/app/(dashboard)/design-system/page.tsx).

---

## 🧩 Reusable UI Primitives (`src/components/ui/`)

All 19 components are implemented with zero cross-app dependencies:
* `Button`: Primary, secondary, outline, ghost, danger, link; support loading spinners, prefix/suffix icons.
* `Badge`: Info, success, warning, error, neutral, accent; with icon and dot indicators.
* `Input` & `Textarea`: Standard 44px control height, prefix/suffix icon slots, validation states.
* `Select`, `Checkbox`, `RadioGroup`, `Switch`: Fully accessible form controls.
* `Card`: Standard 12px radii, subtle borders, optional hover elevation.
* `Table`: Header, row selection, sort indicators, numeric right-alignment.
* `Modal` & `Drawer`: Restrained backdrop scrim, keyboard `Escape` trap, focus retention.
* `Tabs`, `Breadcrumb`, `Pagination`, `EmptyState`, `Skeleton`, `Tooltip`, `ImageWithFallback`, `IconButton`.

---

## 💾 Mock Data & Local State Adapter (`src/mocks/`)

* **Deterministic Baseline**: 10 products with partner fulfillment metadata, 23 orders across all combinations of payment (`paid`, `pending`, `failed`, `refunded`) and fulfillment states (`queued`, `printing`, `shipped`, `delivered`, `submission_failed`).
* **Realistic Mutations**: Products can be created/edited/archived; orders can be updated; fulfillment retried; refunds issued; team members invited; customer notes added.
* **Dynamic KPIs**: Dashboard totals in Home and Analytics calculate live from the active `orders` array (zero hardcoded totals).
* **Local Storage Schema**: Persisted under `tuw_admin_v2_state`.
* **Testing Scenarios**:
  * **Normal**: Full baseline dataset.
  * **Loading**: Simulates loading skeletons.
  * **Empty**: Tests zero-data empty states and recovery actions.
  * **Error**: Simulates partner API timeout with an actionable error banner and "Retry Connection" button.
  * **Long-Content**: Injects long multiline text to test layout resilience.
  * **Restricted-Role**: Switch between `Owner`, `Operations`, `Content`, and `Read-only` with interactive permission checks.
* **Reset Demo Action**: Located in the top header ribbon to restore baseline fixtures instantly.

---

## 🗺️ Route Directory (38 Pre-Rendered Routes)

> Full deployed URL mapping available in [**`ROUTES.md`**](file:///d:/unplugg/ROUTES.md)

* **`/dashboard`**: Official Homescreen Dashboard (dynamic KPIs, sparklines, partner status — Figma Frame `1:20300`)
* **`/`**: Root entry point (redirects to `/login`)
* **`/home`**, **`/homepage`**: Canonical redirects to `/dashboard`
* **`/login`**: Dedicated login page (Figma Frames `1:20816`, `1:20776`, `1:20725`)
* **`/signup`**: Create account page (Figma Frames `1:20984`, `1:20920`)
* **`/verify`**: 4-Digit OTP verification page (Figma Frames `1:20890`, `1:20856`)
* **`/forgot-password`**, **`/reset-password`**: Password recovery (Figma Frames `1:20710`, `1:20690`)
* **`/accept-invite`**: Staff invitation acceptance
* **`/orders`**: Order processing, filters, detail drawers, status transitions
* **`/products`**: Catalog management, partner assignment, creation modal
* **`/fulfillment`**: Partner POD sync queue, retry simulation for failed items
* **`/shipments`**: Carrier tracking and timeline events
* **`/returns`**: RMA inspection and restocking stages
* **`/refunds`**: Refund authorization and disbursement log
* **`/payments`**: Payment transaction logs & gateway captures
* **`/customers`**: Client profiles, lifetime value, staff notes
* **`/collections`**: Seasonal capsule curation
* **`/designs`**: Production artwork approval workflow
* **`/content`**: CMS hub
* **`/content/pages`**: Static page publishing
* **`/content/journal`**: Editorial stories and sustainability articles
* **`/content/navigation`**: Header and footer menu tree builder
* **`/content/media`**: Asset storage library with browser-local object previews (`<25MB` limit)
* **`/reports`**: Financial and SLA metrics with dynamic CSV export
* **`/analytics`**: Canonical redirect to `/reports`
* **`/team`**: Staff roster and role assignments
* **`/audit-log`**: Immutable security and mutation event log
* **`/support`**: Ticket resolution inbox
* **`/help`**: Canonical redirect to `/support`
* **`/settings`**, **`/settings/*`**: General, Brand, Shipping, Payments, Fulfillment, Notifications, Taxes
* **`/design-system`**: Interactive live token specimen (Figma Node `1:26969`)
