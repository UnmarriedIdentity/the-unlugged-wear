# Skill: Migrations (schema changes through numbered SQL files)

Global authority for changing the shared database. Files: `db/migrate`,
runner: `db/scripts/db.mjs`, apply order: `db/migrate/README.md`.

## Rules

1. The schema is applied (Neon dev, 2026-11-10). A change is a **new
   numbered file** (`015-short-name.sql`); applied files are never edited —
   the runner refuses a changed checksum.
2. Pre-launch only: on a dev database you may edit in place and rebuild with
   `DB_ALLOW_RESET=true pnpm db:reset --yes`. Never on preview/production.
3. Follow `DOC/backend/01-Conventions.md`: UUIDv7 PKs, `DECIMAL(12,2)` money
   with `CHECK >= 0`, `varchar` + `CHECK IN` statuses, an index on every FK,
   real foreign keys.
4. Every write path that can be retried gets a unique guard in the same file
   (see `idempotency`).
5. A migration must work with the code already deployed in **both** apps:
   add columns/tables first, use them in code next, remove only after
   neither app reads them.
6. Update the docs that list the table (`02-Data-Tables.md`, its domain doc,
   `db/migrate/README.md`) and `tuw-admin/tests/schema-integrity.test.mjs`
   in the same commit; run `pnpm db:migrate` then `pnpm test`.
7. Seed data stays re-runnable (`ON CONFLICT DO NOTHING`), with no secrets
   and no fake business activity.

## Good / bad

- ✅ `015-invoices.sql` creates `invoices` + guards; docs and tests updated.
- ❌ Editing `004-orders.sql` after it ran on preview.
- ✅ Adding `orders.new_col` nullable, backfilling, then making it required later.
- ❌ Renaming a column in one release while the storefront still reads it.

Related: `data-access`, `idempotency`.
