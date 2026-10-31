# The Unplugged Wear — Route Directory

> **Two packages, two deployments.** `tuw-website` (storefront, port 3007) and `tuw-admin`
> (staff panel, port 3001) are independent Next.js apps in one pnpm workspace. No route of one
> app is served by the other, so no storefront URL can collide with an admin one.
>
> **Repository**: [github.com/UnmarriedIdentity/the-unplugged-wear](https://github.com/UnmarriedIdentity/the-unplugged-wear)
> **Branch**: `feat/split-apps`
> **Stack**: Next.js 16.3.8 (Turbopack) | React 19 | Tailwind CSS v4 | TypeScript 5.7
> **Design source**: Figma file key `WmpPcdGcXerVgqNpgr6Q6S`

| App | Local | Route tree | Source root |
|---|---|---|---|
| Storefront | <http://localhost:3007> | `tuw-website/src/app/**` | `tuw-website/src/storefront/**` (`@storefront/*`) |
| Admin panel | <http://localhost:3001> | `tuw-admin/src/app/**` | `tuw-admin/src/{components,hooks,lib,mocks}/**` (`@/*`) |

---

# Part A — Storefront (`tuw-website`)

## 1. Authentication & Account

| Route | Description |
|---|---|
| `/login` | Customer sign-in. The demo account lands on `/account`. |
| `/register` | Account registration with terms acceptance. |
| `/forgot-password` | Password recovery request. |
| `/reset-password` | Password reset confirmation. |
| `/account` | Account overview. Requires the demo session. |
| `/account/orders` | Order history. |
| `/account/orders/[id]` | Single order detail. |

## 2. Shopping

| Route | Description |
|---|---|
| `/` | Editorial homepage: hero, brand values, selected essentials, capsule series. |
| `/shop` | Full catalog with filters, sorting and price range. |
| `/collections` | Collection index. |
| `/collections/[slug]` | Collection gallery. |
| `/products/[slug]` | Product detail page with variant matrix and gallery. |
| `/search` | Full-text search across titles, fabrics, tags and categories. |
| `/wishlist` | Saved pieces. |
| `/cart` | Shopping bag with promo validation. |
| `/checkout` | Simulated multi-step checkout. |
| `/checkout/success` | Order confirmation. |
| `/track-order` | Public order tracker. |
| `/size-guide` | Sizing charts. |

## 3. Editorial & Policies

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

Any other path renders the storefront not-found page through the `[...notfound]` catch-all.

## 4. API routes

| Route | Method | Description |
|---|---|---|
| `/api/checkout` | `POST` | Server-side checkout arithmetic in integer paise. |
| `/api/checklist` | `POST` | Internal QA checklist persistence. |
| `/api/contact` | `POST` | Contact form submission. |
| `/api/orders/[id]` | `GET` | Order lookup for the tracker. |
| `/api/fulfillment/qikink` | `POST` | Qikink fulfillment hand-off. |
| `/api/webhooks/razorpay` | `POST` | Razorpay webhook with HMAC verification. |

## 5. Redirects (`tuw-website/next.config.ts`)

| Source | Destination | Permanent |
|---|---|---|
| `/products/oversized-architectural-heavyweight-french-terry-drop-shoulder-zip-hoodie` | `/products/acid-wash-hoodie` | yes |
| `/faqs` | `/faq` | yes |
| `/blog` | `/journal` | yes |
| `/blog/:slug` | `/journal/:slug` | yes |
| `/our-story` | `/about` | yes |
| `/privacy-policy` | `/policies/privacy` | yes |
| `/returns-refunds` | `/policies/returns` | yes |
| `/shipping-policy` | `/policies/shipping` | yes |
| `/terms` | `/policies/terms` | yes |

---

# Part B — Admin panel (`tuw-admin`)

Routes are relative to the panel's own origin (`:3001` or its own Vercel project). The
`(dashboard)` route group is URL-transparent, so a source file at
`src/app/(dashboard)/orders/page.tsx` serves `/orders`.

## 6. Authentication & Onboarding

| Route | Figma frame | Description |
|---|---|---|
| `/` | — | Redirects to `/login`. |
| `/login` | `1:20816`, `1:20776`, `1:20725` | Staff sign-in with state simulations. |
| `/signup` | `1:20984`, `1:20920` | Account registration with terms acceptance. |
| `/verify` | `1:20890`, `1:20856` | 4-digit OTP verification. |
| `/accept-invite` | — | Team invite onboarding. |
| `/forgot-password` | `1:20710` | Password recovery request. |
| `/reset-password` | `1:20710`, `1:20690` | Password reset and recovery confirmation. |

## 7. Core Operations

| Route | Description |
|---|---|
| `/dashboard` | Homescreen dashboard (Figma `1:20300`): KPIs, sales chart, recent orders, stock alerts. |
| `/orders` | Order logistics with independent payment/fulfillment filters and detail drawers. |
| `/products` | Product catalog, stock alerts, SKU variant creation. |
| `/customers` | Customer directory, lifetime value, staff notes. |
| `/reports` | Revenue analytics and CSV export. |
| `/fulfillment` | POD print queue, batch dispatch, simulated retries. |
| `/shipments` | Carrier tracking, manifests, chronological checkpoints. |
| `/returns` | RMA inspection and restocking. |
| `/refunds` | Refund disbursement logs and dialogs. |
| `/payments` | Gateway capture logs and settlement schedules. |
| `/discounts` | Promo codes and campaigns. |
| `/abandoned` | Abandoned carts. |

## 8. Merchandising & Production Designs

| Route | Description |
|---|---|
| `/collections` | Seasonal capsule curation and publication status. |
| `/designs` | Production artwork library, DTG placements, mockups. |

## 9. Content Management

| Route | Description |
|---|---|
| `/content` | CMS hub and editorial overview. |
| `/content/pages` | Static page publishing and SEO metadata. |
| `/content/journal` | Journal article list (TipTap-backed editor). |
| `/content/journal/new` | New journal article. |
| `/content/journal/[id]/edit` | Edit an existing journal article. |
| `/content/navigation` | Header/footer menu tree builder. |
| `/content/media` | Asset library. |

## 10. Team & Store Configuration

| Route | Description |
|---|---|
| `/team` | Staff roster and role assignment. |
| `/support` | Ticket queue, SLA resolution, canned replies. |
| `/settings` | Settings hub. |
| `/settings/general` | Store identity, currency, timezone. |
| `/settings/brand` | Brand color roles, typography, logos. |
| `/settings/attributes` | Product attribute library. |
| `/settings/shipping` | Delivery zones, thresholds, carrier keys. |
| `/settings/payments` | Gateway configuration. |
| `/settings/fulfillment` | Qikink / Printrove settings. |
| `/settings/notifications` | Customer order and dispatch triggers. |
| `/settings/taxes` | Tax rules and GST settings. |
| `/design-system` | Admin design-system specimen (Figma node `1:26969`). |

## 11. Redirects (`tuw-admin/next.config.ts`)

| Source | Destination |
|---|---|
| `/` | `/login` |
| `/home` | `/dashboard` |
| `/homepage` | `/dashboard` |
| `/analytics` | `/reports` |
| `/help` | `/support` |

## 12. Interactive state simulation parameters

Admin screens accept query parameters so any Figma frame can be reproduced exactly.

### Login states (`/login`)

* `?state=default` → **1:20816** clean initial login view
* `?state=filled` → **1:20776** pre-filled demo credentials
* `?state=error` → **1:20725** error alert banner
* `?state=reset` → **1:20710** password reset input view
* `?state=recovery` → **1:20690** recovery email sent confirmation

### Sign-up states (`/signup`)

* `?state=default` → **1:20984** clean initial sign-up form
* `?state=filled` → **1:20920** pre-filled form
* `?state=verify-empty` → **1:20890** 4-digit OTP empty inputs (`56×56px`)
* `?state=verify-filled` → **1:20856** active OTP with filled digits `3 3 4 2`

### Dedicated verification & reset hit points

* `/verify` → default empty OTP boxes
* `/verify?state=verify-filled` → pre-filled code `3 3 4 2`
* `/reset-password` → dedicated password reset form
* `/reset-password?state=recovery` → confirmation card with green badge
