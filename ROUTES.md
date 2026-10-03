# The Unplugged Wear — Deployed Endpoints & Route Directory

> **Production Deployment URL**: [https://the-unplugged-wear.vercel.app](https://the-unplugged-wear.vercel.app)  
> **Repository**: [https://github.com/UnmarriedIdentity/the-unplugged-wear.git](https://github.com/UnmarriedIdentity/the-unplugged-wear.git)  
> **Active Branch**: `v2`  
> **Stack**: Next.js 16.3.8 (Turbopack) | React 19 | Tailwind CSS v4 | TypeScript 5.7  
> **Design Source**: Figma File Key `WmpPcdGcXerVgqNpgr6Q6S`  

---

## 1. Authentication & Onboarding Endpoints

| Endpoint URL | Route | Figma Frame | Description |
|---|---|---|---|
| [the-unplugged-wear.vercel.app/](https://the-unplugged-wear.vercel.app/) | `/` | `1:20816` | Canonical entry point (auto-redirects to `/login`) |
| [the-unplugged-wear.vercel.app/login](https://the-unplugged-wear.vercel.app/login) | `/login` | `1:20816`, `1:20776`, `1:20725` | Dedicated staff authentication suite with state simulations |
| [the-unplugged-wear.vercel.app/signup](https://the-unplugged-wear.vercel.app/signup) | `/signup` | `1:20984`, `1:20920` | Account registration form with terms acceptance |
| [the-unplugged-wear.vercel.app/verify](https://the-unplugged-wear.vercel.app/verify) | `/verify` | `1:20890`, `1:20856` | 4-Digit OTP security code verification |
| [the-unplugged-wear.vercel.app/forgot-password](https://the-unplugged-wear.vercel.app/forgot-password) | `/forgot-password` | `1:20710` | Password recovery initiation request |
| [the-unplugged-wear.vercel.app/reset-password](https://the-unplugged-wear.vercel.app/reset-password) | `/reset-password` | `1:20710`, `1:20690` | Password reset form and recovery email sent confirmation |
| [the-unplugged-wear.vercel.app/accept-invite](https://the-unplugged-wear.vercel.app/accept-invite) | `/accept-invite` | — | Team member invite onboarding portal |

---

## 2. Core Operational Dashboard & Modules

| Endpoint URL | Route | Status | Description |
|---|---|---|---|
| [the-unplugged-wear.vercel.app/dashboard](https://the-unplugged-wear.vercel.app/dashboard) | `/dashboard` | `200 OK` | **Official Homescreen Dashboard** (Figma Frame `1:20300`) with dynamic KPIs, sales bar charts, recent orders, and stock alerts |
| [the-unplugged-wear.vercel.app/home](https://the-unplugged-wear.vercel.app/home) | `/home` | `Redirect` | Canonical redirect to `/dashboard` |
| [the-unplugged-wear.vercel.app/homepage](https://the-unplugged-wear.vercel.app/homepage) | `/homepage` | `Redirect` | Canonical redirect to `/dashboard` |
| [the-unplugged-wear.vercel.app/orders](https://the-unplugged-wear.vercel.app/orders) | `/orders` | `200 OK` | Order logistics, independent payment/fulfillment filters, detail drawers |
| [the-unplugged-wear.vercel.app/products](https://the-unplugged-wear.vercel.app/products) | `/products` | `200 OK` | Product catalog, stock alerts, SKU variant creation modal |
| [the-unplugged-wear.vercel.app/customers](https://the-unplugged-wear.vercel.app/customers) | `/customers` | `200 OK` | Customer CRM directory, lifetime value metrics, staff notes |
| [the-unplugged-wear.vercel.app/reports](https://the-unplugged-wear.vercel.app/reports) | `/reports` | `200 OK` | Revenue analytics, performance metrics, and dynamic CSV export |
| [the-unplugged-wear.vercel.app/analytics](https://the-unplugged-wear.vercel.app/analytics) | `/analytics` | `Redirect` | Canonical redirect to `/reports` |
| [the-unplugged-wear.vercel.app/fulfillment](https://the-unplugged-wear.vercel.app/fulfillment) | `/fulfillment` | `200 OK` | POD print queue status, batch dispatch, and simulated retry actions |
| [the-unplugged-wear.vercel.app/shipments](https://the-unplugged-wear.vercel.app/shipments) | `/shipments` | `200 OK` | Carrier tracking, manifest telemetry, chronological checkpoints |
| [the-unplugged-wear.vercel.app/returns](https://the-unplugged-wear.vercel.app/returns) | `/returns` | `200 OK` | RMA inspection, restocking workflow, and dispute resolution |
| [the-unplugged-wear.vercel.app/refunds](https://the-unplugged-wear.vercel.app/refunds) | `/refunds` | `200 OK` | Refund disbursement logs and validated refund dialog |
| [the-unplugged-wear.vercel.app/payments](https://the-unplugged-wear.vercel.app/payments) | `/payments` | `200 OK` | Gateway capture logs (Stripe/PayPal), settlement schedules |

---

## 3. Merchandising & Production Designs

| Endpoint URL | Route | Description |
|---|---|---|
| [the-unplugged-wear.vercel.app/collections](https://the-unplugged-wear.vercel.app/collections) | `/collections` | Seasonal capsule collection curation and publication status |
| [the-unplugged-wear.vercel.app/designs](https://the-unplugged-wear.vercel.app/designs) | `/designs` | Production artwork library, DTG print placements, mockup previews |

---

## 4. Content Management System (CMS) Endpoints

| Endpoint URL | Route | Description |
|---|---|---|
| [the-unplugged-wear.vercel.app/content](https://the-unplugged-wear.vercel.app/content) | `/content` | CMS hub and editorial overview |
| [the-unplugged-wear.vercel.app/content/pages](https://the-unplugged-wear.vercel.app/content/pages) | `/content/pages` | Static page publishing and SEO metadata management |
| [the-unplugged-wear.vercel.app/content/journal](https://the-unplugged-wear.vercel.app/content/journal) | `/content/journal` | Editorial journal articles, slow-living essays, lookbooks |
| [the-unplugged-wear.vercel.app/content/navigation](https://the-unplugged-wear.vercel.app/content/navigation) | `/content/navigation` | Header and footer navigational menu tree builder |
| [the-unplugged-wear.vercel.app/content/media](https://the-unplugged-wear.vercel.app/content/media) | `/content/media` | Public CDN asset library with local browser object previews |

---

## 5. Team & Store Configuration Endpoints

| Endpoint URL | Route | Description |
|---|---|---|
| [the-unplugged-wear.vercel.app/team](https://the-unplugged-wear.vercel.app/team) | `/team` | Staff roster, role assignment (Owner, Operations, Content, Read-only) |
| [the-unplugged-wear.vercel.app/audit-log](https://the-unplugged-wear.vercel.app/audit-log) | `/audit-log` | Security audit trail recording simulated staff mutations |
| [the-unplugged-wear.vercel.app/support](https://the-unplugged-wear.vercel.app/support) | `/support` | Customer ticket queue, SLA resolution, and canned replies |
| [the-unplugged-wear.vercel.app/help](https://the-unplugged-wear.vercel.app/help) | `/help` | Canonical redirect to `/support` |
| [the-unplugged-wear.vercel.app/settings](https://the-unplugged-wear.vercel.app/settings) | `/settings` | General store configuration and manager profile |
| [the-unplugged-wear.vercel.app/settings/general](https://the-unplugged-wear.vercel.app/settings/general) | `/settings/general` | Store identity, currency defaults, and timezone |
| [the-unplugged-wear.vercel.app/settings/brand](https://the-unplugged-wear.vercel.app/settings/brand) | `/settings/brand` | Brand color roles, typography scale, logos |
| [the-unplugged-wear.vercel.app/settings/shipping](https://the-unplugged-wear.vercel.app/settings/shipping) | `/settings/shipping` | Delivery zones, shipping thresholds, carrier keys |
| [the-unplugged-wear.vercel.app/settings/payments](https://the-unplugged-wear.vercel.app/settings/payments) | `/settings/payments` | Stripe Connect & PayPal gateway configurations |
| [the-unplugged-wear.vercel.app/settings/fulfillment](https://the-unplugged-wear.vercel.app/settings/fulfillment) | `/settings/fulfillment` | Qikink Direct API & Printrove webhook settings |
| [the-unplugged-wear.vercel.app/settings/notifications](https://the-unplugged-wear.vercel.app/settings/notifications) | `/settings/notifications` | Customer order confirmation & dispatch triggers |
| [the-unplugged-wear.vercel.app/settings/taxes](https://the-unplugged-wear.vercel.app/settings/taxes) | `/settings/taxes` | Tax rules and GST compliance settings |

---

## 6. Design System Live Specimen

| Endpoint URL | Route | Figma Reference | Description |
|---|---|---|---|
| [the-unplugged-wear.vercel.app/design-system](https://the-unplugged-wear.vercel.app/design-system) | `/design-system` | Node `1:26969` | Interactive live specimen demonstrating the 18 color tokens, Urbanist type scale, and UI primitives |

---

## 7. Interactive State Simulation Parameters (Query Params)

These query parameters can be appended to test any exact Figma frame in the deployed application:

### Login States (`/login` or `/`)
* `?state=default` → **Figma Frame 1:20816** (Clean initial login view with empty fields)
* `?state=filled` → **Figma Frame 1:20776** (Pre-filled demo credentials: `contactstylehub@gmail.com`)
* `?state=error` → **Figma Frame 1:20725** (Error alert banner: *"Password comparison failed"*)
* `?state=reset` → **Figma Frame 1:20710** (Password reset input view)
* `?state=recovery` → **Figma Frame 1:20690** (Success confirmation: *"Recovery email sent"*)

### Sign Up States (`/signup`)
* `?state=default` → **Figma Frame 1:20984** (Clean initial sign-up form)
* `?state=filled` → **Figma Frame 1:20920** (Pre-filled form with `Jessicha Smith`)
* `?state=verify-empty` → **Figma Frame 1:20890** (4-Digit OTP empty inputs: `56x56px`)
* `?state=verify-filled` → **Figma Frame 1:20856** (Active OTP with filled digits `3 3 4 2`)

### Dedicated Verification & Reset Hit Points
* `/verify` → Default empty OTP boxes
* `/verify?state=verify-filled` → Pre-filled code `3 3 4 2`
* `/reset-password` → Dedicated password reset form
* `/reset-password?state=recovery` → Confirmation card with green badge
