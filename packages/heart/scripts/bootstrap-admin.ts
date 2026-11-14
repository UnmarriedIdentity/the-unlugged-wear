// First admin from env (DOC/backend/03 §4 — no password hashes in SQL).
// Usage (repo root): pnpm auth:bootstrap-admin
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME in the
//   environment or the gitignored repo-root .env.local. Idempotent.
import { bootstrapAdmin } from '../src/modules/auth/index.ts';
import { closeDb } from '../src/platform/db/index.ts';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME = 'Store', ADMIN_LAST_NAME = 'Owner' } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. in the repo-root .env.local).');
  process.exit(1);
}
try {
  const { created, passwordUpdated } = await bootstrapAdmin(
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, firstName: ADMIN_FIRST_NAME, lastName: ADMIN_LAST_NAME },
    { updatePassword: true },
  );
  console.log(
    created
      ? `Admin ${ADMIN_EMAIL} created.`
      : `${ADMIN_EMAIL} already existed — admin role ensured (password ${passwordUpdated ? 'updated' : 'unchanged'}).`,
  );
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
