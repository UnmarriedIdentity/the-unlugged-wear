# Auth & RBAC — Columns, Seeds, Gate Queries

> Status: Filling | Last Updated: 2026-10-17
> Conventions: `01-Conventions.md`. Defaults localized for IN (`country 'IN'`,
> +91 phones); currency has no auth meaning — see the open decision in `00-README.md` §7.
> Identity is two rows: `users` (credential) + `profiles` (person). Household
> grouping lives in `17-Household-Accounts.md`.

## 1. users

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK, UUIDv7 | Global identity; unguessable session subject |
| email | varchar(255) | NOT NULL, UNIQUE | Login key; lowercased in app (no citext extension) |
| password_hash | varchar(255) | NOT NULL | Argon2id output fits 255 |
| status | varchar(20) | NOT NULL DEFAULT 'active', CHECK IN ('active','disabled') | Off-switch: disabled blocks login + refresh, history preserved (deletes are RESTRICT-blocked); `pending` returns with the verification flow + token table |
| last_login_at | timestamptz | NULL | Idle detection, security review |
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

## 4. RBAC quartet

### roles
`id` PK · `name` varchar(50) · `slug` varchar(50) UNIQUE
(`admin`, `customer`; reserved: `support`, `warehouse`) ·
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
1. The four roles. 2. The permission table above. 3. `admin ← all
   permissions`; `customer ← none` (customer abilities are identity-scoped,
   not permission-scoped: own cart/orders/addresses). 4. First admin
   bound via env-seeded email at deploy; rotation procedure in runbook
   (later file).

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
- Access token 15 min; refresh token 30-day rotation; reuse of a rotated
  token revokes the whole family.
- Password change / explicit logout revokes all sessions via
  `idx_refresh_tokens_user_id`.
- Login + refresh endpoints rate-limited (limits in `13-API-Contracts.md`).
- `last_login_at` updates are fire-and-forget (never block the login response).
- Signup creates `users` + `profiles` + a solo `households` +
  `household_members` row in one TX (file 17 §4) — no user exists without
  a person, no person without a household.
