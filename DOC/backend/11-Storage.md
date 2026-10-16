# Storage — R2 Decision Record, Upload Rules

> Status: Filling | Last Updated: 2026-10-15
> Bytes live in object storage; the database keeps **URLs only**. Swapping
> providers touches env + one SDK import — never schema, never migrations.

## Decision: Cloudflare R2 (recorded 2026-10-14, researched same-day)

| Option | Free tier | Egress | Verdict |
|---|---|---|---|
| **Cloudflare R2** | 10 GB, 1M writes + 10M reads/mo | Free, unlimited | **Chosen** — S3-compatible, zero-egress caps the scary bill |
| Vercel Blob | ~1 GB, then paid | $0.15/GB after 1 GB | Rejected — same R2 underneath at ~2× markup ($2/M reads vs $0.36/M) |
| Supabase Storage | 1 GB + 5 GB egress | $0.09/GB after quota | Rejected — couples files to the DB host for zero benefit |
| AWS S3 direct | 5 GB, 12 months only | $0.09/GB | Rejected — trial-shaped free tier, egress bills from day 366 |

Revisit trigger: sustained egress/storage past free tier for 3 months, or
a provider outage — not before. Re-evaluation is a new dated entry here,
never an edit of this one.

## No storage tables (explicit non-decision)

There is deliberately **no `files`/`uploads` table**. Every byte's
metadata lives where it's used (`media`, `product_images`,
`users.avatar_url`). A central files registry would duplicate those rows
and drift from them — the failure mode it pretends to solve.

## Upload flow (presigned, never raw credentials client-side)

1. Client requests a PUT URL from `POST /api/media` (auth + type/size
   validated server-side).
2. Server returns a presigned R2 PUT (15-min expiry) for
   `product/{productId}/{uuid}.webp` (or matching prefix per usage).
3. Client PUTs bytes direct to R2; server confirms (HEAD) then writes
   the DB row. Unconfirmed keys die via lifecycle rule (below) —
   orphans are impossible by construction, not cleanup.

## Image pipeline rule

WebP-first, responsive widths generated at upload, `alt` required for
product images (upload UI enforces; DB allows NULL only for legacy
rows). Originals kept 30d for re-derivation, then lifecycle-deleted.

## Cost guardrails (free-tier survival)

- Watch: Class A (writes/lists) vs 1M/mo, Class B (reads) vs 10M/mo,
  storage vs 10 GB. Alert at 70% on all three.
- Lifecycle: abort incomplete multipart uploads (7d), delete
  unconfirmed keys (30d), originals (30d per above).
- First paid dollar arrives via operations volume, never storage —
  the dashboard for it lives in file 10's views, not here.
