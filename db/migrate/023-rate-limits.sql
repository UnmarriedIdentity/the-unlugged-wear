-- 023-rate-limits.sql — Shared request throttle (TL-BE-08 slice 2).
-- One row per attempt at a public lookup (guest order tracking first). The
-- key is a hash, never a raw IP or email. Rows older than a day are swept by
-- the platform.sweepRateLimits job.
CREATE TABLE rate_limit_hits (
  id         uuid        PRIMARY KEY,
  bucket     varchar(50) NOT NULL,
  key_hash   char(64)    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limit_hits_lookup ON rate_limit_hits (bucket, key_hash, created_at DESC);
CREATE INDEX idx_rate_limit_hits_created_at ON rate_limit_hits (created_at);
