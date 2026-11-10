import 'server-only';
import { sql } from 'drizzle-orm';
import type { Transaction } from '../../platform/db/index.ts';
import { uuidv7 } from '../../platform/ids/index.ts';

// Customers module — public API (backend-modules skill). Owns profiles,
// households, household_members, household_invitations, addresses,
// profile_size_preferences and customer_notes (3.Database-Schema.md §4).
export * from './service.ts';
export * as customerSchemas from './schemas.ts';

export interface AccountHolderInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

/** Auth calls this inside its sign-up transaction: no user without a person, no person without a household. */
export async function createAccountHolder(tx: Transaction, input: AccountHolderInput): Promise<{ profileId: string; householdId: string }> {
  const profileId = uuidv7();
  const householdId = uuidv7();
  await tx.execute(sql`INSERT INTO profiles (id, user_id, first_name, last_name, phone)
                       VALUES (${profileId}, ${input.userId}, ${input.firstName}, ${input.lastName}, ${input.phone ?? null})`);
  await tx.execute(sql`INSERT INTO households (id, name) VALUES (${householdId}, ${`${input.firstName}'s household`})`);
  await tx.execute(sql`INSERT INTO household_members (household_id, profile_id, role) VALUES (${householdId}, ${profileId}, 'manager')`);
  return { profileId, householdId };
}
