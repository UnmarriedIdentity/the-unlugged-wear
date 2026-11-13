import { loadJobs, runJob } from '@tuw/heart/platform/jobs/catalog';
import { secretMatches } from '@tuw/heart/platform/guards';

// Cron entry point (route-handlers + background-jobs skills). Vercel Cron
// calls GET /api/cron/<job> with `Authorization: Bearer $CRON_SECRET`; a
// self-hosted worker can call the same URL or runJob() directly. No job
// logic lives here.
export async function GET(request: Request, { params }: { params: Promise<{ job: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (!secretMatches(request.headers.get('authorization'), secret ? `Bearer ${secret}` : undefined)) {
    return Response.json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid cron secret.', details: [] } }, { status: 401 });
  }
  const { job } = await params;
  loadJobs();
  const run = await runJob(job);
  return Response.json(run, { status: run.ok ? 200 : run.error === 'Unknown job' ? 404 : 500 });
}
