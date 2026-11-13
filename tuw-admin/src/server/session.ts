import 'server-only';
import { createAppSession } from '@tuw/heart/next/session';
import { createGuards } from '@tuw/heart/platform/guards';

// Admin session + guards (auth-guards skill). Staff only: every action
// declares a role or permission; pages call session.requireStaff().
export const session = createAppSession('admin');
export const guards = createGuards({ resolveContext: session.resolveContext });
