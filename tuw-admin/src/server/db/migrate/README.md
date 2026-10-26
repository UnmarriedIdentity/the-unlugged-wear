# Migrations — Apply Order & Status

> No PostgreSQL instance exists yet. These files are edited in place until
> the first provisioned database; afterward use forward migrations.

## Apply order

| File | Tables | Status | Depends on |
|---|---:|---|---|
| `001-auth.sql` | 10 | written | — |
| `002-catalog.sql` | 12 | written | `001` (users for reviews) |
| `006-cms.sql` | 9 | written | `001` (users), `002` (none yet) |
| `009-partner.sql` | 2 | written, blocked | `004-orders.sql` (not yet written) |
| `010-attr-library.sql` | 5 | written | `002` |
| `011-household.sql` | 5 | written | `001` (profiles) |
| `012-styling.sql` | 7 | written, ships last | `002` + `010` |
| **Total** | **50** | | |

`003`–`005`, `007`–`008` and `013`–`019` are specified in `DOC/backend`
but not yet written as SQL. The remaining five CMS tables
(`cms_sections`, `cms_settings`, `navigation_settings`, `pages`,
`store_settings`) stay pending until their pages/settings migration. See
`DOC/backend/20-Schema-Decisions.md` §6 for the implemented-vs-specified
split.

`010-attr-library.sql` now carries `attribute_definitions.slug` (stable
filter/URL key) and `product_attribute_links.display_position` (non-axis
spec order). Both are column additions; the table count stays 5.

## Do not apply 009 alone

`009-partner.sql` references `orders(id)`; there is no `004-orders.sql` yet.
The FK is correct and stays; the file moves to the front of the queue once
Orders lands. `stock_movements.order_id` is likewise deferred until `004`.

## CMS blog slice

`006-cms.sql` implements the nine blog/media tables only. It deliberately
does not include `cms_sections`, `cms_settings`, `navigation_settings`,
`pages`, or `store_settings`; those remain specified and land with the
pages/settings migration.
