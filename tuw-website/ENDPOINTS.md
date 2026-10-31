# The Unplugged Wear — Complete Localhost & Endpoints Guide

> **Dev Server Status**: **ACTIVE & RUNNING**  
> **Local URL**: [http://localhost:3007](http://localhost:3007)  
> **Turbopack Engine**: Next.js 16.3.8 | React 19 | Tailwind CSS v4  
> **Dev Command**: `pnpm --dir tuw-website dev` (or `cd tuw-website && pnpm dev`)

---

## 1. Storefront & Customer Navigation Pages

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/` | [http://localhost:3007/](http://localhost:3007/) | `src/app/page.tsx` | Storefront editorial homepage with hero, featured drops, ethos, and latest arrivals. |
| `/shop` | [http://localhost:3007/shop](http://localhost:3007/shop) | `src/app/shop/page.tsx` | Full catalog browsing with category filters, sorting, price range, and stock indicators. |
| `/collections` | [http://localhost:3007/collections](http://localhost:3007/collections) | `src/app/collections/page.tsx` | Collections index and curated lookbook directory. |
| `/collections/[slug]` | [http://localhost:3007/collections/winter-monolith](http://localhost:3007/collections/winter-monolith) | `src/app/collections/[slug]/page.tsx` | Dynamic collection gallery with curated garments and editorial copy. |
| `/products/[slug]` | [http://localhost:3007/products/monolith-heavyweight-hoodie-vintage-black](http://localhost:3007/products/monolith-heavyweight-hoodie-vintage-black) | `src/app/products/[slug]/page.tsx` | Product Detail Page (PDP): color/size matrix, minor unit pricing, gallery, and bag actions. |
| `/cart` | [http://localhost:3007/cart](http://localhost:3007/cart) | `src/app/cart/page.tsx` | Full shopping bag with line totals, quantity controls, promo validation, and checkout CTA. |
| `/checkout` | [http://localhost:3007/checkout](http://localhost:3007/checkout) | `src/app/checkout/page.tsx` | Multi-step simulated checkout (contact, shipping address, Razorpay sandbox payment). |
| `/checkout/success` | [http://localhost:3007/checkout/success](http://localhost:3007/checkout/success) | `src/app/checkout/success/page.tsx` | Post-purchase order confirmation with order summary and shipment tracking seam. |
| `/wishlist` | [http://localhost:3007/wishlist](http://localhost:3007/wishlist) | `src/app/wishlist/page.tsx` | Customer saved pieces, quick add-to-bag, and stock availability toggles. |
| `/search` | [http://localhost:3007/search](http://localhost:3007/search) | `src/app/search/page.tsx` | Instant full-text search across titles, fabric compositions, tags, and categories. |
| `/track-order` | [http://localhost:3007/track-order](http://localhost:3007/track-order) | `src/app/track-order/page.tsx` | Public order & fulfillment tracker with carrier timeline and live status. |
| `/size-guide` | [http://localhost:3007/size-guide](http://localhost:3007/size-guide) | `src/app/size-guide/page.tsx` | Architectural sizing charts (chest, length, sleeve) and measurement methodology. |

---

## 2. Editorial, Story & Journal Pages

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/about` | [http://localhost:3007/about](http://localhost:3007/about) | `src/app/about/page.tsx` | Studio philosophy, minimalist craftsmanship, and slow-living narrative. |
| `/about/sustainability` | [http://localhost:3007/about/sustainability](http://localhost:3007/about/sustainability) | `src/app/about/sustainability/page.tsx` | Zero-deadstock commitment, GOTS organic cottons, and on-demand manufacturing. |
| `/our-story` | [http://localhost:3007/our-story](http://localhost:3007/our-story) | `src/app/our-story/page.tsx` | The founding journey of The Unplugged Wear and tactile design ethos. |
| `/journal` | [http://localhost:3007/journal](http://localhost:3007/journal) | `src/app/journal/page.tsx` | Slow Living Journal index with editorial features and essays. |
| `/journal/[slug]` | [http://localhost:3007/journal/the-anatomy-of-500-gsm-cotton](http://localhost:3007/journal/the-anatomy-of-500-gsm-cotton) | `src/app/journal/[slug]/page.tsx` | Rich editorial article with typographic hierarchy, pull quotes, and author info. |
| `/blog` | [http://localhost:3007/blog](http://localhost:3007/blog) | `src/app/blog/page.tsx` | Canonical blog index (aliases Journal entries). |
| `/blog/[slug]` | [http://localhost:3007/blog/zero-deadstock-print-on-demand](http://localhost:3007/blog/zero-deadstock-print-on-demand) | `src/app/blog/[slug]/page.tsx` | Individual blog post view. |
| `/contact` | [http://localhost:3007/contact](http://localhost:3007/contact) | `src/app/contact/page.tsx` | Concierge inquiries form, studio hours, and client support channels. |
| `/faq` / `/faqs` | [http://localhost:3007/faq](http://localhost:3007/faq) | `src/app/faq/page.tsx` | Accordion FAQ addressing sizing, shipping timelines, fabrics, and care. |

---

## 3. Account & Authentication Pages

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/account` | [http://localhost:3007/account](http://localhost:3007/account) | `src/app/account/page.tsx` | Customer profile dashboard, saved addresses, preferences, and quick links. |
| `/account/orders` | [http://localhost:3007/account/orders](http://localhost:3007/account/orders) | `src/app/account/orders/page.tsx` | Order history listing with status badges (`shipped`, `delivered`, `queued`). |
| `/account/orders/[id]` | [http://localhost:3007/account/orders/ord-9042](http://localhost:3007/account/orders/ord-9042) | `src/app/account/orders/[id]/page.tsx` | Detailed invoice, fulfillment milestone breadcrumbs, and return request seam. |
| `/login` | [http://localhost:3007/login](http://localhost:3007/login) | `src/app/login/page.tsx` | Customer sign in with email and password. |
| `/register` | [http://localhost:3007/register](http://localhost:3007/register) | `src/app/register/page.tsx` | New client account creation. |
| `/forgot-password` | [http://localhost:3007/forgot-password](http://localhost:3007/forgot-password) | `src/app/forgot-password/page.tsx` | Password reset request with email recovery link dispatch. |
| `/reset-password` | [http://localhost:3007/reset-password](http://localhost:3007/reset-password) | `src/app/reset-password/page.tsx` | Password reset confirmation with new credential entry. |

---

## 4. Legal & Policy Pages

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/policies` | [http://localhost:3007/policies](http://localhost:3007/policies) | `src/app/policies/page.tsx` | Policy directory and customer protection overview. |
| `/policies/privacy` | [http://localhost:3007/policies/privacy](http://localhost:3007/policies/privacy) | `src/app/policies/privacy/page.tsx` | Full privacy notice and data processing disclosure. |
| `/privacy-policy` | [http://localhost:3007/privacy-policy](http://localhost:3007/privacy-policy) | `src/app/privacy-policy/page.tsx` | Vanity alias to Privacy Policy. |
| `/policies/returns` | [http://localhost:3007/policies/returns](http://localhost:3007/policies/returns) | `src/app/policies/returns/page.tsx` | 7-day exchange window, conditions, and return guidelines. |
| `/returns-refunds` | [http://localhost:3007/returns-refunds](http://localhost:3007/returns-refunds) | `src/app/returns-refunds/page.tsx` | Vanity alias to Returns & Refunds Policy. |
| `/policies/shipping` | [http://localhost:3007/policies/shipping](http://localhost:3007/policies/shipping) | `src/app/policies/shipping/page.tsx` | Pan-India shipping timelines (5–8 business days) and carrier details. |
| `/shipping-policy` | [http://localhost:3007/shipping-policy](http://localhost:3007/shipping-policy) | `src/app/shipping-policy/page.tsx` | Vanity alias to Shipping Policy. |
| `/policies/terms` | [http://localhost:3007/policies/terms](http://localhost:3007/policies/terms) | `src/app/policies/terms/page.tsx` | Store terms of service, intellectual property, and governing law. |
| `/terms` | [http://localhost:3007/terms](http://localhost:3007/terms) | `src/app/terms/page.tsx` | Vanity alias to Terms & Conditions. |

---

## 5. Developer & Project Management Tools

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/checklist` | [http://localhost:3007/checklist](http://localhost:3007/checklist) | `src/app/checklist/page.tsx` | Interactive page progress tracker: mark pages as Done/In Progress/Not Done, add custom pages, edit review notes, and live jump to routes. |
| `/design-system` | [http://localhost:3007/design-system](http://localhost:3007/design-system) | `src/app/design-system/page.tsx` | Live UI component library: color palettes, typography scale, buttons, badges, drawers, and form controls. |


---

## 6. Backend API Endpoints

### 6.1 Order Calculation & Checkout Validation
- **Endpoint**: `/api/checkout`
- **Method**: `POST`
- **Source**: `src/app/api/checkout/route.ts`
- **Description**: Validates stock availability, calculates integer minor unit prices (paise), computes discounts (e.g. promo `UNPLUG10`), and verifies free shipping thresholds (threshold: ₹3,000 / 300,000 paise).
- **Request Body**:
```json
{
  "items": [
    {
      "productId": "prod-1",
      "size": "M",
      "color": "vintage-black",
      "quantity": 1
    }
  ],
  "promoCode": "UNPLUG10",
  "customer": {
    "email": "customer@example.com",
    "fullName": "Aarav Sharma",
    "phone": "+91 98765 43210"
  }
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "orderNumber": "TUW-2026-4821",
  "currency": "INR",
  "subtotalMinorINR": 389900,
  "subtotalINR": 3899,
  "discountMinorINR": 38990,
  "discountINR": 390,
  "shippingFeeMinorINR": 0,
  "shippingFeeINR": 0,
  "totalMinorINR": 350910,
  "totalINR": 3509,
  "promoApplied": true,
  "items": [...]
}
```

---

### 6.2 Contact / Studio Concierge Inquiry
- **Endpoint**: `/api/contact`
- **Method**: `POST`
- **Source**: `src/app/api/contact/route.ts`
- **Description**: Receives and validates customer support messages with length enforcement.
- **Request Body**:
```json
{
  "name": "Priya Nair",
  "email": "priya@example.com",
  "subject": "Sizing assistance",
  "message": "Inquiry regarding the heavyweight drape on size Medium."
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Your inquiry has been received. Our studio concierge will reply within 24–48 hours."
}
```

---

### 6.3 Public Order Tracking & Details Lookup
- **Endpoint**: `/api/orders/[id]`
- **Method**: `GET`
- **Source**: `src/app/api/orders/[id]/route.ts`
- **Sample URL**: [http://localhost:3007/api/orders/ord-9042](http://localhost:3007/api/orders/ord-9042) or [http://localhost:3007/api/orders/TUW-9042](http://localhost:3007/api/orders/TUW-9042)
- **Description**: Returns order details, tracking milestones, line items, and fulfillment statuses with sensitive customer PII sanitized.
- **Response** (`200 OK`):
```json
{
  "success": true,
  "order": {
    "id": "ord-9042",
    "orderNumber": "TUW-9042",
    "date": "2026-09-29",
    "status": "Shipped",
    "paymentStatus": "paid",
    "fulfillmentStatus": "shipped",
    "carrier": "Blue Dart Express",
    "trackingEvents": [...]
  }
}
```

---

### 6.4 Qikink Print-On-Demand Fulfillment Dispatch
- **Endpoint**: `/api/fulfillment/qikink`
- **Method**: `POST`
- **Source**: `src/app/api/fulfillment/qikink/route.ts`
- **Description**: Submits an order payload to the automated Qikink print-on-demand fulfillment partner API.
- **Request Body**:
```json
{
  "orderId": "ord-9042"
}
```

---

### 6.5 Razorpay Webhook Handler
- **Endpoint**: `/api/webhooks/razorpay`
- **Method**: `POST`
- **Source**: `src/app/api/webhooks/razorpay/route.ts`
- **Description**: Cryptographically verifies the `x-razorpay-signature` HMAC header and transitions payment statuses idempotently (`payment.captured`, `payment.failed`, `order.paid`).
- **Headers**:
  - `x-razorpay-signature`: HMAC SHA256 signature generated with `RAZORPAY_WEBHOOK_SECRET`.

---

## 7. Sample Dynamic Route Values for Testing

### Product Slugs (`/products/[slug]`)
- `monolith-heavyweight-hoodie-vintage-black`
- `atelier-raw-edge-relaxed-tee`
- `solitude-wide-leg-canvas-trousers`
- `unplugged-oversized-crewneck-slate`
- `heavy-canvas-utility-carryall-tote`
- `washed-cotton-dad-cap-minimal`
- `technical-shell-modular-bomber-jacket`
- `raw-hem-heavyweight-thermal-waffle-tee`
- `japanese-selvedge-cotton-chore-coat`
- `brushed-cashmere-ribbed-studio-blanket`
- `modular-lightweight-ripstop-windbreaker`

### Collection Slugs (`/collections/[slug]`)
- `winter-monolith`
- `atelier-raw`
- `daily-objects`

### Journal & Blog Slugs (`/journal/[slug]` or `/blog/[slug]`)
- `the-anatomy-of-500-gsm-cotton`
- `zero-deadstock-print-on-demand`
- `unplugging-the-digital-noise`

### Order IDs & Numbers (`/account/orders/[id]` or `/api/orders/[id]`)
- `ord-9042` / `TUW-9042`
- `ord-9041` / `TUW-9041`
- `ord-9040` / `TUW-9040`
- `ord-9039` / `TUW-9039`
- `ord-9038` / `TUW-9038`

---

## 8. Admin Panel (`/admin/**`)

The admin panel is served by the same app and the same port. It renders under the
`(admin)` root layout with its own stylesheet, so it shares nothing with the storefront
design system. Screens live in `src/app/(admin)/admin/` and the `(dashboard)` route group.

### 8.1 Authentication

| Route | Local URL | Source File | Description |
| :--- | :--- | :--- | :--- |
| `/admin` | [http://localhost:3007/admin](http://localhost:3007/admin) | `src/app/(admin)/admin/page.tsx` | Redirects to `/admin/dashboard`. |
| `/admin/signup` | [http://localhost:3007/admin/signup](http://localhost:3007/admin/signup) | `src/app/(admin)/admin/signup/page.tsx` | Team invitation sign-up. |
| `/admin/verify` | [http://localhost:3007/admin/verify](http://localhost:3007/admin/verify) | `src/app/(admin)/admin/verify/page.tsx` | Verification code entry. |
| `/admin/accept-invite` | [http://localhost:3007/admin/accept-invite](http://localhost:3007/admin/accept-invite) | `src/app/(admin)/admin/accept-invite/page.tsx` | Invitation acceptance. |
| `/admin/forgot-password` | [http://localhost:3007/admin/forgot-password](http://localhost:3007/admin/forgot-password) | `src/app/(admin)/admin/forgot-password/page.tsx` | Password reset request. |
| `/admin/reset-password` | [http://localhost:3007/admin/reset-password](http://localhost:3007/admin/reset-password) | `src/app/(admin)/admin/reset-password/page.tsx` | Password reset confirmation. |

> **No admin sign-in screen.** The admin panel has no login page; `/login` on the storefront
> is the single entry point and routes the demo admin to `/admin/dashboard`. `/admin/login`
> redirects to `/login`.

### 8.2 Dashboard Screens

Every source file below is `src/app/(admin)/admin/(dashboard)/<segment>/page.tsx`.

| Route | Local URL | Description |
| :--- | :--- | :--- |
| `/admin/dashboard` | [http://localhost:3007/admin/dashboard](http://localhost:3007/admin/dashboard) | Operations home with revenue, order and stock cards. |
| `/admin/orders` | [http://localhost:3007/admin/orders](http://localhost:3007/admin/orders) | Order list, filters, and detail drawer. |
| `/admin/products` | [http://localhost:3007/admin/products](http://localhost:3007/admin/products) | Catalog, variants, attributes, and stock. |
| `/admin/customers` | [http://localhost:3007/admin/customers](http://localhost:3007/admin/customers) | Customer directory and order history. |
| `/admin/reports` | [http://localhost:3007/admin/reports](http://localhost:3007/admin/reports) | Sales, product, and channel reporting. |
| `/admin/fulfillment` | [http://localhost:3007/admin/fulfillment](http://localhost:3007/admin/fulfillment) | Print-and-pack queue. |
| `/admin/shipments` | [http://localhost:3007/admin/shipments](http://localhost:3007/admin/shipments) | Carrier handover and tracking. |
| `/admin/returns` | [http://localhost:3007/admin/returns](http://localhost:3007/admin/returns) | Return requests and inspection. |
| `/admin/refunds` | [http://localhost:3007/admin/refunds](http://localhost:3007/admin/refunds) | Refund ledger. |
| `/admin/payments` | [http://localhost:3007/admin/payments](http://localhost:3007/admin/payments) | Payment reconciliation. |
| `/admin/discounts` | [http://localhost:3007/admin/discounts](http://localhost:3007/admin/discounts) | Promo codes and campaigns. |
| `/admin/abandoned` | [http://localhost:3007/admin/abandoned](http://localhost:3007/admin/abandoned) | Abandoned carts. |
| `/admin/collections` | [http://localhost:3007/admin/collections](http://localhost:3007/admin/collections) | Collection editor. |
| `/admin/designs` | [http://localhost:3007/admin/designs](http://localhost:3007/admin/designs) | Print artwork library. |
| `/admin/content` | [http://localhost:3007/admin/content](http://localhost:3007/admin/content) | Content hub. |
| `/admin/content/journal` | [http://localhost:3007/admin/content/journal](http://localhost:3007/admin/content/journal) | Journal post list. |
| `/admin/content/journal/new` | [http://localhost:3007/admin/content/journal/new](http://localhost:3007/admin/content/journal/new) | New journal post (TipTap editor). |
| `/admin/content/journal/[id]/edit` | [http://localhost:3007/admin/content/journal/1/edit](http://localhost:3007/admin/content/journal/1/edit) | Edit an existing journal post. |
| `/admin/content/media` | [http://localhost:3007/admin/content/media](http://localhost:3007/admin/content/media) | Media library. |
| `/admin/content/navigation` | [http://localhost:3007/admin/content/navigation](http://localhost:3007/admin/content/navigation) | Menu and navigation editor. |
| `/admin/content/pages` | [http://localhost:3007/admin/content/pages](http://localhost:3007/admin/content/pages) | Static page editor. |
| `/admin/team` | [http://localhost:3007/admin/team](http://localhost:3007/admin/team) | Team members and permissions. |
| `/admin/support` | [http://localhost:3007/admin/support](http://localhost:3007/admin/support) | Support tickets and help content. |
| `/admin/settings` | [http://localhost:3007/admin/settings](http://localhost:3007/admin/settings) | Settings hub. |
| `/admin/settings/general` | [http://localhost:3007/admin/settings/general](http://localhost:3007/admin/settings/general) | Store identity and locale. |
| `/admin/settings/brand` | [http://localhost:3007/admin/settings/brand](http://localhost:3007/admin/settings/brand) | Brand assets and palette. |
| `/admin/settings/attributes` | [http://localhost:3007/admin/settings/attributes](http://localhost:3007/admin/settings/attributes) | Product attribute library. |
| `/admin/settings/shipping` | [http://localhost:3007/admin/settings/shipping](http://localhost:3007/admin/settings/shipping) | Shipping zones and rates. |
| `/admin/settings/taxes` | [http://localhost:3007/admin/settings/taxes](http://localhost:3007/admin/settings/taxes) | Tax rules. |
| `/admin/settings/payments` | [http://localhost:3007/admin/settings/payments](http://localhost:3007/admin/settings/payments) | Payment provider settings. |
| `/admin/settings/fulfillment` | [http://localhost:3007/admin/settings/fulfillment](http://localhost:3007/admin/settings/fulfillment) | Fulfillment partner settings. |
| `/admin/settings/notifications` | [http://localhost:3007/admin/settings/notifications](http://localhost:3007/admin/settings/notifications) | Notification channels. |
| `/admin/design-system` | [http://localhost:3007/admin/design-system](http://localhost:3007/admin/design-system) | Admin design-system specimen. |

### 8.3 Admin Route Aliases (`next.config.ts`)

| Alias | Redirects To |
| :--- | :--- |
| `/admin/home` | `/admin/dashboard` |
| `/admin/homepage` | `/admin/dashboard` |
| `/admin/analytics` | `/admin/reports` |
| `/admin/help` | `/admin/support` |
| `/admin/login` | `/login` |
