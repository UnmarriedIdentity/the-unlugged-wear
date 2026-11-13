import bcrypt from 'bcryptjs';

// bcrypt, cost 12 (DOC/backend/03 §7). bcrypt only reads the first 72
// bytes, so longer passwords are rejected instead of silently truncated.
export const BCRYPT_COST = 12;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 72;

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) return 'Use at most 72 bytes (shorter, or fewer emoji).';
  if (!password.trim()) return 'The password cannot be only spaces.';
  return null;
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, BCRYPT_COST);

export const verifyPassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

/** True when a stored hash used an older cost and should be upgraded at login. */
export function needsRehash(hash: string): boolean {
  const cost = Number(hash.split('$')[2]);
  return !Number.isFinite(cost) || cost < BCRYPT_COST;
}

// A real hash of a random string: comparing against it when the email is
// unknown keeps login timing the same for real and unknown accounts.
let dummyHash: Promise<string> | undefined;
export const timingDummyHash = (): Promise<string> => (dummyHash ??= hashPassword(`dummy-${Math.random()}`));
