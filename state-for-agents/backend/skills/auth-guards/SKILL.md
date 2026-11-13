# Skill: Auth & Guards (sessions, roles, permissions)

Global authority for who can do what, in both apps. Custom auth with bcrypt
(`DOC/backend/03-Auth-RBAC.md`); per-app access map
(`DOC/backend/14-Access-Gating.md`).

## Rules

1. `proxy.ts` is optimistic only: no cookie → redirect to that app's
   `/login?next=`. It never reads the DB and is never the real check.
2. Real checks live in the guard layer (`action()`, `route()`) and the DAL
   (`requireCustomer()`, `requireStaff(permission)`) — both, every time.
3. Admin access = any staff role except `customer`; actions name a
   permission slug from the seed (`order.refund`, `product.update`, …).
   Storefront access = `public` | `guestOrCustomer` | `customer`.
4. Passwords: bcrypt cost 12, reject > 72 bytes, rehash on login when the
   cost changes. Tokens are stored only as SHA-256 hashes.
5. Sessions: 15-minute access token + 30-day rotating refresh token, one
   cookie per app (a storefront login never logs into the admin).
6. Under Cache Components the session read sits in `'use cache: private'`
   inside `<Suspense>`; never in a layout.
7. Guests reach an order only with order number + email; exchanges and
   replacements require an account.

## Good / bad

- ✅ `requireStaff('order.refund')` in the refund service and the action guard.
- ❌ Hiding the refund button for support staff and calling that protection.
- ✅ Login writes `login_attempts` and respects `users.locked_until`.
- ❌ Looking up an order by id alone on the guest track-order page.

Related: `server-actions`, `route-handlers`.
