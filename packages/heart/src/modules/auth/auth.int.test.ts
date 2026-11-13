// Break-it tests for the auth module (stress-testing skill). Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';
process.env.AUTH_SHOW_DEV_LINKS = 'true';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');
const { verifyAccessToken } = await import('./tokens.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
const meta = { origin: 'https://shop.example.com', ip: '203.0.113.7', userAgent: 'node-test' };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const q = async <T extends Record<string, unknown>>(query: ReturnType<typeof sql>) => (await getDb().execute<T>(query)).rows;
const tokenFrom = (link?: string) => new URL(link!).searchParams.get('token')!;

before(async () => { if (!skip) drop = (await createTestDatabase()).drop; }, { timeout: 180_000 });
after(async () => { await drop?.(); });

const person = (email: string, password = 'correct horse 1') => ({ email, password, firstName: 'Asha', lastName: 'Rao' });

test('register: creates user + customer role + profile + household, logged in, unverified', { skip }, async () => {
  const s = await auth.register(person('  Asha.Rao@Example.com '), meta);
  assert.equal(s.claims.email, 'asha.rao@example.com');
  assert.deepEqual(s.claims.roles, ['customer']);
  assert.equal(verifyAccessToken(s.access.token, 'storefront').ok, true);
  const [row] = await q<{ n: number; v: string | null }>(sql`
    SELECT (SELECT count(*)::int FROM household_members hm JOIN profiles p ON p.id = hm.profile_id WHERE p.user_id = u.id AND hm.role = 'manager') AS n,
           u.email_verified_at::text AS v FROM users u WHERE u.email = 'asha.rao@example.com'`);
  assert.equal(row?.n, 1);
  assert.equal(row?.v, null);
  assert.ok(s.verifyLink?.includes('/verify-email?token='));
});

test('register: 8 parallel signups with case variants of one email → exactly one account', { skip }, async () => {
  const variants = ['dup@example.com', 'DUP@example.com', ' dup@Example.com', 'Dup@EXAMPLE.com'];
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => code(auth.register(person(variants[i % 4]!), meta))));
  assert.equal(results.filter((r) => r === 'ok').length, 1);
  assert.ok(results.filter((r) => r !== 'ok').every((r) => r === 'CONFLICT'));
  const [row] = await q<{ n: number }>(sql`SELECT count(*)::int AS n FROM users WHERE email = 'dup@example.com'`);
  assert.equal(row?.n, 1);
});

test('register: hostile and boundary passwords', { skip }, async () => {
  assert.equal(await code(auth.register(person('short@example.com', 'abc'), meta)), 'VALIDATION_FAILED');
  assert.equal(await code(auth.register(person('spaces@example.com', '          '), meta)), 'VALIDATION_FAILED');
  assert.equal(await code(auth.register(person('long@example.com', 'a'.repeat(73)), meta)), 'VALIDATION_FAILED');
  assert.equal(await code(auth.register(person('emoji@example.com', '🔒'.repeat(19)), meta)), 'VALIDATION_FAILED'); // 76 bytes
  assert.equal(await code(auth.register(person('ok72@example.com', 'a'.repeat(72)), meta)), 'ok');
  assert.equal(await code(auth.register(person("o'reilly+tag@example.com", "pa'ss;--DROP"), meta)), 'ok');
});

test('login: wrong password, unknown email and SQL-ish input give the same error', { skip }, async () => {
  await auth.register(person('login@example.com'), meta);
  assert.equal(await code(auth.login({ email: 'login@example.com', password: 'nope-nope', app: 'storefront' }, meta)), 'UNAUTHENTICATED');
  assert.equal(await code(auth.login({ email: 'ghost@example.com', password: 'nope-nope', app: 'storefront' }, meta)), 'UNAUTHENTICATED');
  assert.equal(await code(auth.login({ email: "' OR 1=1 --", password: 'x', app: 'storefront' }, meta)), 'UNAUTHENTICATED');
  const s = await auth.login({ email: ' LOGIN@example.com', password: 'correct horse 1', app: 'storefront' }, meta);
  assert.equal(s.claims.email, 'login@example.com');
});

test('login: 5 failures lock the account even for the right password; reset unlocks', { skip }, async () => {
  const reg = await auth.register(person('lock@example.com'), meta);
  for (let i = 0; i < 5; i += 1) await code(auth.login({ email: 'lock@example.com', password: `wrong-${i}-xx`, app: 'storefront' }, meta));
  assert.equal(await code(auth.login({ email: 'lock@example.com', password: 'correct horse 1', app: 'storefront' }, meta)), 'AUTH_LOCKED');
  const { devLink } = await auth.requestPasswordReset('lock@example.com', meta);
  await auth.resetPassword(tokenFrom(devLink), 'brand new pass 2');
  assert.equal(await code(auth.login({ email: 'lock@example.com', password: 'brand new pass 2', app: 'storefront' }, meta)), 'ok');
  // the reset revoked the session created at signup
  assert.equal(await code(auth.refresh(reg.refresh.token, 'storefront', meta)), 'UNAUTHENTICATED');
});

test('login: customers cannot sign in to the admin', { skip }, async () => {
  await auth.register(person('shopper@example.com'), meta);
  assert.equal(await code(auth.login({ email: 'shopper@example.com', password: 'correct horse 1', app: 'admin' }, meta)), 'FORBIDDEN');
});

test('refresh: rotates; replaying an old token later revokes the whole family', { skip }, async () => {
  const s1 = await auth.register(person('rot@example.com'), meta);
  const s2 = await auth.refresh(s1.refresh.token, 'storefront', meta);
  assert.notEqual(s2.refresh.token, s1.refresh.token);
  assert.equal(await code(auth.refresh(s1.refresh.token, 'storefront', meta)), 'UNAUTHENTICATED'); // within grace: just refused
  await getDb().execute(sql`UPDATE refresh_tokens SET rotated_at = now() - interval '1 minute' WHERE rotated_at IS NOT NULL`);
  assert.equal(await code(auth.refresh(s1.refresh.token, 'storefront', meta)), 'UNAUTHENTICATED'); // theft → family revoked
  assert.equal(await code(auth.refresh(s2.refresh.token, 'storefront', meta)), 'UNAUTHENTICATED');
});

test('refresh: 6 tabs refreshing the same token at once → one wins, family survives', { skip }, async () => {
  const s = await auth.register(person('tabs@example.com'), meta);
  const results = await Promise.all(Array.from({ length: 6 }, () => auth.refresh(s.refresh.token, 'storefront', meta).then((r) => r, () => null)));
  const winners = results.filter(Boolean);
  assert.equal(winners.length, 1);
  assert.equal(await code(auth.refresh(winners[0]!.refresh.token, 'storefront', meta)), 'ok');
});

test('refresh: wrong app, garbage and expired tokens are refused', { skip }, async () => {
  const s = await auth.register(person('apps@example.com'), meta);
  assert.equal(await code(auth.refresh(s.refresh.token, 'admin', meta)), 'UNAUTHENTICATED');
  assert.equal(await code(auth.refresh('not-a-token', 'storefront', meta)), 'UNAUTHENTICATED');
  await getDb().execute(sql`UPDATE refresh_tokens SET expires_at = now() - interval '1 second' WHERE user_id = (SELECT id FROM users WHERE email = 'apps@example.com')`);
  assert.equal(await code(auth.refresh(s.refresh.token, 'storefront', meta)), 'UNAUTHENTICATED');
});

test('reset + verify links are single-use, expire, and never reveal unknown emails', { skip }, async () => {
  assert.deepEqual(await auth.requestPasswordReset('nobody@example.com', meta), {});
  const reg = await auth.register(person('links@example.com'), meta);
  const { devLink } = await auth.requestPasswordReset('links@example.com', meta);
  const token = tokenFrom(devLink);
  const both = await Promise.all([code(auth.resetPassword(token, 'first new pass')), code(auth.resetPassword(token, 'second new pass'))]);
  assert.deepEqual([...both].sort(), ['RULE_VIOLATION', 'ok']);
  const verify = tokenFrom(reg.verifyLink);
  assert.equal(await code(auth.verifyEmail(verify)), 'ok');
  assert.equal(await code(auth.verifyEmail(verify)), 'RULE_VIOLATION');
  const second = await auth.requestPasswordReset('links@example.com', meta);
  await getDb().execute(sql`UPDATE password_reset_tokens SET expires_at = now() - interval '1 second' WHERE used_at IS NULL`);
  assert.equal(await code(auth.resetPassword(tokenFrom(second.devLink), 'expired pass 3')), 'RULE_VIOLATION');
});

test('staff: invite, duplicate invite, accept, existing customer must prove password', { skip }, async () => {
  const admin = await auth.bootstrapAdmin({ email: 'owner@example.com', password: 'owner pass 123', firstName: 'Owner', lastName: 'One' });
  assert.equal((await auth.bootstrapAdmin({ email: 'OWNER@example.com', password: 'owner pass 123', firstName: 'O', lastName: 'O' })).created, false);
  const inv = await auth.inviteStaff({ email: 'Helper@example.com', role: 'support', invitedBy: admin.userId }, meta);
  assert.equal(await code(auth.inviteStaff({ email: 'helper@example.com', role: 'support', invitedBy: admin.userId }, meta)), 'CONFLICT');
  const staff = await auth.acceptInvite({ token: tokenFrom(inv.devLink), password: 'helper pass 1', firstName: 'Help', lastName: 'Er' }, meta);
  assert.deepEqual(staff.claims.roles, ['support']);
  assert.ok(staff.claims.perms.includes('order.view'));
  assert.ok(!staff.claims.perms.includes('order.refund'));
  assert.equal(await code(auth.acceptInvite({ token: tokenFrom(inv.devLink), password: 'helper pass 1', firstName: 'H', lastName: 'E' }, meta)), 'RULE_VIOLATION');

  await auth.register(person('customer2staff@example.com', 'customer pass 1'), meta);
  const inv2 = await auth.inviteStaff({ email: 'customer2staff@example.com', role: 'warehouse', invitedBy: admin.userId }, meta);
  assert.equal(await code(auth.acceptInvite({ token: tokenFrom(inv2.devLink), password: 'attacker guess', firstName: 'X', lastName: 'Y' }, meta)), 'VALIDATION_FAILED');
});

test('staff: the last active admin cannot be demoted or disabled', { skip }, async () => {
  const [owner] = await q<{ id: string }>(sql`SELECT id FROM users WHERE email = 'owner@example.com'`);
  assert.equal(await code(auth.setStaffRole(owner!.id, 'support', 'someone-else')), 'RULE_VIOLATION');
  assert.equal(await code(auth.setUserStatus(owner!.id, 'disabled', owner!.id)), 'RULE_VIOLATION');
  const { members } = await auth.listStaff();
  assert.ok(members.some((m) => m.email === 'owner@example.com' && m.roles.includes('admin')));
});

test('tokens: tampered, wrong-app and expired access tokens fail verification', { skip }, async () => {
  const s = await auth.login({ email: 'owner@example.com', password: 'owner pass 123', app: 'admin' }, meta);
  const [h, b, sig] = s.access.token.split('.');
  const forged = Buffer.from(JSON.stringify({ ...s.claims, roles: ['admin'], perms: ['*'] })).toString('base64url');
  assert.equal(verifyAccessToken(`${h}.${forged}.${sig}`, 'admin').ok, false);
  assert.equal(verifyAccessToken(s.access.token, 'storefront').ok, false);
  assert.equal(verifyAccessToken(s.access.token, 'admin', s.access.exp + 1).ok, false);
  assert.equal(verifyAccessToken('a.b', 'admin').ok, false);
});
