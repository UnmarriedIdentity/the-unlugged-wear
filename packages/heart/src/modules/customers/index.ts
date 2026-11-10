import 'server-only';
import { sql } from 'drizzle-orm';
import type { Transaction } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';

// Customers module — public API. Owns profiles, households, members,
// addresses (3.Database-Schema.md §4). TL-BE-03 fills in the rest; auth
// needs the account-holder bootstrap now: no user without a person, no
// person without a household (DOC/backend/03 §7, 17 §4).

export interface AccountHolderInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export async function createAccountHolder(tx: Transaction, input: AccountHolderInput): Promise<{ profileId: string; householdId: string }> {
  const profileId = uuidv7();
  const householdId = uuidv7();
  await tx.execute(sql`INSERT INTO profiles (id, user_id, first_name, last_name, phone)
                       VALUES (${profileId}, ${input.userId}, ${input.firstName}, ${input.lastName}, ${input.phone ?? null})`);
  await tx.execute(sql`INSERT INTO households (id, name) VALUES (${householdId}, ${`${input.firstName}'s household`})`);
  await tx.execute(sql`INSERT INTO household_members (household_id, profile_id, role) VALUES (${householdId}, ${profileId}, 'manager')`);
  return { profileId, householdId };
}

export async function getProfileByUserId(tx: Transaction, userId: string): Promise<{ id: string; firstName: string; lastName: string; phone: string | null } | null> {
  const { rows } = await tx.execute<{ id: string; first_name: string; last_name: string; phone: string | null }>(
    sql`SELECT id, first_name, last_name, phone FROM profiles WHERE user_id = ${userId}`,
  );
  const r = rows[0];
  return r ? { id: r.id, firstName: r.first_name, lastName: r.last_name, phone: r.phone } : null;
}
