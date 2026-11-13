// Break-it tests for the customers module (stress-testing skill). Throwaway schema.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { sql } from 'drizzle-orm';

process.env.AUTH_SECRET ||= 'test-secret-that-is-definitely-longer-than-32-chars';

const { createTestDatabase, hasTestDatabase } = await import('../../platform/test/index.ts');
const auth = await import('../auth/index.ts');
const c = await import('./index.ts');
const { getDb } = await import('../../platform/db/index.ts');

const skip = !hasTestDatabase() && 'no DATABASE_URL_UNPOOLED';
let drop: (() => Promise<void>) | undefined;
const meta = { origin: 'https://shop.example.com' };
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as { code?: string }).code ?? String(e); } };
const home = { recipientName: 'Asha Rao', line1: '12 100 Feet Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038', phone: '9876543210' };

before(async () => { if (!skip) drop = (await createTestDatabase()).drop; }, { timeout: 180_000 });
after(async () => { await drop?.(); });

async function customer(email: string) {
  const s = await auth.register({ email, password: 'customer pass 1', firstName: 'Asha', lastName: 'Rao' }, meta);
  return { userId: s.claims.sub, profileId: await c.profileIdForUser(s.claims.sub) };
}

test('profile: update, hostile dates and names', { skip }, async () => {
  const a = await customer('profile@example.com');
  const p = await c.updateMyProfile(a.userId, { firstName: '  Ásha 🌸 ', lastName: "O'Neil", phone: '+919876543210', dateOfBirth: '1994-02-28' });
  assert.equal(p.firstName, 'Ásha 🌸');
  assert.equal(p.dateOfBirth, '1994-02-28');
  assert.equal(await code(c.updateMyProfile(a.userId, { firstName: 'A', lastName: 'B', dateOfBirth: '2999-01-01' })), 'VALIDATION_FAILED');
  assert.equal(await code(c.updateMyProfile(a.userId, { firstName: 'A', lastName: 'B', dateOfBirth: '1800-01-01' })), 'VALIDATION_FAILED');
  assert.equal(c.customerSchemas.profile.safeParse({ firstName: 'A', phone: '12345' }).success, false);
  assert.equal(c.customerSchemas.profile.safeParse({ firstName: 'A', phone: '98765 43210' }).success, true);
});

test('addresses: first is default, one default per type, delete promotes the next', { skip }, async () => {
  const a = await customer('addr@example.com');
  let list = await c.saveAddress(a.profileId, home);
  assert.equal(list.length, 1);
  assert.equal(list[0]!.isDefault, true);
  list = await c.saveAddress(a.profileId, { ...home, label: 'Work', isDefault: true });
  assert.equal(list.filter((x) => x.isDefault).length, 1);
  assert.equal(list.find((x) => x.isDefault)!.label, 'Work');
  list = await c.deleteAddress(a.profileId, list.find((x) => x.isDefault)!.id);
  assert.equal(list.length, 1);
  assert.equal(list[0]!.isDefault, true);
  assert.equal(await code(c.saveAddress(a.profileId, { ...home, postalCode: '0123' })), 'VALIDATION_FAILED');
});

test('addresses: 10 parallel "make default" saves leave exactly one default', { skip }, async () => {
  const a = await customer('race@example.com');
  await Promise.all(Array.from({ length: 10 }, (_, i) => c.saveAddress(a.profileId, { ...home, label: `L${i}`, isDefault: true })));
  const list = await c.listAddresses(a.profileId);
  assert.equal(list.length, 10);
  assert.equal(list.filter((x) => x.isDefault).length, 1);
});

test('addresses: another customer can never read, edit, default or delete mine (IDOR)', { skip }, async () => {
  const owner = await customer('owner-addr@example.com');
  const thief = await customer('thief-addr@example.com');
  const [mine] = await c.saveAddress(owner.profileId, home);
  assert.equal(await code(c.saveAddress(thief.profileId, { ...home, id: mine!.id, line1: 'hacked' })), 'NOT_FOUND');
  assert.equal(await code(c.deleteAddress(thief.profileId, mine!.id)), 'NOT_FOUND');
  assert.equal(await code(c.setDefaultAddress(thief.profileId, mine!.id)), 'NOT_FOUND');
  assert.equal((await c.listAddresses(thief.profileId)).length, 0);
  assert.equal((await c.listAddresses(owner.profileId))[0]!.line1, home.line1);
});

test('addresses: cap at 20', { skip }, async () => {
  const a = await customer('cap@example.com');
  for (let i = 0; i < 20; i += 1) await c.saveAddress(a.profileId, { ...home, label: `#${i}` });
  assert.equal(await code(c.saveAddress(a.profileId, home)), 'RULE_VIOLATION');
});

test('household: managed members, permissions, leave keeps a manager', { skip }, async () => {
  const mum = await customer('mum@example.com');
  let h = await c.addManagedMember(mum.profileId, { firstName: 'Rohan', lastName: 'Rao', dateOfBirth: '2015-06-01' });
  const rohan = h.members.find((m) => m.firstName === 'Rohan')!;
  assert.equal(rohan.canLogIn, false);
  h = await c.updateMember(mum.profileId, rohan.profileId, { firstName: 'Rohan', lastName: 'R', dateOfBirth: '2015-06-01' });
  assert.equal(h.members.find((m) => m.profileId === rohan.profileId)!.lastName, 'R');

  const stranger = await customer('stranger@example.com');
  assert.equal(await code(c.updateMember(stranger.profileId, rohan.profileId, { firstName: 'X', lastName: 'Y' })), 'FORBIDDEN');
  assert.equal(await code(c.removeMember(stranger.profileId, rohan.profileId)), 'NOT_FOUND');
  assert.equal(await code(c.setMemberRole(mum.profileId, rohan.profileId, 'manager')), 'RULE_VIOLATION'); // no login
  assert.equal(await code(c.leaveHousehold(mum.profileId)), 'RULE_VIOLATION'); // would leave Rohan with no manager

  h = await c.removeMember(mum.profileId, rohan.profileId);
  assert.equal(h.members.length, 1);
  const [row] = (await getDb().execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM household_members WHERE profile_id = ${rohan.profileId} AND left_at IS NULL`)).rows;
  assert.equal(row!.n, 1, 'removed member moves to a solo household, never orphaned');
});

test('household: join by email invitation, wrong account refused, replay refused', { skip }, async () => {
  const mum = await customer('mum2@example.com');
  const dad = await customer('dad2@example.com');
  const { token } = await c.inviteToHousehold(mum.profileId, 'DAD2@example.com', mum.userId);
  assert.equal(await code(c.inviteToHousehold(mum.profileId, 'dad2@example.com', mum.userId)), 'CONFLICT');
  assert.equal(await code(c.acceptHouseholdInvite(token, mum.userId, 'mum2@example.com')), 'FORBIDDEN');
  const h = await c.acceptHouseholdInvite(token, dad.userId, 'dad2@example.com');
  assert.equal(h.members.length, 2);
  assert.equal(await code(c.acceptHouseholdInvite(token, dad.userId, 'dad2@example.com')), 'RULE_VIOLATION');
  assert.equal(await code(c.inviteToHousehold(dad.profileId, 'x@example.com', dad.userId)), 'FORBIDDEN'); // members cannot invite
});

test('sizes: composite FK rejects a value from another size chart', { skip }, async () => {
  const a = await customer('sizes@example.com');
  await getDb().execute(sql`INSERT INTO categories (id, name, slug) VALUES ('00000000-0000-7000-8000-00000000c001', 'Tees', 'tees')`);
  const [size] = (await getDb().execute<{ id: string; definition_id: string }>(sql`SELECT av.id, av.definition_id FROM attribute_values av JOIN attribute_definitions d ON d.id = av.definition_id WHERE d.slug = 'size' LIMIT 1`)).rows;
  const [colour] = (await getDb().execute<{ id: string }>(sql`SELECT av.id FROM attribute_values av JOIN attribute_definitions d ON d.id = av.definition_id WHERE d.slug = 'color' LIMIT 1`)).rows;
  await c.setSizePreference(a.profileId, a.profileId, { categoryId: '00000000-0000-7000-8000-00000000c001', sizeDefinitionId: size!.definition_id, sizeValueId: size!.id });
  assert.equal((await c.getSizePreferences(a.profileId, a.profileId)).length, 1);
  assert.equal(await code(c.setSizePreference(a.profileId, a.profileId, { categoryId: '00000000-0000-7000-8000-00000000c001', sizeDefinitionId: size!.definition_id, sizeValueId: colour!.id })), 'VALIDATION_FAILED');
  const other = await customer('sizes-other@example.com');
  assert.equal(await code(c.getSizePreferences(other.profileId, a.profileId)), 'FORBIDDEN');
});

test('admin directory: search escapes LIKE wildcards, pages, notes are validated', { skip }, async () => {
  const list = await c.listCustomers({ q: '%', perPage: 5 });
  assert.equal(list.data.length, 0, "a bare % must not match everyone");
  const all = await c.listCustomers({ perPage: 2, page: 1 });
  assert.equal(all.data.length, 2);
  assert.ok(all.total >= 10);
  assert.equal((await c.listCustomers({ q: 'mum@example' })).data[0]?.tier, 'New');
  const target = (await c.listCustomers({ q: 'mum@example.com' })).data[0]!;
  const admin = await auth.bootstrapAdmin({ email: 'notes-admin@example.com', password: 'admin pass 12', firstName: 'Ad', lastName: 'Min' });
  const notes = await c.addCustomerNote(target.profileId, admin.userId, '  Prefers phone calls <b>after 6pm</b>  ');
  assert.equal(notes[0]!.note, 'Prefers phone calls <b>after 6pm</b>');
  assert.equal(await code(c.addCustomerNote(target.profileId, admin.userId, '   ')), 'VALIDATION_FAILED');
  assert.equal(await code(c.addCustomerNote(target.profileId, admin.userId, 'x'.repeat(2001))), 'VALIDATION_FAILED');
  assert.equal(await code(c.addCustomerNote('00000000-0000-7000-8000-000000000000', admin.userId, 'hi')), 'NOT_FOUND');
  assert.equal(c.tierFor(8, 0, 400), 'VIP Customer');
  assert.equal(c.tierFor(1, 100, 10), 'Active');
});
