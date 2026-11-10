import { session } from '@/server/session';

// proxy.ts sends expired sessions here; rotates the refresh token and returns.
export const GET = (request: Request) => session.refreshRoute(request);
