# The Unplugged Wear — Single Next.js App, Two Surfaces

One Next.js 16.3.8 (Turbopack) application serves the whole product: the customer
storefront at the root and the staff operations panel under `/admin`. It is built with
**React 19**, **Tailwind CSS v4**, and **TypeScript 5.7**, and deployed as a single Vercel
project from `tuw-website/`.

```
the-unplugged-wear/
├── tuw-website/                 # The app. Everything runs from here.
│   ├── src/app/(storefront)/    # Storefront root layout + its own globals.css
│   ├── src/app/(admin)/         # Admin root layout + its own globals.css
│   │   └── admin/               # Every /admin route
│   ├── src/admin/               # Admin components, hooks, lib, mocks (@admin/*)
│   ├── src/server/              # DB migrations + seed (@/server/*)
│   ├── src/{components,lib,mocks}/  # Storefront code
│   ├── public/                  # Shared static assets
│   ├── tests/                   # Storefront suites
│   │   └── admin/               # Admin suites
│   ├── docs/admin/              # Admin specifications
│   └── design/                  # Figma design-system exports
├── state-for-agents/
│   ├── admin/                   # Agent state for the admin surface
│   └── storefront/              # Agent state for the storefront surface
├── DOC/                         # Backend schema & API design documents
├── AGENTS.md                    # Agent rules & dependency version policy
├── pnpm-workspace.yaml
└── README.md
```

---

## Why two root layouts

Both surfaces ship a Tailwind v4 stylesheet that starts with `@import "tailwindcss"` and
redefines the same custom properties — `--font-urbanist`, `--color-surface`,
`--color-primary-*` — with different values. If one document ever loaded both files, the
later one would silently win and one surface would be repainted.

So the app has **no `src/app/layout.tsx`**. Instead each surface owns a root layout:

| Surface | Route group | Entry |
|---|---|---|
| Storefront | `src/app/(storefront)/` | `layout.tsx` + `globals.css` |
| Admin panel | `src/app/(admin)/` | `layout.tsx` + `globals.css` |

Next.js therefore performs a full page load when crossing the boundary, which guarantees
exactly one stylesheet is ever present. Route groups are URL-transparent, so the storefront
keeps `/`, `/shop`, `/account`, … and the admin owns everything under `/admin/**`.

---

## 🚀 Commands

All commands run from the repository root and delegate to `tuw-website`:

```bash
# 1. Install dependencies for the workspace
pnpm install

# 2. Development server on port 3007 — serves BOTH surfaces
pnpm dev
# Storefront:  http://localhost:3007
# Admin panel: http://localhost:3007/admin/dashboard

# 3. Typecheck the app (strict mode, zero errors)
pnpm typecheck

# 4. Run every test suite (storefront + admin)
pnpm test

# 5. Production build (storefront + admin routes pre-rendered)
pnpm build

# 6. Start the production server
pnpm start
```

---

## 🔐 Surfaces at a glance

| Surface | Entry URL | Description | Routes |
|---|---|---|---|
| **Storefront** | `/` | Customer-facing shop for heavyweight organic apparel: catalog, PDP, cart, simulated Razorpay checkout, account, order tracking. | 36 routes |
| **Admin panel** | `/admin` (redirects to `/admin/dashboard`) | Operating workspace for staff: catalog, orders, POD fulfillment, shipments, returns, refunds, CMS, team, settings, reports. | 41 routes |

Full route tables: [`ROUTES.md`](./ROUTES.md) and [`tuw-website/ENDPOINTS.md`](./tuw-website/ENDPOINTS.md).

### Demo sign-in

Both surfaces are mock-only right now — there is no server, no real auth, and nothing is
charged. The accounts live in [`tuw-website/src/mocks/auth.ts`](./tuw-website/src/mocks/auth.ts):

| Account | Email | Password | Lands on |
|---|---|---|---|
| Customer | `uk1115@tuw.co` | `uktuw1115` | `/account` |
| Admin | `admin@tuw.co` | `tuwadmin123` | `/admin/dashboard` |

The storefront login (`/login`) is the single sign-in for both surfaces and routes by
role, so signing in as the admin hands straight over to the panel. There is no separate
admin login screen.

---

## 🎨 Design System Compliance

The two surfaces deliberately keep **separate** design systems. Neither imports the other's
tokens, components, or stylesheet.

* **Admin — Urbanist / 18 semantic roles**: `--color-surface: #FFFFFF`, action primary
  `#7539FF`, canvas `#F7F8F9`. Specimen at `/admin/design-system`.
* **Storefront — Outfit / warm editorial palette**: ivory canvas `#FAF9F6`, charcoal text
  `#1A1A1A`, dark purchase CTA `#111111`, gold accent `#C8A96A`. Admin purple never
  appears in a customer purchase flow. Specimen at `/design-system`.

---

## 💾 Deterministic Mock Data & Scenarios

* **Assortment**: Focused catalog with 12 products in the storefront and 10 in admin, covering T-shirts, hoodies, jackets, pants, and lifestyle accessories. Includes edge cases: long title, missing image fallback, and unavailable sizes.
* **Commerce Fixtures**: 22+ orders across independent payment (`paid`, `pending`, `failed`, `refunded`) and fulfillment states (`queued`, `printing`, `shipped`, `delivered`, `submission_failed`).
* **Dynamic KPIs**: Dashboard totals calculate dynamically from live state (zero hardcoded numbers).
* **Test Scenarios**: Header (admin) and Footer (storefront) controls allow switching between `Normal`, `Loading`, `Empty States`, `Simulated Error`, and `Long Multiline Text`.
* **Reset Demo Action**: Restores local storage mutations back to deterministic fixtures.

---

## 📚 Project Documentation

* [`tuw-website/docs/`](./tuw-website/docs) — storefront specifications.
* [`tuw-website/docs/admin/`](./tuw-website/docs/admin) — admin specifications (`ADMIN_UI.md`, `COMPONENTS.md`, `MOCK_DATA.md`, …).
* [`tuw-website/TUW-Frontend-UI-Docs/`](./tuw-website/TUW-Frontend-UI-Docs) — source Figma-driven specifications.
* [`state-for-agents/`](./state-for-agents) — resumable agent state, split per surface.
* [`DOC/`](./DOC) — backend schema and API design.
* [`AGENTS.md`](./AGENTS.md) — dependency version policy and engineering standards.
