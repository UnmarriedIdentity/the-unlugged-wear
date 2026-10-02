# The Unplugged Wear — Frontend Workspace

A monorepo workspace for **The Unplugged Wear**, containing two independent, fully featured modern frontend applications built with **Next.js 16.3.8 (Turbopack)**, **React 19**, **Tailwind CSS v4**, and **TypeScript 5.7**.

```
unplugg/
├── tuw-website/             # Customer-facing storefront (catalog, checkout, accounts)
├── tuw-admin/               # Staff operations portal (products, orders, fulfillment, CMS)
├── TUW-Frontend-UI-Docs/    # Source specifications & design documentation
├── AGENTS.md                # Agent rules & dependency version policy
├── pnpm-workspace.yaml      # Monorepo workspace configuration
└── README.md                # Root workspace guide
```

---

## 🚀 Workspace Commands

Manage and run either application from the root workspace using `pnpm`:

```bash
# 1. Install all dependencies across the entire workspace
pnpm install

# 2. Run the customer storefront in development mode
pnpm dev:website
# Storefront: http://localhost:3000

# 3. Run the admin operations portal in development mode
pnpm dev:admin
# Admin Panel: http://localhost:3001 (or auto-assigned port)

# 4. Typecheck both projects
pnpm typecheck

# 5. Run automated business logic test suites
pnpm test

# 6. Build both projects for production
pnpm build      # Pre-renders 27 website routes + 35 admin routes
```

---

## 📦 Applications Overview

| Project | Port | Description | Routes |
|---|---|---|---|
| **[`tuw-website`](file:///d:/unplugg/tuw-website/README.md)** | `3000` | Customer-facing storefront for 500 GSM heavyweight organic apparel with real-time cart, wishlist, payment simulation, and order tracking. | **27 pre-rendered routes** |
| **[`tuw-admin`](file:///d:/unplugg/tuw-admin/README.md)** | `3001` | Operational workspace for staff to manage catalog, partner POD dispatch, orders, shipments, returns, media assets, and analytics. | **35 pre-rendered routes** |

*Both applications run independently with zero cross-app component imports.*

---

## 🎨 Design System Compliance

* **Pure Urbanist Typography**: Configured across both applications via Google Fonts and `next/font/google`. Adheres strictly to `DESIGN_SYSTEM.md` with zero mixing of Montserrat, Plus Jakarta Sans, or Inter.
* **9-Level Urbanist Type Scale**: Display (40–48px), Page Title (32px), Section (24px), Subsection (20px), Card (18px), Body Large (16px), Body Default (14px), Control Label (14px), Caption (12px).
* **Tabular Numerals**: `.tuw-tabular-nums` applied for clean numeric and currency (`₹`) alignment.
* **18-Role Admin Semantic Tokens**: Canvas (`#F7F8F9`), Surface (`#FFFFFF`), Primary Text (`#262626`), Action Primary (`#7539FF`), etc.
* **Storefront Palette**: Warm ivory canvas (`#FAF9F6`), charcoal text (`#1A1A1A`), dark purchase CTAs (`#111111`), gold accent (`#C8A96A`). Admin purple is intentionally excluded from customer purchase flows.
* **Live Design System Specimen Pages**:
  * Admin: [`http://localhost:3001/design-system`](file:///d:/unplugg/tuw-admin/src/app/(dashboard)/design-system/page.tsx)
  * Website: [`http://localhost:3000/design-system`](file:///d:/unplugg/tuw-website/src/app/design-system/page.tsx)

---

## 💾 Deterministic Mock Data & Scenarios

* **Assortment**: Focused catalog with 12 products in the storefront and 10 in admin, covering T-shirts, hoodies, jackets, pants, and lifestyle accessories. Includes edge cases: long title, missing image fallback, and unavailable sizes.
* **Commerce Fixtures**: 22+ orders across independent payment (`paid`, `pending`, `failed`, `refunded`) and fulfillment states (`queued`, `printing`, `shipped`, `delivered`, `submission_failed`).
* **Dynamic KPIs**: Dashboard totals calculate dynamically from live state (zero hardcoded numbers).
* **Test Scenarios**: Header (admin) and Footer (storefront) controls allow switching between `Normal`, `Loading`, `Empty States`, `Simulated Error`, and `Long Multiline Text`.
* **Reset Demo Action**: Restores local storage mutations back to deterministic fixtures.

---

## 📚 Project Documentation

Detailed specifications are organized in [`TUW-Frontend-UI-Docs/`](file:///d:/unplugg/TUW-Frontend-UI-Docs/README.md) and synchronized in each app's `docs/` folder:

1. [`UI_SCOPE.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/UI_SCOPE.md) — Deliverables, phase boundaries, and partner POD model.
2. [`WEBSITE_UI.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/WEBSITE_UI.md) — Storefront customer journey and commerce requirements.
3. [`ADMIN_UI.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/ADMIN_UI.md) — Operational screens, table behaviors, and mutation rules.
4. [`DESIGN_SYSTEM.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/DESIGN_SYSTEM.md) — Visual tokens, Urbanist font scale, and color roles.
5. [`COMPONENTS.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/COMPONENTS.md) — 19 reusable UI primitives contract.
6. [`MOCK_DATA.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/MOCK_DATA.md) — Typed deterministic fixtures, scenarios, and storage adapters.
7. [`RESPONSIVE_AND_ACCESSIBILITY.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/RESPONSIVE_AND_ACCESSIBILITY.md) — Breakpoints, touch targets, and WCAG AA standards.
8. [`UI_CHECKLIST.md`](file:///d:/unplugg/TUW-Frontend-UI-Docs/UI_CHECKLIST.md) — Comprehensive verification and acceptance checklist.
9. [`AGENTS.md`](file:///d:/unplugg/AGENTS.md) — Strict dependency policy and engineering standards.
