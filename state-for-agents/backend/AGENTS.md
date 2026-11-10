# Backend Agents — packages/core + database

Entry point for agents working on backend code shared by both apps
(`packages/core`, `db/`, app route handlers and server actions).
App-specific UI work still follows `state-for-agents/admin/` and
`state-for-agents/storefront/`.

## Read in this order

1. `DOC/backend/23-Backend-Implementation.md` → how the backend is built.
2. `4.API-Design.md` + `3.Database-Schema.md` → modules and table ownership.
3. Tracker: `state-for-agents/admin/tasks.json` — `TL-BE-00`…`TL-BE-17`
   modules (each with `wiring`, `done_when`, `depends_on` and `.NN` child
   steps; pickup steps in `TL-BE-CORE.log`), then `TL-INT-*` integrations last.
4. `skills/` → loaded per task: `backend-modules`, `data-access`,
   `server-actions`, `route-handlers`, `auth-guards`, `idempotency`,
   `background-jobs`, `integrations`, `migrations`.
5. Rendering rules for each app's pages: `server-components`,
   `client-components`, `cache-components`, `nextjs-rendering` in the app's
   own skills folder.

## Database commands (repo root)

`pnpm db:status` · `pnpm db:migrate` · `pnpm db:seed` ·
`DB_ALLOW_RESET=true pnpm db:reset --yes` (dev only). Connection strings go
in the gitignored repo-root `.env.local`.
