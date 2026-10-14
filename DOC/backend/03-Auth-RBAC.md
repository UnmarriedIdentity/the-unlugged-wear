# Auth & RBAC — Columns, Seeds, Gate Queries

> Status: Filling | Last Updated: 2026-10-14
> Conventions: `01-Conventions.md`. Defaults localized for IN (`country 'IN'`,
> +91 phones); currency has no auth meaning — see the open decision in `00-README.md` §7.

## 1. users

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK, UUIDv7 | Global identity; unguessable session subject |
| email | varchar(255) | NOT NULL, UNIQUE | Login key; lowercased in app (no citext extension) |
| password_hash | varchar(255) | NOT NULL | Argon2id output fits 255 |
| first_name | varchar(100) | NOT NULL | |
| last_name | varchar(100) | NOT NULL | |
| phone | varchar(20) | NULL | Optional; stored E.164 (`+91…`) when present |
| avatar_url | varchar(2048) | NULL | R2 object URL (see `11-Storage.md`) |
| status | varchar(20) | NOT NULL DEFAULT 'active', CHECK IN ('active','disabled','pending') | Account lifecycle; disabled blocks login + refresh |
| last_login_at | timestamptz | NULL | Idle detection, security review |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | Convention |

Indexes: PK · unique `users_email_key` (hottest auth query) ·
`idx_users_status` (admin filtering).

## 2. addresses

| Column | Type | Constraints | Reason |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | NOT NULL, FK → users(id) ON DELETE CASCADE | Address book dies with the account (GDPR-friendly) |
| type | varchar(10) | NOT NULL DEFAULT 'shipping', CHECK IN ('shipping','billing') | |
| label | varchar(50) | NULL | "Home", "Office" |
| line1 | varchar(255) | NOT NULL | |
| line2 | varchar(255) | NULL | |
| city | varchar(100) | NOT NULL | |
| state | varchar(100) | NULL | Required for IN pincodes in practice (app validates) |
| postal_code | varchar(20) | NOT NULL | 6-digit pincode validated in app |
| country | varchar(2) | NOT NULL DEFAULT 'IN' | ISO-3166 alpha-2; IN-first per localization decision |
| is_default | boolean | NOT NULL DEFAULT false | Checkout default |
| created_at / updated_at | timestamptz | NOT NULL | |

Indexes: PK · `idx_addresses_user_id` (book load) ·
`one_default_per_user` **partial unique (user_id) WHERE is_default**.

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
(revoke-all) · `idx_refresh_tokens_expires_at` (cleanup job).

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
ownership (`order.user_id = session user_id`), never a permission row.

## 6. AuthN rules

- Argon2id for passwords (memory-hard; no legacy hashes accepted).
- Access token 15 min; refresh token 30-day rotation; reuse of a rotated
  token revokes the whole family.
- Password change / explicit logout revokes all sessions via
  `idx_refresh_tokens_user_id`.
- Login + refresh endpoints rate-limited (limits in `13-API-Contracts.md`).
- `last_login_at` updates are fire-and-forget (never block the login response).
