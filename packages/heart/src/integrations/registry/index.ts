import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb, withTransaction, type Transaction } from '../../platform/db/index.ts';
import { AppError } from '../../platform/errors/index.ts';
import { recordAudit } from '../../platform/audit/index.ts';
import { paymentAdapters } from '../payments/adapters.ts';
import { fulfillmentAdapters } from '../fulfillment/adapters.ts';
import { emailAdapters } from '../email/index.ts';

// Integration provider registry (DOC/backend/16 §1). Owns integration_providers:
// which provider is active per category and whether it runs sandbox or live.
// Secrets never live here (env only). A provider can be switched on only if
// an adapter exists, and live only if that adapter reports live keys.

export type ProviderCategory = 'payment' | 'fulfillment' | 'shipping' | 'email' | 'sms' | 'other';
type Db = Transaction | ReturnType<typeof getDb>;

const ADAPTERS = new Map<string, { liveReady(): boolean }>(
  [...paymentAdapters, ...fulfillmentAdapters, ...emailAdapters].map((a) => [a.slug, a]),
);

/** Categories where exactly one provider must be active (one checkout gateway, one sender). */
const SINGLE_ACTIVE: ReadonlySet<ProviderCategory> = new Set(['payment', 'email']);

export interface Provider {
  slug: string;
  name: string;
  category: ProviderCategory;
  environment: 'sandbox' | 'live';
  isActive: boolean;
  capabilities: Record<string, unknown>;
  settings: Record<string, unknown>;
  /** An adapter is built (mock/simulator or real). */
  hasAdapter: boolean;
  /** The adapter can run live (real adapter + keys in env). */
  liveReady: boolean;
  updatedAt: string;
}

type Row = { slug: string; name: string; category: ProviderCategory; environment: 'sandbox' | 'live'; is_active: boolean; capabilities: Record<string, unknown>; settings: Record<string, unknown>; updated_at: string };

const toProvider = (r: Row): Provider => {
  const adapter = ADAPTERS.get(r.slug);
  return {
    slug: r.slug, name: r.name, category: r.category, environment: r.environment, isActive: r.is_active,
    capabilities: r.capabilities ?? {}, settings: r.settings ?? {},
    hasAdapter: Boolean(adapter), liveReady: adapter?.liveReady() ?? false,
    updatedAt: new Date(r.updated_at).toISOString(),
  };
};

export async function listProviders(category?: ProviderCategory, db: Db = getDb()): Promise<Provider[]> {
  const { rows } = await db.execute<Row>(category
    ? sql`SELECT * FROM integration_providers WHERE category = ${category} ORDER BY is_active DESC, name`
    : sql`SELECT * FROM integration_providers ORDER BY category, is_active DESC, name`);
  return rows.map(toProvider);
}

/** The active provider's slug for a category, or null when none is switched on. */
export async function activeProviderSlug(category: ProviderCategory, db: Db = getDb()): Promise<string | null> {
  const { rows } = await db.execute<{ slug: string }>(sql`SELECT slug FROM integration_providers WHERE category = ${category} AND is_active ORDER BY updated_at DESC LIMIT 1`);
  return rows[0]?.slug ?? null;
}

export interface ProviderPatch {
  isActive?: boolean;
  environment?: 'sandbox' | 'live';
}

export async function updateProvider(slug: string, patch: ProviderPatch, actorId: string): Promise<Provider[]> {
  return withTransaction(async (tx) => {
    const { rows: [target] } = await tx.execute<Row>(sql`SELECT * FROM integration_providers WHERE slug = ${slug}`);
    if (!target) throw new AppError('NOT_FOUND', 'That provider does not exist.');
    // Serialise toggles within a category (two admins switching gateways at once).
    const { rows: peers } = await tx.execute<Row>(sql`SELECT * FROM integration_providers WHERE category = ${target.category} ORDER BY slug FOR UPDATE`);
    const adapter = ADAPTERS.get(slug);
    const nextActive = patch.isActive ?? target.is_active;
    const nextEnv = patch.environment ?? target.environment;

    if (nextActive && !target.is_active && !adapter) {
      throw new AppError('RULE_VIOLATION', `${target.name} can be switched on once its adapter is built (integrations phase).`);
    }
    // Live needs a real adapter with keys — whether the change is "go live" or "switch on while live".
    const goingLive = nextEnv === 'live' && (target.environment !== 'live' || (nextActive && !target.is_active));
    if (goingLive && !adapter?.liveReady()) {
      throw new AppError('RULE_VIOLATION', `${target.name} cannot go live yet: its live adapter and keys arrive in the integrations phase.`);
    }
    const single = SINGLE_ACTIVE.has(target.category);
    if (single && target.is_active && !nextActive && peers.filter((p) => p.is_active).length <= 1) {
      throw new AppError('RULE_VIOLATION', `Keep one ${target.category === 'payment' ? 'payment provider' : 'email sender'} switched on — switch another one on instead.`);
    }

    const diff: Record<string, { from: unknown; to: unknown }> = {};
    if (nextActive !== target.is_active) diff[`${slug}.is_active`] = { from: target.is_active, to: nextActive };
    if (nextEnv !== target.environment) diff[`${slug}.environment`] = { from: target.environment, to: nextEnv };
    if (!Object.keys(diff).length) return listProviders(target.category, tx);

    if (single && nextActive) {
      for (const p of peers.filter((p) => p.is_active && p.slug !== slug)) diff[`${p.slug}.is_active`] = { from: true, to: false };
      await tx.execute(sql`UPDATE integration_providers SET is_active = false, updated_at = now() WHERE category = ${target.category} AND slug <> ${slug} AND is_active`);
    }
    await tx.execute(sql`UPDATE integration_providers SET is_active = ${nextActive}, environment = ${nextEnv}, updated_at = now() WHERE slug = ${slug}`);
    await recordAudit(tx, { actorId, action: 'integration.update', entity: 'integration_providers', diff });
    return listProviders(target.category, tx);
  });
}
