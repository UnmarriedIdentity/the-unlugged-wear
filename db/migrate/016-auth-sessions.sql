-- 016-auth-sessions.sql — columns the auth module needs (no new tables)
-- TL-BE-02. Forward migration on the applied schema.

-- Email verification state (email_verification_tokens records the proof;
-- this column is the fast read). Emails are stored lower-cased so the
-- existing UNIQUE (email) is case-insensitive in practice.
ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
ALTER TABLE users ADD CONSTRAINT users_email_lowercase CHECK (email = lower(email));

-- Refresh-token families (DOC/backend/03 §7): every rotation keeps the
-- family; presenting an already-rotated token revokes the whole family.
-- `app` keeps storefront and admin sessions apart (separate cookies).
ALTER TABLE refresh_tokens
  ADD COLUMN family_id  uuid,
  ADD COLUMN app        varchar(10),
  ADD COLUMN rotated_at timestamptz,
  ADD COLUMN user_agent varchar(255);
UPDATE refresh_tokens SET family_id = id, app = 'storefront' WHERE family_id IS NULL;
ALTER TABLE refresh_tokens
  ALTER COLUMN family_id SET NOT NULL,
  ALTER COLUMN app SET NOT NULL,
  ADD CONSTRAINT refresh_tokens_app_check CHECK (app IN ('storefront','admin'));
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);
-- Housekeeping sweep of expired tokens.
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- Staff invitation accept lookups by token are already UNIQUE; one live
-- invitation per email at a time.
CREATE UNIQUE INDEX one_pending_staff_invitation_per_email
  ON staff_invitations (lower(email)) WHERE status = 'pending';
