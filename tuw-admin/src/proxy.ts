import { createAuthProxy } from '@tuw/heart/next/proxy';

// Optimistic gate only (auth-guards skill): every admin page needs a staff
// session. Actions and data reads re-check role/permission in the guards.
const PUBLIC = ['/login', '/forgot-password', '/reset-password', '/accept-invite', '/signup', '/verify'];

export const proxy = createAuthProxy({
  app: 'admin',
  isProtected: (pathname) => !PUBLIC.includes(pathname) && !pathname.startsWith('/api/'),
});

// Skip Next internals, static files and API routes (they guard themselves).
export const config = { matcher: ['/((?!_next/|api/|images/|fonts/|favicon|.*\\.[a-z0-9]+$).*)'] };
