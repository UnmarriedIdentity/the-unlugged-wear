import { connection } from 'next/server';
import { checkDatabase } from '@tuw/heart/platform/db';

// GET /api/health — proves the app → @tuw/heart → database wiring end to end
// (TL-BE-01.12). Never cached; returns no secrets or connection details.
export async function GET() {
  await connection();
  try {
    const db = await checkDatabase();
    return Response.json({ app: 'tuw-website', status: 'ok', db });
  } catch (error) {
    console.error('[health] database check failed', error);
    return Response.json({ app: 'tuw-website', status: 'error', db: { ok: false } }, { status: 503 });
  }
}
