# The Unplugged Wear — Customer Storefront (`tuw-website`)

A high-craft, editorial ecommerce storefront for **The Unplugged Wear**, built with **Next.js 16.3.8 (Turbopack)**, **React 19**, **Tailwind CSS v4**, and **TypeScript 5.7**.

Dedicated to quiet permanence and heavyweight organic garments (500 GSM French terry, 280 GSM combed jersey) printed purely on-demand with zero deadstock.

---

## ⚡ Quick Start & Commands

```bash
# 1. Install dependencies
pnpm install

# 2. Start the local development server (Turbopack)
pnpm run dev
# Running at: http://localhost:3000 (or http://localhost:3001 if admin is active)

# 3. Validate TypeScript types
pnpm run typecheck

# 4. Run automated business logic tests
pnpm run test

# 5. Create an optimized production build (pre-renders all 27 routes)
pnpm run build

# 6. Start the production server
pnpm run start
```

---

## 🎨 Design System & Storefront Theme

* **Pure Urbanist Typography**: Configured in `src/app/layout.tsx` via `next/font/google` (`Urbanist:wght@300..800`). No font mixing with Montserrat or Plus Jakarta Sans.
* **Storefront Palette**:
  * Canvas: Warm ivory `#FAF9F6`
  * Surface: Pure white `#FFFFFF`
  * Typography: Deep charcoal `#1A1A1A`
  * Borders: Subdued neutral `#E8E6E1`
  * Accent: Refined gold `#C8A96A`
  * Purchase CTA Buttons: High-contrast solid dark `#111111` with white text `#FFFFFF`
  * *Note: Admin purple (`#7539FF`) is excluded from purchase buttons per `DESIGN_SYSTEM.md`.*
* **Interactive Design System Specimen**: Available in the app at [`/design-system`](file:///d:/unplugg/tuw-website/src/app/design-system/page.tsx).

---

## 🛍️ Commerce Components & Interactions

* **Cart Drawer (`CartDrawer.tsx`)**: Slide-over drawer with real-time free shipping threshold tracker (free delivery over ₹3,000), quantity counters, item removal, and promo code redemption (`UNPLUG10`).
* **Product Card (`ProductCard.tsx`)**: Interactive color swatches with thumbnail switching, quick-add size selection pills, and bestseller/new arrival badges.
* **Product Gallery (`ProductGallery.tsx`)**: Thumbnail carousel and modal zoom preview for examining 500 GSM loopback cotton textures.
* **Size Guide (`SizeGuideModal.tsx`)**: Dynamic unit conversion between centimeters and inches for Chest, Length, Sleeve, and Shoulder.
* **Payment Simulator (`PaymentSimulationPanel.tsx`)**:
  * Payment options: **UPI** (GPay, PhonePe, Paytm QR simulation), **Credit/Debit Card** (fictitious cards), and **Cash on Delivery**.
  * Testing Scenarios: Success, Declined, and Gateway Timeout test buttons.
  * Successful simulation creates a persistent mock order in `tuw_website_v2_orders` and updates account history.

---

## 💾 Mock Store & Local State Adapter (`src/mocks/`)

* **Focused Assortment (12 Products)**:
  * 8 apparel items: Monolith Hoodie, Atelier Boxy Tee, Solitude Pleated Pant, Kinetic Crewneck, Oversized Zip Hoodie (**long title edge case**), Technical Shell Bomber, Thermal Waffle Tee (**missing image fallback edge case**), Chore Coat, Ripstop Windbreaker.
  * 3 lifestyle items: Monograph Heavy Canvas Carryall (18oz duck canvas tote), Distressed Chino Cap, Brushed Cashmere Studio Blanket.
  * Unavailable size edge cases (XXL / XS out of stock).
  * Integer minor-unit INR prices (`priceINR: 3899`, `priceMinorINR: 389900`).
* **Commerce Fixtures (22 Orders)**:
  * Spans independent payment (`paid`, `pending`, `failed`, `refunded`) and fulfillment states (`queued`, `printing`, `shipped`, `delivered`, `submission_failed`).
  * Fictitious customer identities (`@example.com`).
* **Demo Scenarios & Testing Controls**:
  * Controlled via the bottom footer ribbon: **Normal**, **Empty States**, **Simulated Error**, **Long Multiline Text**.
  * **Reset Demo State**: Purges local storage mutations and restores baseline fixtures.

---

## 🗺️ Storefront Route Directory (27 Pre-Rendered Routes)

* `/`: Brand Landing Page (hero, values, product grid, lookbook, journal previews)
* `/shop`: Catalog browsing with desktop filter bar & mobile filter drawer
* `/products/[slug]`: Rich Product Detail Page (gallery, color/size selector, size guide, accordion specifications, customer reviews)
* `/collections`: Seasonal capsule collections overview
* `/collections/[slug]`: Capsule collection landing page
* `/cart`: Shopping bag view
* `/checkout`: Multi-step checkout with address selection and payment simulation
* `/search`: Instant catalog search
* `/wishlist`: Saved garments with one-click transfer to cart
* `/account`: Customer portal with order history, addresses, and returns
* `/track-order`: Live shipment tracking with carrier status checkpoints
* `/about`: Brand story & architectural textile philosophy
* `/about/sustainability`: Zero-deadstock POD manifesto and water-based pigment curing
* `/journal`: Editorial essays and stories
* `/journal/[slug]`: Longform article reader
* `/faq`: Customer questions, care instructions, and garment fit notes
* `/size-guide`: Detailed sizing charts and measurement guides
* `/contact`: Atelier concierge and studio inquiry form
* `/policies/*`: Returns & Exchanges, Shipping, Privacy, Terms of Service
* `/design-system`: Storefront component and type scale specimen
* `/login`, `/register`, `/forgot-password`, `/reset-password`: Customer authentication flows
