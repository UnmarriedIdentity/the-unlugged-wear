import 'server-only';
import * as customers from '@tuw/heart/modules/customers';
import { session } from './session';

// Everything the account + checkout screens need about the signed-in
// shopper, read once per request (only those layouts call it).
export interface AccountData {
  profile: customers.MyProfile;
  addresses: customers.Address[];
  household: customers.Household;
  invites: { id: string; email: string | null; expiresAt: string }[];
}

export async function getMyAccount(): Promise<AccountData | null> {
  const claims = await session.currentClaims();
  if (!claims) return null;
  const profile = await customers.getMyProfile(claims.sub);
  const [addresses, household] = await Promise.all([customers.listAddresses(profile.profileId), customers.getMyHousehold(profile.profileId)]);
  const invites = household.myRole === 'manager' ? await customers.listHouseholdInvites(profile.profileId) : [];
  return { profile, addresses, household, invites };
}
