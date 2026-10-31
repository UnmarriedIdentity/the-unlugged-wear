# The Unplugged Wear — Customer Storefront (`TUW-Website`)

[![Live Deployment](https://img.shields.io/badge/Live_Site-tuw--storefront.vercel.app-10B981?style=for-the-badge&logo=vercel)](https://tuw-storefront.vercel.app/)
[![GitHub Branch](https://img.shields.io/badge/GitHub_Branch-preview-blue?style=for-the-badge&logo=github)](https://github.com/UnmarriedIdentity/TUW-Website/tree/preview)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)

A high-craft, editorial ecommerce storefront for **The Unplugged Wear**, crafted with **Next.js 16.3.8 (Turbopack)**, **React 19**, **Tailwind CSS v4**, and **TypeScript 5.7**.

Dedicated to quiet permanence and heavyweight organic garments (500 GSM French terry, 280 GSM combed jersey) printed purely on-demand with zero deadstock.

---

## 🌐 Live Production Deployment

* **Production URL**: **[https://tuw-storefront.vercel.app/](https://tuw-storefront.vercel.app/)**
* **Deployment Platform**: Vercel (Edge Network)
* **GitHub Repository**: [UnmarriedIdentity/TUW-Website (Branch: preview)](https://github.com/UnmarriedIdentity/TUW-Website/tree/preview)

---


### 🛍️ Complete Verified Product Detail Page (PDP) Matrix

| Preview | Product Piece | Category | Price | Local Dev URL (`:3007`) | Live Hosted URL (Vercel) | Dynamic Features & Spec Logic |
|:---:|---|---|---|---|---|---|
| <img src="https://tuw-storefront.vercel.app/products/2.jpeg" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Monolith Hoodie" /> | **Monolith Heavyweight Hoodie** | Hoodies | ₹3,899 | [localhost:3007/products/...](http://localhost:3007/products/monolith-heavyweight-hoodie-vintage-black) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/monolith-heavyweight-hoodie-vintage-black) | • Colorway gallery swaps<br>• Packaging Radio (+₹250)<br>• Sizing Table (CM/IN)<br>• 500 GSM loopback cotton |
| <img src="https://tuw-storefront.vercel.app/products/1.jpeg" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Atelier Tee" /> | **Atelier Raw-Edge Relaxed Tee** | Tees | ₹2,199 | [localhost:3007/products/...](http://localhost:3007/products/atelier-raw-edge-relaxed-tee) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/atelier-raw-edge-relaxed-tee) | • **Dynamic Cloth Textures Table** (4-column fiber comparison)<br>• 280 GSM combed organic jersey |
| <img src="https://tuw-storefront.vercel.app/products/3.jpeg" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Canvas Trousers" /> | **Solitude Wide-Leg Canvas Trousers** | Pants | ₹4,299 | [localhost:3007/products/...](http://localhost:3007/products/solitude-wide-leg-canvas-trousers) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/solitude-wide-leg-canvas-trousers) | • Waist & Inseam sizing matrix<br>• Pleated front & duck canvas construction |
| <img src="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Crewneck Fleece" /> | **Kinetic Heavy Fleece Crewneck** | Hoodies | ₹3,499 | [localhost:3007/products/...](http://localhost:3007/products/unplugged-oversized-crewneck-slate) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/unplugged-oversized-crewneck-slate) | • Architectural drop shoulder<br>• CM/IN measurement toggle<br>• Apparel FAQs |
| <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Zip Hoodie" /> | **Architectural Drop-Shoulder Zip Hoodie** | Hoodies | ₹4,499 | [localhost:3007/products/...](http://localhost:3007/products/architectural-zip-hoodie) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/architectural-zip-hoodie) | • 520 GSM extra-dense terry<br>• Two-way matte gunmetal zipper<br>• Thermal ribbed side gussets |
| <img src="https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Bomber Jacket" /> | **Technical Shell Modular Bomber Jacket** | Jackets | ₹5,899 | [localhost:3007/products/...](http://localhost:3007/products/technical-shell-modular-bomber-jacket) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/technical-shell-modular-bomber-jacket) | • 3-layer waterproof membrane<br>• Aquaguard bonded zippers<br>• Hands-free interior carry strap |
| <img src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Thermal Waffle Tee" /> | **Raw Hem Heavyweight Thermal Waffle Tee** | Tees | ₹2,699 | [localhost:3007/products/...](http://localhost:3007/products/raw-hem-heavyweight-thermal-waffle-tee) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/raw-hem-heavyweight-thermal-waffle-tee) | • 360 GSM honeycomb knit<br>• Graceful image fallback state<br>• Sizing guide & fit indicator |
| <img src="https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Chore Coat" /> | **Japanese Selvedge Chore Coat** | Jackets | ₹6,499 | [localhost:3007/products/...](http://localhost:3007/products/japanese-selvedge-cotton-chore-coat) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/japanese-selvedge-cotton-chore-coat) | • 14.5 oz shuttle-loomed selvedge<br>• Hand-hammered copper rivets<br>• Outerwear sizing table |
| <img src="https://images.unsplash.com/photo-1544441893-675973e31985?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Ripstop Windbreaker" /> | **Minimalist Modular Ripstop Windbreaker** | Jackets | ₹4,199 | [localhost:3007/products/...](http://localhost:3007/products/modular-lightweight-ripstop-windbreaker) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/modular-lightweight-ripstop-windbreaker) | • Diamond micro-ripstop shell<br>• Self-stowing hood system<br>• Weatherproof storm baffle |
| <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Carryall Tote" /> | **Heavy Canvas Utility Carryall Tote** | Accessories | ₹1,899 | [localhost:3007/products/...](http://localhost:3007/products/heavy-canvas-utility-carryall-tote) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/heavy-canvas-utility-carryall-tote) | • Size pills strictly hidden<br>• **Strap Radio Options** (Drop ₹0 vs Crossbody **+₹150**)<br>• 28L volume & dimensional specs |
| <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Dad Cap" /> | **Low-Profile Distressed Dad Cap** | Accessories | ₹1,499 | [localhost:3007/products/...](http://localhost:3007/products/washed-cotton-dad-cap-minimal) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/washed-cotton-dad-cap-minimal) | • Size pills hidden<br>• **Strict Table Omission** (`specTable: null`)<br>• Antique brass slide closure |
| <img src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Ceramic Mug" /> | **Stoneware Emblem Ceramic Mug** | Living Objects | ₹1,290 | [localhost:3007/products/...](http://localhost:3007/products/stoneware-emblem-ceramic-mug) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/stoneware-emblem-ceramic-mug) | • **Capacity chips** (**350ml / 450ml**)<br>• 1,240°C kiln-firing & density specs<br>• Food-safe glaze disclosures |
| <img src="https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Kids Emblem Tee" /> | **Kids Organic Cotton Emblem Tee** | Kids | ₹1,490 | [localhost:3007/products/...](http://localhost:3007/products/kids-organic-cotton-emblem-tee) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/kids-organic-cotton-emblem-tee) | • **Age chips** (**2-3Y to 10-11Y**)<br>• **Kids Growth Chart** (Height, Chest, Waist, Weight)<br>• Anti-chafe flatlock seams |
| <img src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=200&auto=format&fit=crop&q=80" width="60" height="72" style="object-fit:cover;border-radius:6px;" alt="Studio Blanket" /> | **Brushed Cashmere Studio Blanket** | Living Objects | ₹4,999 | [localhost:3007/products/...](http://localhost:3007/products/brushed-cashmere-ribbed-studio-blanket) | [tuw-storefront.vercel.app/...](https://tuw-storefront.vercel.app/products/brushed-cashmere-ribbed-studio-blanket) | • **Strict Table Omission** (`specTable: null`)<br>• Size pills hidden<br>• Edge finish radio options (**+₹300**) |

---

## 🗺️ Live Storefront Route & Endpoint Directory

Every storefront route is deployed live, pre-rendered with zero runtime external database dependencies, and accessible directly via the links below:

| # | Live Endpoint Link | Page / Feature | Description | Status |
|---|---|---|---|:---:|
| 1 | [**`/`**](https://tuw-storefront.vercel.app/) | **Home Page** | Editorial landing page with hero, brand values, selected essentials, capsule series, and the Rolls-Royce scroll-morph navbar. | 🟢 Live |
| 2 | [**`/login`**](https://tuw-storefront.vercel.app/login) | **Customer Login** | Standalone pixel-perfect authentication screen matching Figma Node `233:11587` with lifestyle hero imagery, password eye toggle, and demo sandbox login. | 🟢 Live |
| 3 | [**`/register`**](https://tuw-storefront.vercel.app/register) | **Customer Registration** | Standalone pixel-perfect registration screen matching Figma Node `233:11647` with lifestyle hero imagery and form validation. | 🟢 Live |
| 4 | [**`/forgot-password`**](https://tuw-storefront.vercel.app/forgot-password) | **Forgot Password** | Secure password reset request flow with email validation and simulated recovery dispatch. | 🟢 Live |
| 5 | [**`/reset-password`**](https://tuw-storefront.vercel.app/reset-password) | **Reset Password** | New password confirmation view with token validation and security guidelines. | 🟢 Live |
| 6 | [**`/design-system`**](https://tuw-storefront.vercel.app/design-system) | **Design System Specimen** | Interactive specimen showcasing Outfit typography, 3-tier color tokens, 1612×529 auto-layout frame metrics, and UI component catalog. | 🟢 Live |
| 7 | [**`/shop`**](https://tuw-storefront.vercel.app/shop) | **Catalog & Shop** | Complete product browsing with desktop FilterBar, mobile slide-over filter drawer, sort dropdown, and active filter pills. | 🟢 Live |
| 8 | [**`/products/[slug]`**](https://tuw-storefront.vercel.app/products/monolith-heavyweight-hoodie-vintage-black) | **Product Detail Page (PDP)** | Architectural PDP with thumbnail gallery, interactive color/size selectors, stock counters, accordions, and customer reviews. | 🟢 Live |
| 9 | [**`/collections`**](https://tuw-storefront.vercel.app/collections) | **Capsule Collections** | Seasonal slow-fashion capsule overview with high-res lookbook banners and garment counts. | 🟢 Live |
| 10 | [**`/collections/[slug]`**](https://tuw-storefront.vercel.app/collections/winter-monolith) | **Capsule Detail** | Dedicated capsule collection view with curated matching product grid. | 🟢 Live |
| 11 | [**`/cart`**](https://tuw-storefront.vercel.app/cart) | **Shopping Bag** | Full-page shopping cart with free-shipping threshold tracker (₹3,000 threshold), item quantity controls, and coupon code entry. | 🟢 Live |
| 12 | [**`/checkout`**](https://tuw-storefront.vercel.app/checkout) | **Checkout & Simulation** | Multi-step checkout with address selection and interactive Payment Simulation Panel (UPI QR, Card, COD). | 🟢 Live |
| 13 | [**`/search`**](https://tuw-storefront.vercel.app/search) | **Catalog Search** | Instant product and collection search overlay and dedicated results page. | 🟢 Live |
| 14 | [**`/wishlist`**](https://tuw-storefront.vercel.app/wishlist) | **Saved Garments** | Customer wishlist with real-time counter in header and one-click add to cart. | 🟢 Live |
| 15 | [**`/account`**](https://tuw-storefront.vercel.app/account) | **Customer Account Portal** | Account overview with order history, saved addresses, profile settings, and returns management. | 🟢 Live |
| 16 | [**`/track-order`**](https://tuw-storefront.vercel.app/track-order) | **Order Tracking** | Real-time shipment tracker supporting reference lookups (e.g., `TUW-98214-DEL`) with chronological checkpoint milestones. | 🟢 Live |
| 17 | [**`/about`**](https://tuw-storefront.vercel.app/about) | **Brand Philosophy** | The Unplugged Wear founding story, slow-living philosophy, and Tiruppur craft manifesto. | 🟢 Live |
| 18 | [**`/about/sustainability`**](https://tuw-storefront.vercel.app/about/sustainability) | **Sustainability & POD** | Zero-deadstock on-demand manufacturing manifesto, 500 GSM loopback cotton sourcing, and eco-certified water dyes. | 🟢 Live |
| 19 | [**`/journal`**](https://tuw-storefront.vercel.app/journal) | **Editorial Journal** | Slow-living publications, design essays, and behind-the-scenes craft stories. | 🟢 Live |
| 20 | [**`/journal/[slug]`**](https://tuw-storefront.vercel.app/journal/the-anatomy-of-500-gsm-cotton) | **Longform Article View** | Clean editorial typography reader with author byline, publication dates, and related articles. | 🟢 Live |
| 21 | [**`/faq`**](https://tuw-storefront.vercel.app/faq) | **Frequently Asked Questions** | Interactive accordion FAQ covering sizing, garment care, shipping timelines, and POD practices. | 🟢 Live |
| 22 | [**`/size-guide`**](https://tuw-storefront.vercel.app/size-guide) | **Interactive Size Guide** | Sizing tables with dynamic centimeter/inch unit toggles across Chest, Length, Sleeve, and Shoulder. | 🟢 Live |
| 23 | [**`/contact`**](https://tuw-storefront.vercel.app/contact) | **Concierge & Inquiries** | Atelier contact form, customer concierge details, and wholesale studio inquiries. | 🟢 Live |
| 24 | [**`/policies`**](https://tuw-storefront.vercel.app/policies) | **Policy Hub** | Centralized legal and customer service policy navigation. | 🟢 Live |
| 25 | [**`/policies/privacy`**](https://tuw-storefront.vercel.app/policies/privacy) | **Privacy Policy** | Comprehensive data protection and privacy policy. | 🟢 Live |
| 26 | [**`/policies/terms`**](https://tuw-storefront.vercel.app/policies/terms) | **Terms of Service** | Store terms of service and order agreements. | 🟢 Live |
| 27 | [**`/policies/shipping`**](https://tuw-storefront.vercel.app/policies/shipping) | **Shipping & Delivery Policy** | Production turnaround and courier delivery timelines. | 🟢 Live |
| 28 | [**`/policies/returns`**](https://tuw-storefront.vercel.app/policies/returns) | **Returns & Exchanges** | 14-day unworn garment return and exchange guidelines. | 🟢 Live |
| 29 | [**`/_not-found`**](https://tuw-storefront.vercel.app/non-existent-page) | **Custom 404 Experience** | Architectural slow-fashion 404 page with quick recovery links back to the catalog. | 🟢 Live |

---

## 🛍️ Dynamic Product Detail Page (PDP) Directory

Every product detail page adapts dynamically to the product's attributes — rendering custom tables (sizing charts, textile fiber integrity, or ceramic specs), radio selectors with real-time price adjustments, capacity or age pills, or strictly omitting empty sections:

### 🌟 Dynamic Showcase Scenarios

| Product Piece | Category | Live Hosted URL (Vercel) | Local Dev URL | Dynamic Features & Verification |
|---|---|---|---|---|
| **Monolith Heavyweight Hoodie** | Hoodies | [View on Hosted Site](https://tuw-storefront.vercel.app/products/monolith-heavyweight-hoodie-vintage-black) | [`:3007/products/...`](http://localhost:3007/products/monolith-heavyweight-hoodie-vintage-black) | • Colorway gallery swaps<br>• XS–XXL size pills with stock counters<br>• **Packaging Radio Group** (Kraft ₹0 vs Keepsake Box **+₹250**)<br>• Sizing Table with CM / IN toggle<br>• Apparel FAQs |
| **Atelier Raw-Edge Boxy Tee** | Tees | [View on Hosted Site](https://tuw-storefront.vercel.app/products/atelier-raw-edge-relaxed-tee) | [`:3007/products/...`](http://localhost:3007/products/atelier-raw-edge-relaxed-tee) | • **Dynamic Cloth Textures Table**: switches from sizing to **Textile Integrity & Fiber Characteristics** (4 comparison columns)<br>• 240 GSM organic cotton specs<br>• Apparel FAQs |
| **Heavy Canvas Utility Tote** | Accessories | [View on Hosted Site](https://tuw-storefront.vercel.app/products/heavy-canvas-utility-carryall-tote) | [`:3007/products/...`](http://localhost:3007/products/heavy-canvas-utility-carryall-tote) | • **Size pills strictly hidden** (`sizes: []`)<br>• **Strap Radio Group** (Shoulder Drop ₹0 vs Padded Crossbody **+₹150**)<br>• Utilitarian Bag Dimensions & 28L volume specs |
| **Stoneware Emblem Ceramic Mug** | Living Objects | [View on Hosted Site](https://tuw-storefront.vercel.app/products/stoneware-emblem-ceramic-mug) | [`:3007/products/...`](http://localhost:3007/products/stoneware-emblem-ceramic-mug) | • **Capacity pills** (**350ml / 450ml**) instead of apparel sizes<br>• Glaze finish swatches (Matte Obsidian, Raw Bone, Celadon)<br>• 1,240°C kiln-firing & craft specs table<br>• Lead-free food-safe FAQs |
| **Kids Organic Cotton Emblem Tee** | Kids | [View on Hosted Site](https://tuw-storefront.vercel.app/products/kids-organic-cotton-emblem-tee) | [`:3007/products/...`](http://localhost:3007/products/kids-organic-cotton-emblem-tee) | • **Age & growth chips** (**2-3Y, 4-5Y, 6-7Y, 8-9Y, 10-11Y**)<br>• Kids Growth Chart (Height, Chest, Waist, Weight)<br>• Anti-chafe flatlock seams & organic dye disclosures |
| **Brushed Cashmere Studio Blanket** | Living Objects | [View on Hosted Site](https://tuw-storefront.vercel.app/products/brushed-cashmere-ribbed-studio-blanket) | [`:3007/products/...`](http://localhost:3007/products/brushed-cashmere-ribbed-studio-blanket) | • **Strict Omission Law**: `specTable: null` completely omits the table section from the DOM (zero empty containers or gaps)<br>• Size pills hidden<br>• Edge finish radio options (**+₹300**) |

### 🧥 Complete Storefront Apparel & Outerwear Catalog

| Product Piece | Category | Price | Live Hosted URL (Vercel) | Local Dev URL |
|---|---|---|---|---|
| **Wide-Leg Canvas Trousers** | Pants | ₹4,299 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/solitude-wide-leg-canvas-trousers) | [`:3007/products/...`](http://localhost:3007/products/solitude-wide-leg-canvas-trousers) |
| **Kinetic Heavy Fleece Crewneck** | Hoodies | ₹3,499 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/unplugged-oversized-crewneck-slate) | [`:3007/products/...`](http://localhost:3007/products/unplugged-oversized-crewneck-slate) |
| **Architectural Drop-Shoulder Zip Hoodie** | Hoodies | ₹4,499 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/architectural-zip-hoodie) | [`:3007/products/...`](http://localhost:3007/products/architectural-zip-hoodie) |
| **Technical Shell Modular Bomber Jacket** | Jackets | ₹5,899 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/technical-shell-modular-bomber-jacket) | [`:3007/products/...`](http://localhost:3007/products/technical-shell-modular-bomber-jacket) |
| **Raw Hem Thermal Waffle Tee** | Tees | ₹2,699 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/raw-hem-heavyweight-thermal-waffle-tee) | [`:3007/products/...`](http://localhost:3007/products/raw-hem-heavyweight-thermal-waffle-tee) |
| **Japanese Selvedge Chore Coat** | Jackets | ₹6,499 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/japanese-selvedge-cotton-chore-coat) | [`:3007/products/...`](http://localhost:3007/products/japanese-selvedge-cotton-chore-coat) |
| **Minimalist Modular Ripstop Windbreaker** | Jackets | ₹4,199 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/modular-lightweight-ripstop-windbreaker) | [`:3007/products/...`](http://localhost:3007/products/modular-lightweight-ripstop-windbreaker) |
| **Low-Profile Distressed Dad Cap** | Accessories | ₹1,499 | [View on Hosted Site](https://tuw-storefront.vercel.app/products/washed-cotton-dad-cap-minimal) | [`:3007/products/...`](http://localhost:3007/products/washed-cotton-dad-cap-minimal) |

---

## 🎨 Visual Identity & Navigation Invariants

1. **Brand Aesthetics**:
   - Canvas: Warm Ivory (`#FCFAF6` / `--tuw-store-canvas`)
   - Surface: Pure White (`#FFFFFF`)
   - Typography: Deep Charcoal (`#0F0F0F` / `#1A1A1A`)
   - Accent: Refined Gold (`#C8A96A`) & Secondary Teal (`#005B6C`)
   - Headings: **Outfit** (`--font-heading`, uppercase tracking)
   - Body & Controls: **Outfit** (`--font-sans`, weights 300 to 800)

2. **Rolls-Royce Inspired Header Animation**:
   - **Top Bar (36px, `#171535`)**: Displays Blogs, FAQ's, Support, 4 social vector icons, and interactive currency selector (USD, INR, EUR, GBP).
   - **Main Bar (73px, `#FCFAF6`)**:
     - At the top of the page, the center brand displays **THE UNPLUGGED WEAR** wordmark in Outfit uppercase.
     - As the user scrolls (`scrollY > 24px`), the wordmark smoothly morphs into the **Official Leaping Deer Silhouette Emblem** with zero layout shift (CLS = 0).
     - As the user scrolls back to top, it seamlessly reverses back to the full wordmark.

3. **Browser Tab Icon**:
   - Official black leaping deer logo configured as `/icon.png` (512×512) and `/favicon.ico` in app layout metadata.

---

## ⚡ Local Development Commands

```bash
# Install dependencies
pnpm install

# Start local Turbopack dev server on port 3007
pnpm run dev

# Validate TypeScript (strict mode, zero errors)
pnpm run typecheck

# Execute unit test suites (10/10 green)
pnpm run test

# Run production build (all 29 routes prerendered)
pnpm run build

# Start production server
pnpm run start
```

### Scope

This package is the customer storefront only. The staff operations panel is a separate
package in the same workspace, `tuw-admin`, with its own `src/`, its own root layout and its
own Tailwind stylesheet. The two never import each other's source, so the storefront's
Outfit/warm-editorial tokens and the admin's Urbanist/violet tokens can never leak into one
another.

`pnpm run dev` (or `pnpm dev:website` from the workspace root) starts this app on port 3007:

* Storefront — <http://localhost:3007/>
* Admin panel — separate app, port 3001 (`pnpm dev:admin`)

### Internal QA pages

`/design-system` and `/checklist` are internal tools. They work in `pnpm run dev`, and return 404 in production builds. They are prerendered, so to keep them on a deployment the variable must be set when building (on Vercel, add it as a project environment variable):

```bash
TUW_INTERNAL_PAGES=1 pnpm run build
```

### Demo sign-in

Login is a local demo: there is no server, and only the seeded demo account can sign in. Its email and password live in `src/storefront/mocks/auth.ts` (`DEMO_ACCOUNT`), and the login page has a **Fill in the demo account** button. Signing in as `uk1115@tuw.co` unlocks `/account` and its order pages, and fills checkout with the account's saved address; guests can still check out by typing their details. Payments are simulated on the checkout page and nothing is charged.

The admin panel has its own sign-in at `/login` on its own origin.
