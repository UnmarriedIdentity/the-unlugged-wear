# The Unplugged Wear — Route Directory

> **One app, two surfaces**: the storefront at the root and the admin panel under `/admin`.
> **Repository**: [https://github.com/UnmarriedIdentity/the-unplugged-wear.git](https://github.com/UnmarriedIdentity/the-unplugged-wear.git)
> **Active Branch**: `feat/single-app-merge`
> **Stack**: Next.js 16.3.8 (Turbopack) | React 19 | Tailwind CSS v4 | TypeScript 5.7
> **Local Dev**: `pnpm dev` → <http://localhost:3007>
> **Design Source**: Figma File Key `WmpPcdGcXerVgqNpgr6Q6S`

Every admin route in this document is served from the same port as the storefront. The
`/admin` prefix is the only thing that separates the two surfaces, so no storefront URL can
ever collide with an admin one.

---

## 1. Storefront — Authentication & Account

| Route | Description |
|---|---|
| `/login` | Customer sign-in. The demo admin account is handed to `/admin/dashboard`; the demo customer lands on `/account`. |
| `/register` | Account registration with terms acceptance. |
| `/forgot-password` | Password recovery request. |
| `/reset-password` | Password reset confirmation. |
| `/account` | Account overview. Requires the demo session. |
| `/account/orders` | Order history. |
| `/account/orders/[id]` | Single order detail. |

## 2. Storefront — Shopping

| Route | Description |
|---|---|
| `/` | Editorial homepage: hero, brand values, selected essentials, capsule series. |
| `/shop` | Full catalog with filters, sorting, and price range. |
| `/collections` | Collection index. |
| `/collections/[slug]` | Collection gallery. |
| `/products/[slug]` | Product detail page with variant matrix and gallery. |
| `/search` | Full-text search across titles, fabrics, tags, categories. |
| `/wishlist` | Saved pieces. |
| `/cart` | Shopping bag with promo validation. |
| `/checkout` | Simulated multi-step checkout. |
| `/checkout/success` | Order confirmation. |
| `/track-order` | Public order tracker. |
| `/size-guide` | Sizing charts. |

## 3. Storefront — Editorial & Policies

| Route | Description |
|---|---|
| `/about` | Studio philosophy. |
| `/about/sustainability` | Zero-deadstock commitment. |
| `/journal` | Slow Living Journal index. |
| `/journal/[slug]` | Journal article. |
| `/faq` | Frequently asked questions. |
| `/contact` | Concierge form. |
| `/policies` | Policy index. |
| `/policies/privacy` | Privacy policy. |
| `/policies/returns` | Returns & refunds policy. |
| `/policies/shipping` | Shipping policy. |
| `/policies/terms` | Terms of service. |
| `/design-system` | Storefront design-system specimen. |
| `/checklist` | Internal QA checklist (dev only). |

### Storefront redirects (`next.config.ts`)

| Source | Destination |
|---|---|
| `/faqs` | `/faq` |
| `/blog` | `/journal` |
| `/blog/:slug` | `/journal/:slug` |
| `/our-story` | `/about` |
| `/privacy-policy` | `/policies/privacy` |
| `/returns-refunds` | `/policies/returns` |
| `/shipping-policy` | `/policies/shipping` |
| `/terms` | `/policies/terms` |
| `/products/oversized-architectural-heavyweight-french-terry-drop-shoulder-zip-hoodie` | `/products/acid-wash-hoodie` |

## 4. Storefront — API Routes

| Route | Method | Description |
|---|---|---|
| `/api/checkout` | `POST` | Server-side checkout arithmetic in integer paise. |
| `/api/checklist` | `POST` | Internal QA checklist persistence. |
| `/api/contact` | `POST` | Contact form submission. |
| `/api/orders/[id]` | `GET` | Order lookup for the tracker. |
| `/api/fulfillment/qikink` | `POST` | Qikink fulfillment hand-off. |
| `/api/webhooks/razorpay` | `POST` | Razorpay webhook with HMAC verification. |

---

## 5. Admin — Authentication & Onboarding (`/admin/**`)

| Route | Figma Frame | Description |
|---|---|---|
| `/admin` | — | Canonical entry point; redirects to `/admin/dashboard`. |
| `/admin/signup` | `1:20984`, `1:20920` | Account registration with terms acceptance. |
| `/admin/verify` | `1:20890`, `1:20856` | 4-digit OTP verification. |
| `/admin/accept-invite` | — | Team invite onboarding. |
| `/admin/forgot-password` | `1:20710` | Password recovery request. |
| `/admin/reset-password` | `1:20710`, `1:20690` | Password reset and recovery confirmation. |

> The admin panel has **no sign-in screen**. `/login` on the storefront (Figma `1:20816`,
> `1:20776`, `1:20725`) is the single entry point and routes the demo admin straight to
> `/admin/dashboard`.

## 6. Admin — Core Operations

| Route | Description |
|---|---|
| `/admin/dashboard` | Homescreen dashboard (Figma `1:20300`) with dynamic KPIs, charts, recent orders, stock alerts. |
| `/admin/orders` | Order logistics with independent payment/fulfillment filters and detail drawers. |
| `/admin/products` | Product catalog, stock alerts, SKU variant creation. |
| `/admin/customers` | Customer directory, lifetime value, staff notes. |
| `/admin/reports` | Revenue analytics and CSV export. |
| `/admin/fulfillment` | POD print queue, batch dispatch, simulated retries. |
| `/admin/shipments` | Carrier tracking, manifests, chronological checkpoints. |
| `/admin/returns` | RMA inspection and restocking. |
| `/admin/refunds` | Refund disbursement logs and dialogs. |
| `/admin/payments` | Gateway capture logs and settlement schedules. |
| `/admin/discounts` | Promo codes and campaigns. |
| `/admin/abandoned` | Abandoned carts. |

## 7. Admin — Merchandising & Designs

| Route | Description |
|---|---|
| `/admin/collections` | Seasonal capsule curation and publication status. |
| `/admin/designs` | Production artwork library, DTG placements, mockups. |

## 8. Admin — Content Management

| Route | Description |
|---|---|
| `/admin/content` | CMS hub and editorial overview. |
| `/admin/content/pages` | Static page publishing and SEO metadata. |
| `/admin/content/journal` | Journal article list (TipTap-backed editor). |
| `/admin/content/journal/new` | New journal article. |
| `/admin/content/journal/[id]/edit` | Edit an existing journal article. |
| `/admin/content/navigation` | Header/footer menu tree builder. |
| `/admin/content/media` | Asset library. |

## 9. Admin — Team & Store Configuration

| Route | Description |
|---|---|
| `/admin/team` | Staff roster and role assignment. |
| `/admin/support` | Ticket queue, SLA resolution, canned replies. |
| `/admin/settings` | Settings hub. |
| `/admin/settings/general` | Store identity, currency, timezone. |
| `/admin/settings/brand` | Brand color roles, typography, logos. |
| `/admin/settings/attributes` | Product attribute library. |
| `/admin/settings/shipping` | Delivery zones, thresholds, carrier keys. |
| `/admin/settings/payments` | Gateway configuration. |
| `/admin/settings/fulfillment` | Qikink / Printrove settings. |
| `/admin/settings/notifications` | Customer order and dispatch triggers. |
| `/admin/settings/taxes` | Tax rules and GST settings. |
| `/admin/design-system` | Admin design-system specimen (Figma node `1:26969`). |

### Admin redirects (`next.config.ts`)

| Source | Destination |
|---|---|
| `/admin/home` | `/admin/dashboard` |
| `/admin/homepage` | `/admin/dashboard` |
| `/admin/analytics` | `/admin/reports` |
| `/admin/help` | `/admin/support` |
| `/admin/login` | `/login` |

---

## 10. Interactive State Simulation Parameters (Query Params)

Admin screens accept query parameters so any Figma frame can be reproduced exactly.

### Login States (`/admin/forgot-password` or `/admin/reset-password`)

The login frames now render inside the two remaining recovery screens, which mount the
same `LoginPage` component. There is no `/admin/login` route.

* `?state=default` → **Figma Frame 1:20816** (clean initial login view)
* `?state=filled` → **Figma Frame 1:20776** (pre-filled demo credentials)
* `?state=error` → **Figma Frame 1:20725** (error alert banner)
* `?state=reset` → **Figma Frame 1:20710** (password reset input view)
* `?state=recovery` → **Figma Frame 1:20690** (recovery email sent confirmation)

### Sign Up States (`/admin/signup`)

* `?state=default` → **Figma Frame 1:20984** (clean initial sign-up form)
* `?state=filled` → **Figma Frame 1:20920** (pre-filled form)
* `?state=verify-empty` → **Figma Frame 1:20890** (4-digit OTP empty inputs, `56×56px`)
* `?state=verify-filled` → **Figma Frame 1:20856** (active OTP with filled digits `3 3 4 2`)

### Dedicated Verification & Reset Hit Points

* `/admin/verify` → default empty OTP boxes
* `/admin/verify?state=verify-filled` → pre-filled code `3 3 4 2`
* `/admin/reset-password` → dedicated password reset form
* `/admin/reset-password?state=recovery` → confirmation card with green badge
