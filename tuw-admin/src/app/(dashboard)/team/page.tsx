import { listStaff } from '@tuw/heart/modules/auth';
import { session } from '@/server/session';
import TeamView from './_components/TeamView';

// Team & Permissions — real staff accounts and invitations (TL-BE-02.05/08).
// Server Component: the guard and the read happen here; TeamView only
// renders and calls the guarded actions.
export default async function TeamPage() {
  const me = await session.requireStaff('user.manage', '/team');
  const { members, invites } = await listStaff();
  return <TeamView members={members} invites={invites} currentUserId={me.sub} />;
}
