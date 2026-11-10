# @tuw/heart — shared backend

Bundled into `tuw-admin` and `tuw-website` (`transpilePackages`), never
deployed on its own. Plan: `DOC/backend/23-Backend-Implementation.md`;
rules: `state-for-agents/backend/`.

```
src/platform/      db, errors, money, guards, idempotency, events, jobs, test
src/modules/       one folder per domain (index.ts = public API)
src/integrations/  provider registries + adapters (mock until the integrations phase)
```

Import paths: `@tuw/heart/platform/<name>`, `@tuw/heart/modules/<name>`,
`@tuw/heart/integrations/<category>`. Server code only.

```bash
pnpm --dir packages/heart typecheck
pnpm --dir packages/heart test   # unit + integration (throwaway schema on DATABASE_URL_UNPOOLED)
pnpm db:types                    # from the repo root, after pnpm db:migrate
```

Built so far (TL-BE-01): `platform/db` (pg + Drizzle, generated types,
`checkDatabase`), `platform/errors`, `platform/money`, `platform/guards`
(`createGuards({ resolveContext })` → `action()` / `route()`),
`platform/idempotency`, `platform/events`, `platform/jobs` (+ `jobs/catalog`),
`platform/test`. The four partitioned analytics tables are not in the
generated types (drizzle-kit skips partitioned parents); TL-BE-15 adds them
by hand.
