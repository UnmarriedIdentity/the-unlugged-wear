import 'server-only';

// Auth module — public API (backend-modules skill). Other modules and the
// apps import only from here (or ./tokens for the proxy).
export {
  register,
  login,
  refresh,
  logout,
  logoutEverywhere,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  changePassword,
  listStaff,
  inviteStaff,
  revokeInvite,
  acceptInvite,
  setStaffRole,
  setUserStatus,
  bootstrapAdmin,
  loadClaims,
  normalizeEmail,
  LOCKOUT_MAX_FAILURES,
  LOCKOUT_MINUTES,
  type SessionTokens,
  type RequestMeta,
  type RegisterInput,
  type LoginInput,
  type StaffMember,
  type PendingInvite,
  type StaffRole,
} from './service.ts';
export { passwordProblem, PASSWORD_MIN, PASSWORD_MAX_BYTES } from './passwords.ts';
export * from './tokens.ts';
export * as authSchemas from './schemas.ts';

declare module '../../platform/events/index.ts' {
  interface HeartEvents {
    'auth.user_registered': { userId: string };
  }
}
