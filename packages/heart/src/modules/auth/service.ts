import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { emit } from '../../platform/events/index.ts';
import { getEmailSender, showDevLinks } from '../../integrations/email/index.ts';
import { createAccountHolder } from '../customers/index.ts';
import { hashPassword, needsRehash, passwordProblem, timingDummyHash, verifyPassword } from './passwords.ts';
import {
  REFRESH_TTL_SECONDS,
  hashSecret,
  randomSecret,
  signAccessToken,
  type AccessClaims,
  type AuthApp,
} from './tokens.ts';

// Auth service (DOC/backend/03). Owns users, roles, tokens, login_attempts,
// staff_invitations. Every write that spans tables runs in one transaction.

export const LOCKOUT_MAX_FAILURES = 5;
export const LOCKOUT_WINDOW_MINUTES = 15;
export const LOCKOUT_MINUTES = 15;
const RESET_TTL_MINUTES = 60;
const VERIFY_TTL_HOURS = 48;
const INVITE_TTL_DAYS = 7;
const CONCURRENT_REFRESH_GRACE_SECONDS = 10;

export interface SessionTokens {
  access: { token: string; exp: number };
  refresh: { token: string; exp: number };
  claims: AccessClaims;
}

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
  /** Absolute origin used to build email links, e.g. https://theunpluggedwear.com */
  origin: string;
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

function assertPassword(password: string): void {
  const problem = passwordProblem(password);
  if (problem) throw new AppError('VALIDATION_FAILED', problem, [{ field: 'password', message: problem }]);
}

const isUniqueViolation = (error: unknown, constraint?: string): boolean => {
  const e = (error as { cause?: { code?: string; constraint?: string }; code?: string; constraint?: string }) ?? {};
  const pg = e.cause ?? e;
  return pg.code === '23505' && (!constraint || pg.constraint === constraint);
};

type Row = Record<string, unknown>;
async function one<T extends Row>(tx: Transaction | ReturnType<typeof getDb>, query: ReturnType<typeof sql>): Promise<T | null> {
  const { rows } = await tx.execute<T>(query);
  return (rows[0] as T | undefined) ?? null;
}

// ------------------------------------------------------------------ claims

/** Name, email, role slugs and permission slugs that go into the access token. */
export async function loadClaims(userId: string, app: AuthApp, tx?: Transaction): Promise<Omit<AccessClaims, 'iat' | 'exp'>> {
  const db = tx ?? getDb();
  const row = await one<{ email: string; first_name: string | null; last_name: string | null; roles: string[] | null; perms: string[] | null }>(
    db,
    sql`SELECT u.email, p.first_name, p.last_name,
               (SELECT array_agg(DISTINCT r.slug) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id) AS roles,
               (SELECT array_agg(DISTINCT pm.slug) FROM user_roles ur
                  JOIN role_permissions rp ON rp.role_id = ur.role_id
                  JOIN permissions pm ON pm.id = rp.permission_id
                 WHERE ur.user_id = u.id) AS perms
          FROM users u LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.id = ${userId}`,
  );
  if (!row) throw new AppError('UNAUTHENTICATED', 'Please sign in again.');
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email;
  return { sub: userId, app, name, email: row.email, roles: row.roles ?? [], perms: row.perms ?? [] };
}

const isStaff = (roles: string[]) => roles.some((r) => r !== 'customer');

async function issueSession(userId: string, app: AuthApp, meta: Pick<RequestMeta, 'userAgent'>, tx: Transaction, familyId = uuidv7()): Promise<SessionTokens> {
  const claims = await loadClaims(userId, app, tx);
  const refresh = randomSecret();
  const refreshExp = Math.floor(Date.now() / 1000) + REFRESH_TTL_SECONDS;
  await tx.execute(sql`INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, family_id, app, user_agent)
                       VALUES (${uuidv7()}, ${userId}, ${hashSecret(refresh)}, to_timestamp(${refreshExp}), ${familyId}, ${app},
                               ${meta.userAgent?.slice(0, 255) ?? null})`);
  const access = signAccessToken(claims);
  return { access, refresh: { token: refresh, exp: refreshExp }, claims: { ...claims, iat: access.exp - 900, exp: access.exp } };
}

// ---------------------------------------------------------------- register

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export async function register(input: RegisterInput, meta: RequestMeta): Promise<SessionTokens & { verifyLink?: string }> {
  const email = normalizeEmail(input.email);
  assertPassword(input.password);
  const passwordHash = await hashPassword(input.password);
  const verifySecret = randomSecret();
  try {
    const session = await withTransaction(async (tx) => {
      const userId = uuidv7();
      await tx.execute(sql`INSERT INTO users (id, email, password_hash, status) VALUES (${userId}, ${email}, ${passwordHash}, 'active')`);
      await tx.execute(sql`INSERT INTO user_roles (user_id, role_id) SELECT ${userId}, id FROM roles WHERE slug = 'customer'`);
      await createAccountHolder(tx, { userId, firstName: input.firstName.trim(), lastName: input.lastName.trim(), phone: input.phone ?? null });
      await tx.execute(sql`INSERT INTO email_verification_tokens (id, user_id, email, token_hash, expires_at)
                           VALUES (${uuidv7()}, ${userId}, ${email}, ${hashSecret(verifySecret)}, now() + make_interval(hours => ${VERIFY_TTL_HOURS}))`);
      return issueSession(userId, 'storefront', meta, tx);
    });
    const link = `${meta.origin}/verify-email?token=${verifySecret}`;
    await getEmailSender().send({ to: email, subject: 'Confirm your email', template: 'auth.verify', link, dedupeKey: `auth.verify:${hashSecret(verifySecret)}` });
    await emit('auth.user_registered', { userId: session.claims.sub });
    return showDevLinks() ? { ...session, verifyLink: link } : session;
  } catch (error) {
    if (isUniqueViolation(error, 'users_email_key')) {
      throw new AppError('CONFLICT', 'An account with this email already exists. Try signing in.', [{ field: 'email', message: 'Already registered' }]);
    }
    throw error;
  }
}

// ------------------------------------------------------------------- login

export interface LoginInput {
  email: string;
  password: string;
  app: AuthApp;
}

export async function login(input: LoginInput, meta: RequestMeta): Promise<SessionTokens> {
  const email = normalizeEmail(input.email);
  const db = getDb();
  const user = await one<{ id: string; password_hash: string | null; status: string; locked: boolean }>(
    db,
    sql`SELECT id, password_hash, status, (locked_until IS NOT NULL AND locked_until > now()) AS locked FROM users WHERE email = ${email}`,
  );
  if (user?.locked) {
    throw new AppError('AUTH_LOCKED', `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes or reset your password.`);
  }
  // Always run one bcrypt compare, so unknown emails take as long as real ones.
  const ok = await verifyPassword(input.password, user?.password_hash ?? (await timingDummyHash()));
  const valid = Boolean(user && user.password_hash && ok);

  await db.execute(sql`INSERT INTO login_attempts (id, email, ip_address, user_id, succeeded)
                       VALUES (${uuidv7()}, ${email}, ${meta.ip ?? null}::inet, ${user?.id ?? null}, ${valid})`);

  if (!valid || !user) {
    if (user) {
      await db.execute(sql`
        UPDATE users SET locked_until = now() + make_interval(mins => ${LOCKOUT_MINUTES})
         WHERE id = ${user.id}
           AND (SELECT count(*) FROM login_attempts a
                 WHERE a.user_id = ${user.id} AND NOT a.succeeded
                   AND a.created_at > now() - make_interval(mins => ${LOCKOUT_WINDOW_MINUTES})
                   AND a.created_at > COALESCE((SELECT max(created_at) FROM login_attempts s WHERE s.user_id = ${user.id} AND s.succeeded), '-infinity')
               ) >= ${LOCKOUT_MAX_FAILURES}`);
    }
    throw new AppError('UNAUTHENTICATED', 'Email or password is incorrect.');
  }
  if (user.status === 'disabled') throw new AppError('FORBIDDEN', 'This account is disabled. Contact support.');

  return withTransaction(async (tx) => {
    await tx.execute(sql`UPDATE users SET locked_until = NULL, last_login_at = now(), status = 'active' WHERE id = ${user.id}`);
    if (user.password_hash && needsRehash(user.password_hash)) {
      await tx.execute(sql`UPDATE users SET password_hash = ${await hashPassword(input.password)} WHERE id = ${user.id}`);
    }
    const session = await issueSession(user.id, input.app, meta, tx);
    if (input.app === 'admin' && !isStaff(session.claims.roles)) {
      throw new AppError('FORBIDDEN', 'Staff access required. Customers sign in on the store.');
    }
    return session;
  });
}

// ----------------------------------------------------------------- refresh

export async function refresh(refreshToken: string, app: AuthApp, meta: Pick<RequestMeta, 'userAgent'>): Promise<SessionTokens> {
  const tokenHash = hashSecret(refreshToken);
  // Revocations must COMMIT before we refuse the request, so the transaction
  // returns an outcome instead of throwing (a throw would roll them back).
  const outcome = await withTransaction(async (tx): Promise<{ ok: SessionTokens } | { error: AppError }> => {
    const row = await one<{ id: string; user_id: string; family_id: string; app: string; expired: boolean; revoked: boolean; rotated_recently: boolean; rotated: boolean; status: string }>(
      tx,
      sql`SELECT t.id, t.user_id, t.family_id, t.app, (t.expires_at <= now()) AS expired, (t.revoked_at IS NOT NULL) AS revoked,
                 (t.rotated_at IS NOT NULL) AS rotated,
                 (t.rotated_at > now() - make_interval(secs => ${CONCURRENT_REFRESH_GRACE_SECONDS})) AS rotated_recently, u.status
            FROM refresh_tokens t JOIN users u ON u.id = t.user_id
           WHERE t.token_hash = ${tokenHash}
           FOR UPDATE OF t`,
    );
    if (!row || row.app !== app) return { error: new AppError('UNAUTHENTICATED', 'Please sign in again.') };
    if (row.revoked || row.expired) return { error: new AppError('UNAUTHENTICATED', 'Your session has ended. Please sign in again.') };
    if (row.rotated) {
      // Two tabs refreshing at once is normal; an old token replayed later is theft.
      if (!row.rotated_recently) {
        await tx.execute(sql`UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = ${row.family_id} AND revoked_at IS NULL`);
      }
      return { error: new AppError('UNAUTHENTICATED', 'Please sign in again.') };
    }
    if (row.status === 'disabled') {
      await logoutEverywhere(row.user_id, tx);
      return { error: new AppError('FORBIDDEN', 'This account is disabled.') };
    }
    await tx.execute(sql`UPDATE refresh_tokens SET rotated_at = now() WHERE id = ${row.id}`);
    const session = await issueSession(row.user_id, app, meta, tx, row.family_id);
    if (app === 'admin' && !isStaff(session.claims.roles)) throw new AppError('FORBIDDEN', 'Staff access required.');
    return { ok: session };
  });
  if ('error' in outcome) throw outcome.error;
  return outcome.ok;
}

/** Sign out this browser: revoke the token's whole family. Unknown tokens are ignored. */
export async function logout(refreshToken: string | null | undefined): Promise<void> {
  if (!refreshToken) return;
  await getDb().execute(sql`UPDATE refresh_tokens SET revoked_at = now()
                             WHERE family_id = (SELECT family_id FROM refresh_tokens WHERE token_hash = ${hashSecret(refreshToken)})
                               AND revoked_at IS NULL`);
}

export async function logoutEverywhere(userId: string, tx?: Transaction): Promise<void> {
  await (tx ?? getDb()).execute(sql`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = ${userId} AND revoked_at IS NULL`);
}

// ----------------------------------------------------- reset / verify email

/** Always succeeds from the caller's view: never reveals whether the email exists. */
export async function requestPasswordReset(rawEmail: string, meta: RequestMeta, app: AuthApp = 'storefront'): Promise<{ devLink?: string }> {
  const email = normalizeEmail(rawEmail);
  const user = await one<{ id: string; status: string }>(getDb(), sql`SELECT id, status FROM users WHERE email = ${email}`);
  if (!user || user.status === 'disabled') return {};
  const secret = randomSecret();
  const tokenId = uuidv7();
  await getDb().execute(sql`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
                             VALUES (${tokenId}, ${user.id}, ${hashSecret(secret)}, now() + make_interval(mins => ${RESET_TTL_MINUTES}))`);
  const link = `${meta.origin}/reset-password?token=${secret}`;
  await getEmailSender().send({ to: email, subject: app === 'admin' ? 'Reset your TUW Admin password' : 'Reset your password', template: 'auth.reset', link, dedupeKey: `auth.reset:${tokenId}` });
  return showDevLinks() ? { devLink: link } : {};
}

export async function resetPassword(token: string, password: string): Promise<{ userId: string }> {
  assertPassword(password);
  const passwordHash = await hashPassword(password);
  return withTransaction(async (tx) => {
    const row = await one<{ id: string; user_id: string }>(
      tx,
      sql`UPDATE password_reset_tokens SET used_at = now()
           WHERE token_hash = ${hashSecret(token)} AND used_at IS NULL AND expires_at > now()
          RETURNING id, user_id`,
    );
    if (!row) throw new AppError('RULE_VIOLATION', 'This reset link is invalid or has expired. Request a new one.');
    await tx.execute(sql`UPDATE users SET password_hash = ${passwordHash}, status = CASE WHEN status = 'pending' THEN 'active' ELSE status END,
                                         locked_until = NULL, email_verified_at = COALESCE(email_verified_at, now())
                          WHERE id = ${row.user_id}`);
    // Other outstanding reset links die with the password change.
    await tx.execute(sql`UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ${row.user_id} AND used_at IS NULL`);
    await logoutEverywhere(row.user_id, tx);
    return { userId: row.user_id };
  });
}

export async function verifyEmail(token: string): Promise<{ userId: string }> {
  return withTransaction(async (tx) => {
    const row = await one<{ user_id: string; email: string }>(
      tx,
      sql`UPDATE email_verification_tokens SET used_at = now()
           WHERE token_hash = ${hashSecret(token)} AND used_at IS NULL AND expires_at > now()
          RETURNING user_id, email`,
    );
    if (!row) throw new AppError('RULE_VIOLATION', 'This confirmation link is invalid or has expired.');
    await tx.execute(sql`UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ${row.user_id} AND email = ${row.email}`);
    return { userId: row.user_id };
  });
}

export async function changePassword(userId: string, current: string, next: string): Promise<void> {
  assertPassword(next);
  const row = await one<{ password_hash: string | null }>(getDb(), sql`SELECT password_hash FROM users WHERE id = ${userId}`);
  if (!row?.password_hash || !(await verifyPassword(current, row.password_hash))) {
    throw new AppError('VALIDATION_FAILED', 'Your current password is incorrect.', [{ field: 'currentPassword', message: 'Incorrect' }]);
  }
  const hash = await hashPassword(next);
  await withTransaction(async (tx) => {
    await tx.execute(sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`);
    await logoutEverywhere(userId, tx);
  });
}

// ----------------------------------------------------------- staff + team

export interface StaffMember {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  lastLoginAt: string | null;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export async function listStaff(): Promise<{ members: StaffMember[]; invites: PendingInvite[] }> {
  const db = getDb();
  const members = await db.execute<{ id: string; email: string; name: string | null; roles: string[]; status: string; last_login_at: string | null }>(
    sql`SELECT u.id, u.email, trim(concat_ws(' ', p.first_name, p.last_name)) AS name,
               array_agg(r.slug ORDER BY r.slug) AS roles, u.status, u.last_login_at::text
          FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
          LEFT JOIN profiles p ON p.user_id = u.id
         GROUP BY u.id, p.first_name, p.last_name
        HAVING bool_or(r.slug <> 'customer')
         ORDER BY u.email`,
  );
  const invites = await db.execute<{ id: string; email: string; role: string; expires_at: string }>(
    sql`SELECT i.id, i.email, r.slug AS role, i.expires_at::text FROM staff_invitations i JOIN roles r ON r.id = i.role_id
         WHERE i.status = 'pending' AND i.expires_at > now() ORDER BY i.created_at DESC`,
  );
  return {
    members: members.rows.map((m) => ({ userId: m.id, email: m.email, name: m.name || m.email, roles: m.roles.filter((r) => r !== 'customer'), status: m.status, lastLoginAt: m.last_login_at })),
    invites: invites.rows.map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expires_at })),
  };
}

const STAFF_ROLES = ['admin', 'support', 'warehouse'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export async function inviteStaff(input: { email: string; role: StaffRole; invitedBy: string }, meta: RequestMeta): Promise<{ inviteId: string; devLink?: string }> {
  if (!STAFF_ROLES.includes(input.role)) throw new AppError('VALIDATION_FAILED', 'Unknown role.', [{ field: 'role', message: 'Pick admin, support or warehouse' }]);
  const email = normalizeEmail(input.email);
  const secret = randomSecret();
  const inviteId = uuidv7();
  try {
    await getDb().execute(sql`
      INSERT INTO staff_invitations (id, email, role_id, token_hash, status, expires_at, invited_by)
      SELECT ${inviteId}, ${email}, r.id, ${hashSecret(secret)}, 'pending', now() + make_interval(days => ${INVITE_TTL_DAYS}), ${input.invitedBy}
        FROM roles r WHERE r.slug = ${input.role}`);
  } catch (error) {
    if (isUniqueViolation(error, 'one_pending_staff_invitation_per_email')) {
      throw new AppError('CONFLICT', 'This email already has a pending invitation. Revoke it first to send a new one.');
    }
    throw error;
  }
  const link = `${meta.origin}/accept-invite?token=${secret}`;
  await getEmailSender().send({ to: email, subject: "You're invited to TUW Admin", template: 'auth.invite', link, dedupeKey: `auth.invite:${inviteId}` });
  return showDevLinks() ? { inviteId, devLink: link } : { inviteId };
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await getDb().execute(sql`UPDATE staff_invitations SET status = 'revoked' WHERE id = ${inviteId} AND status = 'pending'`);
}

export async function acceptInvite(input: { token: string; password: string; firstName: string; lastName: string }, meta: RequestMeta): Promise<SessionTokens> {
  assertPassword(input.password);
  const passwordHash = await hashPassword(input.password);
  return withTransaction(async (tx) => {
    const invite = await one<{ id: string; email: string; role_id: string }>(
      tx,
      sql`UPDATE staff_invitations SET status = 'accepted'
           WHERE token_hash = ${hashSecret(input.token)} AND status = 'pending' AND expires_at > now()
          RETURNING id, email, role_id`,
    );
    if (!invite) throw new AppError('RULE_VIOLATION', 'This invitation is invalid, expired or already used.');
    const existing = await one<{ id: string; password_hash: string | null }>(tx, sql`SELECT id, password_hash FROM users WHERE email = ${invite.email}`);
    let userId: string;
    if (existing) {
      // An existing customer account becomes staff only by proving it owns the password.
      if (existing.password_hash && !(await verifyPassword(input.password, existing.password_hash))) {
        throw new AppError('VALIDATION_FAILED', 'This email already has an account. Enter that account\'s password to accept.', [{ field: 'password', message: 'Use your existing password' }]);
      }
      userId = existing.id;
      if (!existing.password_hash) await tx.execute(sql`UPDATE users SET password_hash = ${passwordHash}, status = 'active' WHERE id = ${userId}`);
    } else {
      userId = uuidv7();
      await tx.execute(sql`INSERT INTO users (id, email, password_hash, status, email_verified_at) VALUES (${userId}, ${invite.email}, ${passwordHash}, 'active', now())`);
      await createAccountHolder(tx, { userId, firstName: input.firstName.trim(), lastName: input.lastName.trim() });
    }
    await tx.execute(sql`INSERT INTO user_roles (user_id, role_id) VALUES (${userId}, ${invite.role_id}) ON CONFLICT DO NOTHING`);
    await tx.execute(sql`UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ${userId}`);
    return issueSession(userId, 'admin', meta, tx);
  });
}

export async function setStaffRole(userId: string, role: StaffRole, actorId: string): Promise<void> {
  if (!STAFF_ROLES.includes(role)) throw new AppError('VALIDATION_FAILED', 'Unknown role.');
  if (userId === actorId && role !== 'admin') throw new AppError('RULE_VIOLATION', 'You cannot remove your own admin access.');
  await withTransaction(async (tx) => {
    await tx.execute(sql`DELETE FROM user_roles ur USING roles r WHERE ur.role_id = r.id AND ur.user_id = ${userId} AND r.slug <> 'customer'`);
    await tx.execute(sql`INSERT INTO user_roles (user_id, role_id) SELECT ${userId}, id FROM roles WHERE slug = ${role}`);
    await assertAnAdminRemains(tx);
    await logoutEverywhere(userId, tx); // new role takes effect on next sign-in
  });
}

export async function setUserStatus(userId: string, status: 'active' | 'disabled', actorId: string): Promise<void> {
  if (userId === actorId && status === 'disabled') throw new AppError('RULE_VIOLATION', 'You cannot disable your own account.');
  await withTransaction(async (tx) => {
    await tx.execute(sql`UPDATE users SET status = ${status} WHERE id = ${userId}`);
    if (status === 'disabled') {
      await logoutEverywhere(userId, tx);
      await assertAnAdminRemains(tx);
    }
  });
}

async function assertAnAdminRemains(tx: Transaction): Promise<void> {
  const row = await one<{ n: number }>(tx, sql`SELECT count(*)::int AS n FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
                                               WHERE r.slug = 'admin' AND u.status = 'active'`);
  if (!row || row.n < 1) throw new AppError('RULE_VIOLATION', 'At least one active admin must remain.');
}

/** First admin from env (no password hashes in SQL seeds — DOC/backend/03 §4). Idempotent. */
export async function bootstrapAdmin(input: { email: string; password: string; firstName: string; lastName: string }): Promise<{ userId: string; created: boolean }> {
  assertPassword(input.password);
  const email = normalizeEmail(input.email);
  const hash = await hashPassword(input.password);
  return withTransaction(async (tx) => {
    const existing = await one<{ id: string }>(tx, sql`SELECT id FROM users WHERE email = ${email}`);
    let userId = existing?.id;
    if (!userId) {
      userId = uuidv7();
      await tx.execute(sql`INSERT INTO users (id, email, password_hash, status, email_verified_at) VALUES (${userId}, ${email}, ${hash}, 'active', now())`);
      await createAccountHolder(tx, { userId, firstName: input.firstName, lastName: input.lastName });
    }
    await tx.execute(sql`INSERT INTO user_roles (user_id, role_id) SELECT ${userId}, id FROM roles WHERE slug = 'admin' ON CONFLICT DO NOTHING`);
    return { userId, created: !existing };
  });
}

/** Invitation details for the accept page (token holder only; no secrets returned). */
export async function describeInvite(token: string): Promise<{ email: string; role: string } | null> {
  if (!token || token.length < 20 || token.length > 200) return null;
  return one<{ email: string; role: string }>(
    getDb(),
    sql`SELECT i.email, r.slug AS role FROM staff_invitations i JOIN roles r ON r.id = i.role_id
         WHERE i.token_hash = ${hashSecret(token)} AND i.status = 'pending' AND i.expires_at > now()`,
  );
}
