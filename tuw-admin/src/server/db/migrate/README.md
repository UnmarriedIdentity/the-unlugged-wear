# Migrations — Apply Order & Status

> No PostgreSQL instance exists yet. These files are edited in place until
> the first provisioned database; afterward use forward migrations.

## Apply order

| File | Tables | Status | Depends on |
|---|---:|---|---|
| `001-auth.sql` | 10 | written | — |
| `002-catalog.sql` | 12 | written | `001` (users for reviews) |
| `009-partner.sql` | 2 | written, blocked | `004-orders.sql` (not yet written) |
| `010-attr-library.sql` | 5 | written | `002` |
| `011-household.sql` | 5 | written | `001` (profiles) |
| `012-styling.sql` | 7 | written, ships last | `002` + `010` |
| **Total** | **41** | | |

`003`–`008` and `013`–`019` are specified in `DOC/backend` but not yet
written as SQL. See `DOC/backend/20-Schema-Decisions.md` §5 for the
implemented-vs-specified split.

## Do not apply 009 alone

`009-partner.sql` references `orders(id)`; there is no `004-orders.sql` yet.
The FK is correct and stays; the file moves to the front of the queue once
Orders lands. `stock_movements.order_id` is likewise deferred until `004`.
