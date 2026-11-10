# Skill: Data Access (Drizzle on pg, any Postgres)

Global authority for reading and writing the database in
`packages/core`. The SQL files in `db/migrate` are the schema; Drizzle
gives us types for it.

## Rules

1. Only a module's `repository.ts` queries its tables. Use Drizzle's query
   builder; use the `sql\`…\`` template for reports, ranked search and
   atomic updates. Never build SQL by string concatenation.
2. Driver is `pg` through `platform/db` (pooled `DATABASE_URL` in apps,
   `DATABASE_URL_UNPOOLED` for migrations/tests). Nothing Neon-specific, so
   a local Postgres works the same.
3. Money: DB `DECIMAL(12,2)` rupees ↔ integer paise in DTOs, converted only
   in the repository (`toPaise`, `toRupees`). Never floats.
4. Multi-table writes run in one transaction (`db.transaction`), including
   history rows (`order_status_history`, wallet / gift-card ledgers).
5. Concurrency by SQL, not by reading first: `UPDATE … SET stock = stock - $1
   WHERE id = $2 AND stock >= $1`; status changes `WHERE status = <expected>`.
6. Select only the columns the DTO needs; load lists with joins or `IN (…)`,
   never one query per row.
7. Drizzle table types are generated from the live schema after
   `pnpm db:migrate`; never hand-edit them to differ from the SQL.

## Good / bad

- ✅ `reserveStock` in one statement; zero rows updated → 409 out of stock.
- ❌ `SELECT stock` then `UPDATE stock = :new` (two shoppers can oversell).
- ✅ `orders.markPaid` writes `orders` + `payments` + history in one transaction.
- ❌ Looping `await db.select()…` for each order line on the orders page.

Related: `backend-modules`, `migrations`, `idempotency`.
