import 'server-only';
import { registerJob, listJobs, runJob } from './index.ts';
import { sweepExpired } from '../idempotency/index.ts';

// Every job the system runs, registered in one place so any trigger (Cron
// route, CLI, worker) sees the same list. Modules add theirs here as they
// land (TL-BE-06 inventory.notifyRestocked, TL-BE-11 fulfillment.*, …).
let loaded = false;

export function loadJobs(): void {
  if (loaded) return;
  loaded = true;
  registerJob({
    name: 'platform.sweepIdempotencyKeys',
    description: 'Delete expired idempotency_keys rows (TTL sweep, DOC/backend/21).',
    run: async () => ({ processed: await sweepExpired() }),
  });
}

export { listJobs, runJob };
