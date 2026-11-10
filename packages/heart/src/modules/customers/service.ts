import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';
import { toPaise } from '../../platform/money/index.ts';

// Customers module (DOC/backend/17, 03 §6). Owns profiles, households,
// household_members, household_invitations, addresses, size preferences,
// customer_notes. Every read/write is scoped to the acting profile:
// addresses are private per person; managers may edit members of their
// own household, members only themselves.

type Db = Transaction | ReturnType<typeof getDb>;
type Row = Record<string, unknown>;
async function one<T extends Row>(db: Db, query: ReturnType<typeof sql>): Promise<T | null> {
  const { rows } = await db.execute<T>(query);
  return (rows[0] as T | undefined) ?? null;
}
async function many<T extends Row>(db: Db, query: ReturnType<typeof sql>): Promise<T[]> {
  return (await db.execute<T>(query)).rows as T[];
}

// ----------------------------------------------------------------- profile

export interface MyProfile {
  profileId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  email: string;
  emailVerified: boolean;
}

export async function profileIdForUser(userId: string, db: Db = getDb()): Promise<string> {
  const row = await one<{ id: string }>(db, sql`SELECT id FROM profiles WHERE user_id = ${userId}`);
  if (!row) throw new AppError('NOT_FOUND', 'Your profile could not be found.');
  return row.id;
}

export async function getMyProfile(userId: string): Promise<MyProfile> {
  const row = await one<{ id: string; first_name: string; last_name: string; phone: string | null; dob: string | null; email: string; verified: boolean }>(
    getDb(),
    sql`SELECT p.id, p.first_name, p.last_name, p.phone, p.date_of_birth::text AS dob, u.email, (u.email_verified_at IS NOT NULL) AS verified
          FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ${userId}`,
  );
  if (!row) throw new AppError('NOT_FOUND', 'Your profile could not be found.');
  return { profileId: row.id, firstName: row.first_name, lastName: row.last_name, phone: row.phone, dateOfBirth: row.dob, email: row.email, emailVerified: row.verified };
}

export interface ProfileInput {
  firstName: string;
  lastName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}

function assertDateOfBirth(dob: string | null | undefined): void {
  if (!dob) return;
  const d = new Date(`${dob}T00:00:00Z`);
  const now = new Date();
  if (Number.isNaN(d.getTime()) || d > now || d.getUTCFullYear() < now.getUTCFullYear() - 120) {
    throw new AppError('VALIDATION_FAILED', 'Enter a real date of birth.', [{ field: 'dateOfBirth', message: 'Invalid date' }]);
  }
}

export async function updateMyProfile(userId: string, input: ProfileInput): Promise<MyProfile> {
  assertDateOfBirth(input.dateOfBirth);
  await getDb().execute(sql`UPDATE profiles SET first_name = ${input.firstName.trim()}, last_name = ${input.lastName.trim()},
                                                phone = ${input.phone?.trim() || null}, date_of_birth = ${input.dateOfBirth || null}::date,
                                                updated_at = now()
                             WHERE user_id = ${userId}`);
  return getMyProfile(userId);
}

// --------------------------------------------------------------- addresses

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  label: string | null;
  recipientName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressInput {
  id?: string;
  type?: 'shipping' | 'billing';
  label?: string | null;
  recipientName: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

const MAX_ADDRESSES = 20;

const mapAddress = (r: Row): Address => ({
  id: r.id as string,
  type: r.type as Address['type'],
  label: (r.label as string | null) ?? null,
  recipientName: r.recipient_name as string,
  phone: (r.phone as string | null) ?? null,
  line1: r.line1 as string,
  line2: (r.line2 as string | null) ?? null,
  city: r.city as string,
  state: (r.state as string | null) ?? null,
  postalCode: r.postal_code as string,
  country: r.country as string,
  isDefault: r.is_default as boolean,
});

export async function listAddresses(profileId: string, db: Db = getDb()): Promise<Address[]> {
  const rows = await many(db, sql`SELECT * FROM addresses WHERE profile_id = ${profileId} ORDER BY is_default DESC, created_at`);
  return rows.map(mapAddress);
}

function assertPostalCode(country: string, code: string): void {
  if (country === 'IN' && !/^[1-9][0-9]{5}$/.test(code)) {
    throw new AppError('VALIDATION_FAILED', 'Enter a 6-digit Indian PIN code.', [{ field: 'postalCode', message: 'Invalid PIN code' }]);
  }
}

/** Create or update one of MY addresses. Defaults are switched atomically. */
export async function saveAddress(profileId: string, input: AddressInput): Promise<Address[]> {
  const country = (input.country ?? 'IN').toUpperCase();
  const type = input.type ?? 'shipping';
  assertPostalCode(country, input.postalCode.trim());
  return withTransaction(async (tx) => {
    // Serialise address edits per person so two tabs cannot leave two defaults.
    await tx.execute(sql`SELECT id FROM profiles WHERE id = ${profileId} FOR UPDATE`);
    const existing = await many<{ id: string; type: string; is_default: boolean }>(tx, sql`SELECT id, type, is_default FROM addresses WHERE profile_id = ${profileId}`);
    const isUpdate = Boolean(input.id);
    if (isUpdate && !existing.some((a) => a.id === input.id)) throw new AppError('NOT_FOUND', 'That address was not found.');
    if (!isUpdate && existing.length >= MAX_ADDRESSES) throw new AppError('RULE_VIOLATION', `You can save up to ${MAX_ADDRESSES} addresses.`);
    const noDefaultYet = !existing.some((a) => a.type === type && a.is_default && a.id !== input.id);
    const makeDefault = Boolean(input.isDefault) || noDefaultYet;
    if (makeDefault) {
      await tx.execute(sql`UPDATE addresses SET is_default = false, updated_at = now() WHERE profile_id = ${profileId} AND type = ${type} AND is_default`);
    }
    const fields = {
      label: input.label?.trim() || null,
      recipient: input.recipientName.trim(),
      phone: input.phone?.trim() || null,
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      state: input.state?.trim() || null,
      postal: input.postalCode.trim(),
    };
    if (isUpdate) {
      await tx.execute(sql`UPDATE addresses SET type = ${type}, label = ${fields.label}, recipient_name = ${fields.recipient}, phone = ${fields.phone},
                                  line1 = ${fields.line1}, line2 = ${fields.line2}, city = ${fields.city}, state = ${fields.state},
                                  postal_code = ${fields.postal}, country = ${country}, is_default = ${makeDefault}, updated_at = now()
                            WHERE id = ${input.id!} AND profile_id = ${profileId}`);
    } else {
      await tx.execute(sql`INSERT INTO addresses (id, profile_id, type, label, recipient_name, phone, line1, line2, city, state, postal_code, country, is_default)
                           VALUES (${uuidv7()}, ${profileId}, ${type}, ${fields.label}, ${fields.recipient}, ${fields.phone}, ${fields.line1},
                                   ${fields.line2}, ${fields.city}, ${fields.state}, ${fields.postal}, ${country}, ${makeDefault})`);
    }
    return listAddresses(profileId, tx);
  });
}

export async function deleteAddress(profileId: string, addressId: string): Promise<Address[]> {
  return withTransaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM profiles WHERE id = ${profileId} FOR UPDATE`);
    const removed = await one<{ type: string; is_default: boolean }>(tx, sql`DELETE FROM addresses WHERE id = ${addressId} AND profile_id = ${profileId} RETURNING type, is_default`);
    if (!removed) throw new AppError('NOT_FOUND', 'That address was not found.');
    if (removed.is_default) {
      // The oldest remaining address of the same type becomes the default.
      await tx.execute(sql`UPDATE addresses SET is_default = true, updated_at = now()
                            WHERE id = (SELECT id FROM addresses WHERE profile_id = ${profileId} AND type = ${removed.type} ORDER BY created_at LIMIT 1)`);
    }
    return listAddresses(profileId, tx);
  });
}

export async function setDefaultAddress(profileId: string, addressId: string): Promise<Address[]> {
  return withTransaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM profiles WHERE id = ${profileId} FOR UPDATE`);
    const target = await one<{ type: string }>(tx, sql`SELECT type FROM addresses WHERE id = ${addressId} AND profile_id = ${profileId}`);
    if (!target) throw new AppError('NOT_FOUND', 'That address was not found.');
    await tx.execute(sql`UPDATE addresses SET is_default = (id = ${addressId}), updated_at = now() WHERE profile_id = ${profileId} AND type = ${target.type}`);
    return listAddresses(profileId, tx);
  });
}

// --------------------------------------------------------------- household

export interface HouseholdMember {
  profileId: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'member';
  canLogIn: boolean;
  dateOfBirth: string | null;
  isMe: boolean;
}

export interface Household {
  householdId: string;
  name: string | null;
  myRole: 'manager' | 'member';
  members: HouseholdMember[];
}

async function membership(db: Db, profileId: string): Promise<{ household_id: string; role: 'manager' | 'member' }> {
  const row = await one<{ household_id: string; role: 'manager' | 'member' }>(
    db, sql`SELECT household_id, role FROM household_members WHERE profile_id = ${profileId} AND left_at IS NULL`,
  );
  if (!row) throw new AppError('NOT_FOUND', 'You are not in a household.');
  return row;
}

export async function getMyHousehold(profileId: string, db: Db = getDb()): Promise<Household> {
  const me = await membership(db, profileId);
  const house = await one<{ name: string | null }>(db, sql`SELECT name FROM households WHERE id = ${me.household_id}`);
  const rows = await many<{ id: string; first_name: string; last_name: string; role: 'manager' | 'member'; can_log_in: boolean; dob: string | null }>(
    db,
    sql`SELECT p.id, p.first_name, p.last_name, hm.role, (p.user_id IS NOT NULL) AS can_log_in, p.date_of_birth::text AS dob
          FROM household_members hm JOIN profiles p ON p.id = hm.profile_id
         WHERE hm.household_id = ${me.household_id} AND hm.left_at IS NULL
         ORDER BY (hm.role = 'manager') DESC, p.first_name`,
  );
  return {
    householdId: me.household_id,
    name: house?.name ?? null,
    myRole: me.role,
    members: rows.map((r) => ({ profileId: r.id, firstName: r.first_name, lastName: r.last_name, role: r.role, canLogIn: r.can_log_in, dateOfBirth: r.dob, isMe: r.id === profileId })),
  };
}

/** Self, or a manager of the same household (DOC/backend/17 gate query 4). */
export async function assertCanEditMember(actorProfileId: string, targetProfileId: string, db: Db = getDb()): Promise<void> {
  if (actorProfileId === targetProfileId) return;
  const ok = await one<{ ok: number }>(db, sql`
    SELECT 1 AS ok FROM household_members me JOIN household_members target ON target.household_id = me.household_id
     WHERE me.profile_id = ${actorProfileId} AND target.profile_id = ${targetProfileId}
       AND me.left_at IS NULL AND target.left_at IS NULL AND me.role = 'manager'`);
  if (!ok) throw new AppError('FORBIDDEN', 'Only a household manager can change other members.');
}

async function assertManager(db: Db, profileId: string): Promise<string> {
  const me = await membership(db, profileId);
  if (me.role !== 'manager') throw new AppError('FORBIDDEN', 'Only a household manager can do this.');
  return me.household_id;
}

const MAX_MEMBERS = 12;

/** Add a family member who has no login (DOC/backend/17 §4 "managed member"). */
export async function addManagedMember(managerProfileId: string, input: { firstName: string; lastName: string; dateOfBirth?: string | null }): Promise<Household> {
  assertDateOfBirth(input.dateOfBirth);
  return withTransaction(async (tx) => {
    const householdId = await assertManager(tx, managerProfileId);
    await tx.execute(sql`SELECT id FROM households WHERE id = ${householdId} FOR UPDATE`);
    const count = await one<{ n: number }>(tx, sql`SELECT count(*)::int AS n FROM household_members WHERE household_id = ${householdId} AND left_at IS NULL`);
    if ((count?.n ?? 0) >= MAX_MEMBERS) throw new AppError('RULE_VIOLATION', `A household can have up to ${MAX_MEMBERS} members.`);
    const profileId = uuidv7();
    await tx.execute(sql`INSERT INTO profiles (id, first_name, last_name, date_of_birth) VALUES (${profileId}, ${input.firstName.trim()}, ${input.lastName.trim()}, ${input.dateOfBirth || null}::date)`);
    await tx.execute(sql`INSERT INTO household_members (household_id, profile_id, role) VALUES (${householdId}, ${profileId}, 'member')`);
    return getMyHousehold(managerProfileId, tx);
  });
}

export async function updateMember(actorProfileId: string, targetProfileId: string, input: ProfileInput): Promise<Household> {
  assertDateOfBirth(input.dateOfBirth);
  return withTransaction(async (tx) => {
    await assertCanEditMember(actorProfileId, targetProfileId, tx);
    await tx.execute(sql`UPDATE profiles SET first_name = ${input.firstName.trim()}, last_name = ${input.lastName.trim()},
                                date_of_birth = ${input.dateOfBirth || null}::date, updated_at = now() WHERE id = ${targetProfileId}`);
    return getMyHousehold(actorProfileId, tx);
  });
}

/** Leaving keeps orders and sizes: the person moves to a fresh solo household. */
async function moveToSoloHousehold(tx: Transaction, profileId: string): Promise<void> {
  await tx.execute(sql`UPDATE household_members SET left_at = now(), updated_at = now() WHERE profile_id = ${profileId} AND left_at IS NULL`);
  const householdId = uuidv7();
  await tx.execute(sql`INSERT INTO households (id) VALUES (${householdId})`);
  await tx.execute(sql`INSERT INTO household_members (household_id, profile_id, role) VALUES (${householdId}, ${profileId}, 'manager')`);
}

async function assertManagerRemains(tx: Transaction, householdId: string): Promise<void> {
  const row = await one<{ members: number; managers: number }>(tx, sql`
    SELECT count(*)::int AS members, count(*) FILTER (WHERE role = 'manager')::int AS managers
      FROM household_members WHERE household_id = ${householdId} AND left_at IS NULL`);
  if (row && row.members > 0 && row.managers === 0) {
    throw new AppError('RULE_VIOLATION', 'Make another member a manager before leaving.');
  }
}

export async function removeMember(managerProfileId: string, targetProfileId: string): Promise<Household> {
  if (managerProfileId === targetProfileId) throw new AppError('RULE_VIOLATION', 'Use "Leave household" to remove yourself.');
  return withTransaction(async (tx) => {
    const householdId = await assertManager(tx, managerProfileId);
    const target = await membership(tx, targetProfileId);
    if (target.household_id !== householdId) throw new AppError('NOT_FOUND', 'That person is not in your household.');
    await moveToSoloHousehold(tx, targetProfileId);
    return getMyHousehold(managerProfileId, tx);
  });
}

export async function leaveHousehold(profileId: string): Promise<Household> {
  return withTransaction(async (tx) => {
    const me = await membership(tx, profileId);
    const others = await one<{ n: number }>(tx, sql`SELECT count(*)::int AS n FROM household_members WHERE household_id = ${me.household_id} AND left_at IS NULL AND profile_id <> ${profileId}`);
    if ((others?.n ?? 0) === 0) throw new AppError('RULE_VIOLATION', 'You are the only member of this household.');
    await moveToSoloHousehold(tx, profileId);
    await assertManagerRemains(tx, me.household_id);
    return getMyHousehold(profileId, tx);
  });
}

export async function setMemberRole(managerProfileId: string, targetProfileId: string, role: 'manager' | 'member'): Promise<Household> {
  return withTransaction(async (tx) => {
    const householdId = await assertManager(tx, managerProfileId);
    const target = await membership(tx, targetProfileId);
    if (target.household_id !== householdId) throw new AppError('NOT_FOUND', 'That person is not in your household.');
    const hasLogin = await one<{ ok: boolean }>(tx, sql`SELECT (user_id IS NOT NULL) AS ok FROM profiles WHERE id = ${targetProfileId}`);
    if (role === 'manager' && !hasLogin?.ok) throw new AppError('RULE_VIOLATION', 'Only members with their own login can be managers.');
    await tx.execute(sql`UPDATE household_members SET role = ${role}, updated_at = now() WHERE household_id = ${householdId} AND profile_id = ${targetProfileId} AND left_at IS NULL`);
    await assertManagerRemains(tx, householdId);
    return getMyHousehold(managerProfileId, tx);
  });
}

// ------------------------------------------------------- size preferences

export interface SizePreference {
  categoryId: string;
  sizeValueId: string;
  sizeValue: string;
}

export async function getSizePreferences(actorProfileId: string, targetProfileId: string): Promise<SizePreference[]> {
  // Any member may READ a household member's sizes (they order for them).
  await assertSameHousehold(actorProfileId, targetProfileId);
  const rows = await many<{ category_id: string; size_value_id: string; value: string }>(getDb(), sql`
    SELECT psp.category_id, psp.size_value_id, av.value FROM profile_size_preferences psp
      JOIN attribute_values av ON av.id = psp.size_value_id WHERE psp.profile_id = ${targetProfileId}`);
  return rows.map((r) => ({ categoryId: r.category_id, sizeValueId: r.size_value_id, sizeValue: r.value }));
}

async function assertSameHousehold(a: string, b: string): Promise<void> {
  if (a === b) return;
  const ok = await one<{ ok: number }>(getDb(), sql`
    SELECT 1 AS ok FROM household_members x JOIN household_members y ON y.household_id = x.household_id
     WHERE x.profile_id = ${a} AND y.profile_id = ${b} AND x.left_at IS NULL AND y.left_at IS NULL`);
  if (!ok) throw new AppError('FORBIDDEN', 'That person is not in your household.');
}

/** Saved size per category (self or manager). The composite FK proves the value belongs to its definition. */
export async function setSizePreference(actorProfileId: string, targetProfileId: string, input: { categoryId: string; sizeDefinitionId: string; sizeValueId: string }): Promise<void> {
  await withTransaction(async (tx) => {
    await assertCanEditMember(actorProfileId, targetProfileId, tx);
    try {
      await tx.execute(sql`
        INSERT INTO profile_size_preferences (profile_id, category_id, size_definition_id, size_value_id)
        VALUES (${targetProfileId}, ${input.categoryId}, ${input.sizeDefinitionId}, ${input.sizeValueId})
        ON CONFLICT (profile_id, category_id) DO UPDATE SET size_definition_id = EXCLUDED.size_definition_id,
               size_value_id = EXCLUDED.size_value_id, updated_at = now()`);
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code;
      if (code === '23503') throw new AppError('VALIDATION_FAILED', 'That size does not belong to this size chart.');
      throw error;
    }
  });
}

// ------------------------------------------------------------ admin views

export type CustomerTier = 'VIP Customer' | 'Active' | 'New';

export interface CustomerSummary {
  profileId: string;
  userId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  joinedAt: string;
  orderCount: number;
  totalSpentPaise: number;
  tier: CustomerTier;
}

/** Tier is computed, never stored (DOC/backend/02). */
export function tierFor(orderCount: number, totalSpentPaise: number, lastOrderDays: number | null): CustomerTier {
  if (totalSpentPaise >= 25_000_00 || orderCount >= 8) return 'VIP Customer';
  if (lastOrderDays !== null && lastOrderDays <= 90) return 'Active';
  return 'New';
}

export async function listCustomers(input: { q?: string; page?: number; perPage?: number }): Promise<{ data: CustomerSummary[]; total: number; page: number; perPage: number }> {
  const perPage = Math.min(Math.max(Math.trunc(input.perPage ?? 25), 1), 100);
  const page = Math.max(Math.trunc(input.page ?? 1), 1);
  const q = (input.q ?? '').trim().slice(0, 100);
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const where = q
    ? sql`AND (u.email ILIKE ${like} OR p.first_name ILIKE ${like} OR p.last_name ILIKE ${like} OR p.phone ILIKE ${like})`
    : sql``;
  const rows = await many<{ id: string; user_id: string; first_name: string; last_name: string; email: string; phone: string | null; status: string; joined: string;
                            city: string | null; orders: number; spent: string; last_days: number | null; total: number }>(getDb(), sql`
    SELECT p.id, p.user_id, p.first_name, p.last_name, u.email, p.phone, u.status, u.created_at::text AS joined,
           (SELECT a.city FROM addresses a WHERE a.profile_id = p.id ORDER BY a.is_default DESC, a.created_at LIMIT 1) AS city,
           COALESCE(o.n, 0)::int AS orders, COALESCE(o.spent, 0)::text AS spent, o.last_days,
           count(*) OVER ()::int AS total
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id AND r.slug = 'customer'
      JOIN profiles p ON p.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT count(*) AS n, sum(grand_total) FILTER (WHERE payment_status = 'paid') AS spent,
               (current_date - max(created_at)::date) AS last_days
          FROM orders WHERE placed_by_user_id = u.id AND order_type = 'standard'
      ) o ON true
     WHERE true ${where}
     ORDER BY u.created_at DESC
     LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`);
  return {
    data: rows.map((r) => {
      const spent = toPaise(r.spent);
      return {
        profileId: r.id, userId: r.user_id, name: `${r.first_name} ${r.last_name}`.trim(), email: r.email, phone: r.phone, city: r.city,
        status: r.status, joinedAt: r.joined, orderCount: r.orders, totalSpentPaise: spent, tier: tierFor(r.orders, spent, r.last_days),
      };
    }),
    total: rows[0]?.total ?? 0,
    page,
    perPage,
  };
}

export interface CustomerNote {
  id: string;
  note: string;
  authorName: string;
  createdAt: string;
}

export async function getCustomerDetail(profileId: string): Promise<{ summary: CustomerSummary | null; addresses: Address[]; household: Household | null; notes: CustomerNote[] }> {
  const user = await one<{ user_id: string | null; email: string | null }>(getDb(), sql`SELECT p.user_id, u.email FROM profiles p LEFT JOIN users u ON u.id = p.user_id WHERE p.id = ${profileId}`);
  if (!user) throw new AppError('NOT_FOUND', 'Customer not found.');
  const summary = user.email ? (await listCustomers({ q: user.email, perPage: 1 })).data.find((c) => c.profileId === profileId) ?? null : null;
  const notes = await many<{ id: string; note: string; author: string; created_at: string }>(getDb(), sql`
    SELECT n.id, n.note, COALESCE(NULLIF(trim(concat_ws(' ', ap.first_name, ap.last_name)), ''), au.email) AS author, n.created_at::text
      FROM customer_notes n JOIN users au ON au.id = n.author_id LEFT JOIN profiles ap ON ap.user_id = au.id
     WHERE n.profile_id = ${profileId} ORDER BY n.created_at DESC LIMIT 100`);
  let household: Household | null = null;
  try { household = await getMyHousehold(profileId); } catch { household = null; }
  return {
    summary,
    addresses: await listAddresses(profileId),
    household,
    notes: notes.map((n) => ({ id: n.id, note: n.note, authorName: n.author, createdAt: n.created_at })),
  };
}

export async function addCustomerNote(profileId: string, authorUserId: string, note: string): Promise<CustomerNote[]> {
  const text = note.trim();
  if (!text) throw new AppError('VALIDATION_FAILED', 'Write a note first.', [{ field: 'note', message: 'Required' }]);
  if (text.length > 2000) throw new AppError('VALIDATION_FAILED', 'Notes are limited to 2,000 characters.', [{ field: 'note', message: 'Too long' }]);
  const exists = await one<{ id: string }>(getDb(), sql`SELECT id FROM profiles WHERE id = ${profileId}`);
  if (!exists) throw new AppError('NOT_FOUND', 'Customer not found.');
  await getDb().execute(sql`INSERT INTO customer_notes (id, profile_id, author_id, note) VALUES (${uuidv7()}, ${profileId}, ${authorUserId}, ${text})`);
  return (await getCustomerDetail(profileId)).notes;
}

// ----------------------------------------------------- household invites

const HOUSEHOLD_INVITE_DAYS = 7;

/** Manager invites an existing (or future) account by email to join. */
export async function inviteToHousehold(managerProfileId: string, rawEmail: string, invitedByUserId: string): Promise<{ token: string; inviteId: string }> {
  const { hashSecret, randomSecret } = await import('../auth/tokens.ts');
  const email = rawEmail.trim().toLowerCase();
  const token = randomSecret();
  const inviteId = uuidv7();
  await withTransaction(async (tx) => {
    const householdId = await assertManager(tx, managerProfileId);
    const already = await one<{ ok: number }>(tx, sql`
      SELECT 1 AS ok FROM household_members hm JOIN profiles p ON p.id = hm.profile_id JOIN users u ON u.id = p.user_id
       WHERE hm.household_id = ${householdId} AND hm.left_at IS NULL AND u.email = ${email}`);
    if (already) throw new AppError('CONFLICT', 'That person is already in your household.');
    try {
      await tx.execute(sql`INSERT INTO household_invitations (id, household_id, email, token_hash, expires_at, invited_by)
                           VALUES (${inviteId}, ${householdId}, ${email}, ${hashSecret(token)}, now() + make_interval(days => ${HOUSEHOLD_INVITE_DAYS}), ${invitedByUserId})`);
    } catch (error) {
      if ((error as { cause?: { code?: string } }).cause?.code === '23505') throw new AppError('CONFLICT', 'There is already a pending invitation for this email.');
      throw error;
    }
  });
  return { token, inviteId };
}

/** The invited, signed-in account accepts: atomically leaves its current household and joins. */
export async function acceptHouseholdInvite(token: string, userId: string, userEmail: string): Promise<Household> {
  const { hashSecret } = await import('../auth/tokens.ts');
  return withTransaction(async (tx) => {
    const invite = await one<{ id: string; household_id: string; email: string | null }>(tx, sql`
      UPDATE household_invitations SET status = 'accepted'
       WHERE token_hash = ${hashSecret(token)} AND status = 'pending' AND expires_at > now() AND email IS NOT NULL
      RETURNING id, household_id, email`);
    if (!invite) throw new AppError('RULE_VIOLATION', 'This invitation is invalid, expired or already used.');
    if (invite.email !== userEmail.trim().toLowerCase()) throw new AppError('FORBIDDEN', 'This invitation was sent to a different email address.');
    const profileId = await profileIdForUser(userId, tx);
    const current = await membership(tx, profileId);
    if (current.household_id === invite.household_id) throw new AppError('CONFLICT', 'You are already in this household.');
    await tx.execute(sql`UPDATE household_members SET left_at = now(), updated_at = now() WHERE profile_id = ${profileId} AND left_at IS NULL`);
    await assertManagerRemains(tx, current.household_id);
    await tx.execute(sql`INSERT INTO household_members (household_id, profile_id, role) VALUES (${invite.household_id}, ${profileId}, 'member')
                         ON CONFLICT (household_id, profile_id) DO UPDATE SET left_at = NULL, role = 'member', joined_at = now(), updated_at = now()`);
    return getMyHousehold(profileId, tx);
  });
}

export async function revokeHouseholdInvite(managerProfileId: string, inviteId: string): Promise<void> {
  await withTransaction(async (tx) => {
    const householdId = await assertManager(tx, managerProfileId);
    await tx.execute(sql`UPDATE household_invitations SET status = 'revoked' WHERE id = ${inviteId} AND household_id = ${householdId} AND status = 'pending'`);
  });
}

export async function listHouseholdInvites(managerProfileId: string): Promise<{ id: string; email: string | null; expiresAt: string }[]> {
  const householdId = await assertManager(getDb(), managerProfileId);
  const rows = await many<{ id: string; email: string | null; expires_at: string }>(getDb(), sql`
    SELECT id, email, expires_at::text FROM household_invitations
     WHERE household_id = ${householdId} AND status = 'pending' AND expires_at > now() ORDER BY created_at DESC`);
  return rows.map((r) => ({ id: r.id, email: r.email, expiresAt: r.expires_at }));
}
