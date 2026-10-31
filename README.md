# The Unplugged Wear — Frontend Workspace

A pnpm workspace holding **two independent Next.js applications**: the customer storefront and
the staff operations panel. Both are Next.js 16.3.8 (Turbopack) + React 19 + Tailwind CSS v4 +
TypeScript 5.7, and both deploy separately.

They are separate packages, not route groups of one app, because each ships its own Tailwind v4
stylesheet that redefines the same custom properties — `--font-urbanist`, `--color-surface`,
`--color-primary-*` — with different values. If one document ever loaded both files, the later
one would silently win and one product would be repainted. Two packages make that impossible by
construction, and let each app be built, released and rolled back on its own.

```
the-unplugged-wear/
├── tuw-website/                 # Storefront — port 3007, deployed on its own
│   ├── src/app/                 # Every storefront route (thin, SEO-focused)
│   ├── src/storefront/          # @storefront/* — components, lib, mocks
│   ├── public/                  # Fonts, logos, product imagery, videos
│   ├── tests/                   # node:test suites
│   ├── docs/                    # Storefront specifications
│   └── vercel.json
├── tuw-admin/                   # Staff operations panel — port 3001, deployed on its own
│   ├── src/app/                 # Auth screens + the (dashboard) route group
│   ├── src/{components,hooks,lib,mocks}/   # @/* — the panel's own design system
│   ├── src/server/              # @/server/* — DB migrations and seed SQL
│   ├── public/, design/, docs/
│   ├── tests/
│   └── vercel.json
├── TUW-Frontend-UI-Docs/        # Source Figma-driven specifications (both apps)
├── DOC/backend/                 # Backend schema and API design documents
├── state-for-agents/
│   ├── admin/                   # Resumable agent state for the panel
│   └── storefront/              # Resumable agent state for the storefront
├── AGENTS.md                    # Agent rules and dependency version policy
├── ROUTES.md                    # Route directory for both apps
├── pnpm-workspace.yaml
├── pnpm-lock.yaml               # One lockfile for the whole workspace
└── README.md
```

---

## Workspace commands

All commands run from the repository root and delegate to the package they belong to.

```bash
pnpm install          # install both apps from the root lockfile

pnpm dev:website      # storefront on http://localhost:3007
pnpm dev:admin        # admin panel on http://localhost:3001

pnpm typecheck        # tsc --noEmit in both packages
pnpm test             # node:test suites in both packages

pnpm build            # production build of both packages
pnpm start:website    # serve the built storefront on 3007
pnpm start:admin      # serve the built panel on 3001
```

`pnpm typecheck`, `pnpm test` and `pnpm build` are aggregates: they run the admin first and stop
if it fails.

---

## The two applications

| | [`tuw-website`](./tuw-website) | [`tuw-admin`](./tuw-admin) |
|---|---|---|
| Purpose | Customer shop: catalog, PDP, cart, checkout, account, order tracking | Staff workspace: catalog, orders, POD fulfillment, shipments, returns, refunds, CMS, team, settings |
| Dev port | `3007` | `3001` |
| Routes | `src/app/**` — `/`, `/shop`, `/products/[slug]`, `/checkout`, `/account/**`, … | `src/app/**` — `/login`, `/dashboard`, `/orders`, `/settings/**`, … |
| Source root | `src/storefront/**` via `@storefront/*` | `src/{components,hooks,lib,mocks}/**` via `@/*` |
| Stylesheet | `src/app/globals.css` — Outfit, warm editorial palette | `src/app/globals.css` — Urbanist, 18 violet/action roles |
| Vercel Root Directory | `tuw-website` | `tuw-admin` |

**Zero cross-package imports.** No file in `tuw-website` imports from `tuw-admin` and vice versa.
That is what keeps `Badge`, `Button`, `Modal`, `Tabs`, `cn`, `format` and twenty other names free
to exist twice with different implementations.

---

## Demo sign-in

Both apps are mock-only: there is no server, no real auth, and nothing is charged.

| App | Email | Password | Lands on |
|---|---|---|---|
| Storefront | `uk1115@tuw.co` | `uktuw1115` | `/account` |
| Admin | `contactstylehub@gmail.com` | anything except `wrong` / `error` | `/dashboard` |

The storefront account is seeded in `tuw-website/src/storefront/mocks/auth.ts` and owns the fixture
orders; the login page has a **Fill in the demo account** button. The admin's login screen accepts
any non-error password so its Figma error states can be reproduced with `?state=error`.

---

## Design system compliance

The two packages deliberately keep separate design systems, so neither can inherit the other's
tokens.

* **Admin — Urbanist, 18 semantic roles**: canvas `#F7F8F9`, surface `#FFFFFF`, primary text
  `#262626`, action primary `#7539FF`. Specimen at `/design-system` on port 3001.
* **Storefront — Outfit, warm editorial palette**: ivory canvas `#FAF9F6`, charcoal text
  `#1A1A1A`, dark purchase CTA `#111111`, gold accent `#C8A96A`. Admin violet never appears in a
  customer purchase flow. Specimen at `/design-system` on port 3007.

---

## Deployment

Two Vercel projects from this one repository. **Root Directory is a project setting** (Settings →
Build and Deployment), not a `vercel.json` key — each app's `vercel.json` only pins
`"framework": "nextjs"`.

| Project | Root Directory | Notes |
|---|---|---|
| Storefront | `tuw-website` | Vercel reads the package manager from the repo-root `pnpm-lock.yaml` |
| Admin | `tuw-admin` | Same lockfile; env vars are set per project |

Each package carries its own `.env.example`. Leaving Root Directory at the repository root would
drop the Next.js runtime preset, which breaks `/api/**`, dynamic routes and image optimization.

---

## Documentation

* [`ROUTES.md`](./ROUTES.md) — every route in both apps, with redirects and state query params.
* [`TUW-Frontend-UI-Docs/`](./TUW-Frontend-UI-Docs) — UI scope, design system, component contract,
  mock-data contract, responsive/accessibility rules.
* [`tuw-website/docs/`](./tuw-website/docs) — storefront folder structure, components, mock data.
* [`tuw-admin/docs/`](./tuw-admin/docs) — the panel's equivalents, including `FOLDER-STRUCTURE.md`.
* [`tuw-website/ENDPOINTS.md`](./tuw-website/ENDPOINTS.md) — storefront endpoint reference.
* [`DOC/backend/`](./DOC/backend) — backend schema, API design, migrations.
* [`AGENTS.md`](./AGENTS.md) — dependency version policy and engineering standards.
