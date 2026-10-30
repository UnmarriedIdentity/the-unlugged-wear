# Auth & RBAC — Columns, Seeds, Gate Queries

> Status: Filling | Last Updated: 2026-10-30
> Conventions: `01-Conventions.md`. Defaults localized for IN (`country 'IN'`,
> +91 phones); currency has no auth meaning — see the open decision in `00-README.md` §7.
> Identity is two rows: `users` (credential) + `profiles` (person). Household
> grouping lives in `17-Household-Accounts.md`.
> Auth is **custom Argon2id** — never Supabase Auth. Retry safety for signup,
> invite and reset lives in `21-Idempotency.md`.

## 1. users

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK, UUIDv7 | Global identity; unguessable session subject |
| email | varchar(255) | NOT NULL, UNIQUE | Login key; lowercased in app (no citext extension) |
| password_hash | varchar(255) | **NULL** | Argon2id output fits 255. NULL + `status='pending'` = invited customer (or staff member) who has never set a password — the row exists so the invite token has an owner |
| status | varchar(20) | NOT NULL DEFAULT 'active', CHECK IN ('pending','active','disabled') | `pending` blocks login until the set-password flow completes; `disabled` is the off-switch (history preserved, deletes RESTRICT-blocked) |
| last_login_at | timestamptz | NULL | Idle detection, security review |
| locked_until | timestamptz | NULL | Set by the lockout policy (N failures in a window). A future timestamp blocks sign-in with **no row reads** on the hot path; NULL or past means unlocked |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | Convention |

Indexes: PK · unique `users_email_key` (hottest auth query). Status
filtering needs no index until ~100k users (file 01 §3 access-path rule).
A user is only a credential — name, phone, and birth date live on
`profiles` (§2).

## 2. profiles

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | The person — orders and sizes point here, never at a credential |
| user_id | uuid | NULL, UNIQUE, FK → users(id) ON DELETE CASCADE | The login this person owns; **NULL = managed family member with no email** (file 17) |
| first_name | varchar(100) | NOT NULL | Moved from `users` — a name is person data |
| last_name | varchar(100) | NOT NULL | Moved from `users` |
| phone | varchar(20) | NULL | Moved from `users`; stored E.164 (`+91…`) when present |
| date_of_birth | date | NULL | Optional — kid sizing over time, age-appropriate copy later |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | Convention |

Indexes: PK · unique `profiles_user_id_key` (session → profile — the hot
auth join). Every profile holds **at most one** household membership
(unique there); the signup/join transactions keep it exactly one.

`addresses` moved to `17-Household-Accounts.md` §3 — the book is
household-scoped (shared + personal rows), not login-scoped.

## 3. refresh_tokens

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK → users(id) ON DELETE CASCADE | Password change revokes all via this FK |
| token_hash | varchar(255) | NOT NULL, UNIQUE | SHA-256 of raw token — **raw tokens never touch the DB** |
| expires_at | timestamptz | NOT NULL | 30-day rotation window |
| revoked_at | timestamptz | NULL | Explicit revoke on rotate/logout/reuse-detection |
| created_at | timestamptz | NOT NULL | |

Indexes: PK · unique hash (refresh lookup) · `idx_refresh_tokens_user_id`
(revoke-all). Expiry cleanup scans need no index at this scale (file 01 §3).

## 3b. password_reset_tokens

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK → users(id) ON DELETE CASCADE | Deleting the credential kills its outstanding links |
| token_hash | varchar(255) | NOT NULL, UNIQUE | SHA-256 of the raw 32-byte token; raw never stored |
| expires_at | timestamptz | NOT NULL | 30 min for reset, 7 days for an invite |
| used_at | timestamptz | NULL | Single-use: second `UPDATE` matches zero rows |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

Index on `user_id` (revoke outstanding links on password change).

**Invite = the same table.** "Add Customer" / "Invite staff" creates
`users(status='pending', password_hash=NULL)` + `profiles` + a solo
household, then a reset row whose link is the "set your password" email.
No separate invite table for customers; `staff_invitations` keeps the
team screen's accept-by-role flow. Redeeming the token writes
`password_hash`, flips `status` to `active`, stamps `used_at`, and revokes
existing refresh tokens in one TX.

## 3c. email_verification_tokens

Same shape as §3b plus `email varchar(255) NOT NULL` — the address being
verified. The column is redundant with `users.email` **on purpose**: an
invite can precede a profile, and a later email change must verify the
*new* address, so the token carries its own target. Index on `user_id`;
unique `token_hash`.

## 3d. login_attempts

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | |
| email | varchar(255) | NOT NULL | The attempted identifier, lowercased — a failed attempt has no user row to point at |
| ip_address | inet | NULL | Abuse clustering; `inet`, never a string |
| user_id | uuid | NULL, FK → users(id) ON DELETE SET NULL | Known account the attempt targeted; NULL for unknown emails |
| succeeded | boolean | NOT NULL DEFAULT false | Success rows make "N failures since last success" a single filtered read |
| created_at | timestamptz | NOT NULL DEFAULT now() | Window key |

Indexes: `(email, created_at)` for the lockout window, `(ip_address,
created_at)` for abuse sweeps, `(user_id)`. Append-only evidence, swept at
90 days — the policy reads it, `users.locked_until` caches the verdict.

## 4. RBAC quartet

### roles
`id` PK · `name` varchar(50) · `slug` varchar(50) UNIQUE
(`admin`, `support`, `warehouse`, `customer` — all four seeded) ·
`description` nullable · timestamps. Unique slug is the code contract —
middleware and `withRole` reference slugs, never display names.

### permissions (seed list — grouped by domain)
`id` PK · `name` varchar(100) · `slug` varchar(100) UNIQUE ·
`description` nullable.

| Domain | Slugs |
|---|---|
| catalog | `product.create`, `product.update`, `product.archive`, `product.import`, `category.manage`, `discount.manage` |
| orders | `order.view`, `order.update_status`, `order.refund`, `shipment.manage` |
| customers | `customer.view`, `customer.update_status` |
| cms | `cms.edit`, `cms.publish`, `media.manage` |
| system | `user.manage`, `role.manage`, `settings.manage`, `report.view` |

### role_permissions / user_roles
Composite PKs (`role_id, permission_id` / `user_id, role_id`) — dedupe by
construction, cascade both sides. Reverse indexes:
`idx_role_permissions_permission_id` ("who grants X"),
`idx_user_roles_role_id` ("who is admin").

### Seed block (idempotent, `ON CONFLICT DO NOTHING`)

Lives in `src/server/db/seed/001-seed-core.sql` (guarded by
`tests/seed-integrity.test.mjs`), not in a migration.

| Role | Grants | Reads like |
|---|---|---|
| `admin` | all 19 permissions (`CROSS JOIN` in the seed) | owner: catalog, orders, customers, CMS, system |
| `support` | `order.view`, `order.update_status`, `customer.view`, `customer.update_status` | front desk: answers threads, moves status, never edits prices or refunds |
| `warehouse` | `order.view`, `order.update_status`, `shipment.manage` | packing desk: ships, never sees customers or money |
| `customer` | none | abilities are identity-scoped (own cart/orders/addresses), never permission rows |

`role_permissions` therefore seeds 26 rows (19 + 4 + 3 + 0). The first
admin is **not** seeded — no password hashes in SQL; it is created by the
env-driven bootstrap script in Phase 12.

### Admin UI persona → DB role

The sidebar's demo personas are presentation labels on top of the three
staff roles; they never become role rows.

| UI persona (`fixtures.ts`) | DB role | Note |
|---|---|---|
| Owner | `admin` | full grant set |
| Operations | `admin` | same role, narrower by convention only — if this needs teeth, split the permission grants, not the role |
| Content | `admin` | uses `cms.*` + `media.manage` |
| Read-only | `support` | `*.view` grants are the real read-only |
| (storefront shopper) | `customer` | identity-scoped routes |

## 5. Gate queries (copy-pasteable)

```sql
-- Is this user an admin? (middleware, cached 5 min)
SELECT 1
FROM user_roles ur JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = $1 AND r.slug = 'admin';

-- Does this user hold a permission? (withRole wrapper)
SELECT 1
FROM user_roles ur
JOIN role_permissions rp ON rp.role_id = ur.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE ur.user_id = $1 AND p.slug = $2;
```

Flow: session cookie → `user_id` → role set (cached, 5-min TTL) →
`(admin)` paths + `/api/admin/*` require `admin`; customer routes require
ownership (`order.placed_by_user_id = session user_id` — household
visibility widens reads, file 17 §4), never a permission row.

## 6. customer_notes · staff_invitations · audit_logs

- **customer_notes** (`profile_id` FK cascade, `author_id` FK restrict,
  `note` text): staff timeline on the customer **profile** — dependents
  included, which is why it points at the person and not at a login row
  (file 17 §7). Index on profile (timeline read). Author is RESTRICT —
  note history survives staff offboarding.
- **staff_invitations** (email, `role_id` FK restrict, token hash UNIQUE,
  status CHECK(pending/accepted/expired/revoked), expiry, inviter):
  invite flow for the team screen. Email index (accept lookup); no
  status index at this scale. Members themselves are `users` + roles —
  only the invitation needs a table.
- **audit_logs** (actor FK, action, entity, entity_id, diff jsonb):
  stock-edit summaries ONLY — one row per product per import job
  (`action='stock.import'`, diff carries qty inserted + job ref). Variant
  deltas live in `stock_movements`; manual edits live there too. Nothing
  else is recorded here (role/settings/auth trails deferred to their own
  triggers). Indexes on (entity, entity_id) + created_at — the import
  report reads exactly these.

## 7. AuthN rules

- Argon2id for passwords (memory-hard; no legacy hashes accepted).
  Parameters: m=19456 KiB, t=2, p=1 (`@node-rs/argon2`); the encoded hash
  stays well under `varchar(255)`.
- Access token 15 min; refresh token 30-day rotation; reuse of a rotated
  token revokes the whole family.
- Password change / explicit logout revokes all sessions via
  `idx_refresh_tokens_user_id`.
- Login + refresh endpoints rate-limited (limits in `13-API-Contracts.md`).
- Lockout: every attempt writes a `login_attempts` row; N failures inside
  the window sets `users.locked_until`, and login reads that column
  instead of recounting. A success clears both.
- `last_login_at` updates are fire-and-forget (never block the login response).
- Signup creates `users` + `profiles` + a solo `households` +
  `household_members` row in one TX (file 17 §4) — no user exists without
  a person, no person without a household.
- `POST /auth/signup`, `/auth/invite` and `/auth/reset` carry an
  `Idempotency-Key` under scopes `auth.signup` / `auth.invite` /
  `auth.reset` (`21-Idempotency.md`) — a retried form submit cannot create
  a second user or send a second mail.
