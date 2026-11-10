import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { z } from 'zod';
import { AppError, isAppError, newRequestId, toEnvelope, type ErrorEnvelope } from '../errors/index.ts';
import { claim, complete, fail, hashRequest } from '../idempotency/index.ts';

// Declarative guards for server actions and route handlers (backend skills:
// server-actions, route-handlers, auth-guards). Each app builds its guards
// once with createGuards({ resolveContext }) — the resolver is the only part
// that knows about Next.js cookies/headers, so this package stays
// framework-free.

export type StorefrontAccess = 'public' | 'guestOrCustomer' | 'customer';

export interface RequestContext {
  requestId: string;
  user: { id: string; roles: string[]; permissions: string[] } | null;
  guestSessionId: string | null;
}

export type ResolveContext = () => Promise<Omit<RequestContext, 'requestId'>>;

export interface GuardOptions<S extends z.ZodTypeAny> {
  input: S;
  /** Storefront access level. */
  access?: StorefrontAccess;
  /** Admin: any staff role (anything except 'customer') plus this permission. */
  permission?: string;
  /** Admin: a role slug such as 'admin'. */
  role?: string;
  /** Idempotency scope (DOC/backend/21). Requires an idempotency key. */
  idempotent?: { scope: string; ttlHours?: number };
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorEnvelope['error']; requestId: string };

/** Next.js control-flow throws (redirect, notFound) must pass straight through. */
export function isFrameworkSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_');
}

export function authorize(ctx: RequestContext, opts: Pick<GuardOptions<z.ZodTypeAny>, 'access' | 'permission' | 'role'>): void {
  const staffOnly = Boolean(opts.permission || opts.role);
  if (staffOnly) {
    if (!ctx.user) throw new AppError('UNAUTHENTICATED', 'Please sign in.');
    const isStaff = ctx.user.roles.some((r) => r !== 'customer');
    if (!isStaff) throw new AppError('FORBIDDEN', 'Staff access required.');
    if (opts.role && !ctx.user.roles.includes(opts.role)) throw new AppError('FORBIDDEN', 'You do not have access to this action.');
    if (opts.permission && !ctx.user.permissions.includes(opts.permission)) {
      throw new AppError('FORBIDDEN', 'You do not have permission for this action.');
    }
    return;
  }
  const access = opts.access ?? 'customer';
  if (access === 'public') return;
  if (access === 'guestOrCustomer' && (ctx.user || ctx.guestSessionId)) return;
  if (access === 'customer' && ctx.user) return;
  throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
}

export function parseInput<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.infer<S> {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const details = parsed.error.issues.map((i) => ({ field: i.path.join('.') || undefined, message: i.message }));
  // The message names the first problem so a form that shows only the
  // message (no per-field highlight) is still truthful; details carry all.
  const first = details[0]?.message ?? 'Please check your details.';
  const more = details.length > 1 ? ` (and ${details.length - 1} more)` : '';
  throw new AppError('VALIDATION_FAILED', `${first.replace(/\.$/, '')}${more}.`, details);
}

export const actorRef = (ctx: RequestContext): string =>
  ctx.user ? `user:${ctx.user.id}` : ctx.guestSessionId ? `guest:${ctx.guestSessionId}` : 'anonymous';

/** FormData → plain object (repeated keys become arrays). */
export function formDataToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith('$ACTION')) continue;
    const prev = out[key];
    out[key] = prev === undefined ? value : Array.isArray(prev) ? [...prev, value] : [prev, value];
  }
  return out;
}

/** Constant-time compare (hash first so lengths match); a missing or short env secret never matches. */
export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 16 || !given) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

type Handler<S extends z.ZodTypeAny, T> = (args: { input: z.infer<S>; ctx: RequestContext }) => Promise<T>;

export function createGuards({ resolveContext }: { resolveContext: ResolveContext }) {
  async function context(): Promise<RequestContext> {
    return { requestId: newRequestId(), ...(await resolveContext()) };
  }

  async function run<S extends z.ZodTypeAny, T>(
    opts: GuardOptions<S>,
    raw: unknown,
    key: string | null,
    handler: Handler<S, T>,
  ): Promise<{ status: number; body: unknown; ctx: RequestContext }> {
    const ctx = await context();
    authorize(ctx, opts);
    const { idempotencyKey: _ignored, ...rest } = (raw ?? {}) as Record<string, unknown>;
    const input = parseInput(opts.input, rest);
    if (!opts.idempotent) return { status: 200, body: await handler({ input, ctx }), ctx };

    const claimed = await claim({
      scope: opts.idempotent.scope,
      actorRef: actorRef(ctx),
      key: key ?? '',
      requestHash: hashRequest(opts.idempotent.scope, input),
      userId: ctx.user?.id ?? null,
      ttlHours: opts.idempotent.ttlHours,
    });
    if (claimed.kind === 'replay') return { status: claimed.status, body: claimed.body, ctx };
    try {
      const body = await handler({ input, ctx });
      await complete(claimed.id, 200, body);
      return { status: 200, body, ctx };
    } catch (error) {
      if (!isFrameworkSignal(error)) {
        const { status, body } = toEnvelope(error, ctx.requestId);
        await fail(claimed.id, status, body).catch(() => {});
      }
      throw error;
    }
  }

  /** Server Action: returns ActionResult instead of throwing to the form. */
  function action<S extends z.ZodTypeAny, T>(opts: GuardOptions<S>, handler: Handler<S, T>) {
    return async (rawInput: FormData | Record<string, unknown>): Promise<ActionResult<T>> => {
      const raw = rawInput instanceof FormData ? formDataToObject(rawInput) : rawInput;
      const key = typeof raw.idempotencyKey === 'string' ? raw.idempotencyKey : null;
      try {
        const { status, body } = await run(opts, raw, key, handler);
        if (status >= 400) {
          const env = body as ErrorEnvelope;
          return { ok: false, error: env.error, requestId: env.requestId };
        }
        return { ok: true, data: body as T };
      } catch (error) {
        if (isFrameworkSignal(error)) throw error;
        if (!isAppError(error)) console.error('[action] unexpected error', error);
        const { body } = toEnvelope(error, newRequestId());
        return { ok: false, error: body.error, requestId: body.requestId };
      }
    };
  }

  /** Route Handler: JSON body in, JSON envelope out. */
  function route<S extends z.ZodTypeAny, T>(opts: GuardOptions<S> & { secret?: { header: string; env: string } }, handler: Handler<S, T>) {
    return async (request: Request): Promise<Response> => {
      const requestId = newRequestId();
      try {
        if (opts.secret) {
          if (!secretMatches(request.headers.get(opts.secret.header), process.env[opts.secret.env])) {
            throw new AppError('UNAUTHENTICATED', 'Invalid credentials.');
          }
        }
        const raw = request.method === 'GET' || request.method === 'HEAD'
          ? Object.fromEntries(new URL(request.url).searchParams)
          : await request.json().catch(() => {
              throw new AppError('VALIDATION_FAILED', 'Body must be JSON.');
            });
        const effective = opts.secret ? { ...opts, access: 'public' as const } : opts;
        const { status, body } = await run(effective, raw, request.headers.get('Idempotency-Key'), handler);
        return Response.json(status >= 400 ? body : { data: body }, { status });
      } catch (error) {
        if (isFrameworkSignal(error)) throw error;
        if (!isAppError(error)) console.error('[route] unexpected error', error);
        const { status, body } = toEnvelope(error, requestId);
        return Response.json(body, { status });
      }
    };
  }

  return { action, route, context };
}
