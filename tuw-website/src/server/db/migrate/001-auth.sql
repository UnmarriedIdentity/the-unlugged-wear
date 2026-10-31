-- 001-auth.sql — Auth & RBAC (13 tables)
-- Source of truth: DOC/backend/03-Auth-RBAC.md (transcribed 1:1).
-- Conventions: UUIDv7 PKs (app-generated), timestamptz pairs, varchar+CHECK.
-- Order matters: parents before children (roles/permissions before joins).
-- users = credential, profiles = person (names/phone/DOB); addresses moved
-- to 011-household.sql — the book is household-scoped, not login-scoped.

-- ---------------------------------------------------------------- roles
CREATE TABLE roles (
  id          uuid         PRIMARY KEY,
  name        varchar(50)  NOT NULL,
  slug        varchar(50)  NOT NULL UNIQUE,
  description varchar(255),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------- permissions
CREATE TABLE permissions (
  id          uuid         PRIMARY KEY,
  name        varchar(100) NOT NULL,
  slug        varchar(100) NOT NULL UNIQUE,
  description varchar(255),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------- users
-- `pending` = account created by staff or an invite that has never set a
-- password (`password_hash` NULL). Login is blocked until the set-password
-- token is used and the status flips to `active`.
CREATE TABLE users (
  id            uuid         PRIMARY KEY,
  email         varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255),
  status        varchar(20)  NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','disabled')),
  last_login_at timestamptz,
  -- Set by the lockout policy (N failures in a window). A future timestamp
  -- blocks sign-in with no row reads; NULL or past means unlocked.
  locked_until  timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------ profiles
-- The person you shop for. user_id NULL = managed family member with no
-- login (no email required). One profile per user; one household per
-- profile (011-household.sql).
CREATE TABLE profiles (
  id            uuid         PRIMARY KEY,
  user_id       uuid         UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  first_name    varchar(100) NOT NULL,
  last_name     varchar(100) NOT NULL,
  phone         varchar(20),
  date_of_birth date,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------- role_permissions
CREATE TABLE role_permissions (
  role_id       uuid NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
CREATE INDEX idx_role_permissions_permission_id
  ON role_permissions (permission_id);

-- ------------------------------------------------------------ user_roles
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- addresses moved to 011-household.sql — household-scoped book (shared +
-- personal rows, household-level defaults).

-- -------------------------------------------------------- refresh_tokens
CREATE TABLE refresh_tokens (
  id         uuid         PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash varchar(255) NOT NULL UNIQUE,
  expires_at timestamptz  NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- --------------------------------------------------- password_reset_tokens
-- Same grammar as refresh_tokens: raw token never stored, only its SHA-256.
-- Serves both "forgot password" and "set your password" for an invited
-- account (users.password_hash IS NULL) — the reset page renders "Set
-- password" instead of "Reset" when no password exists yet.
CREATE TABLE password_reset_tokens (
  id         uuid         PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash varchar(255) NOT NULL UNIQUE,
  expires_at timestamptz  NOT NULL,
  used_at    timestamptz,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_user_id
  ON password_reset_tokens (user_id);
CREATE INDEX idx_password_reset_tokens_expires_at
  ON password_reset_tokens (expires_at);

-- ------------------------------------------------ email_verification_tokens
-- Email lives on the token (not only on users) so an invitation can be
-- issued before a profile exists. One row per attempt; `used_at` marks it
-- consumed, expiry cleanup sweeps the rest.
CREATE TABLE email_verification_tokens (
  id         uuid         PRIMARY KEY,
  user_id    uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  email      varchar(255) NOT NULL,
  token_hash varchar(255) NOT NULL UNIQUE,
  expires_at timestamptz  NOT NULL,
  used_at    timestamptz,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_verification_tokens_user_id
  ON email_verification_tokens (user_id);
CREATE INDEX idx_email_verification_tokens_email
  ON email_verification_tokens (email);
CREATE INDEX idx_email_verification_tokens_expires_at
  ON email_verification_tokens (expires_at);

-- --------------------------------------------------------- login_attempts
-- Brute-force evidence. One row per attempt, success or failure; the lockout
-- policy reads the last N failures for an email and for an IP. Append-only,
-- swept by a retention job (90d) — it is evidence, not state.
CREATE TABLE login_attempts (
  id         uuid         PRIMARY KEY,
  email      varchar(255) NOT NULL,
  -- inet (not text): CIDR containment queries for "this subnet is spraying"
  -- and no malformed address can be stored.
  ip_address inet,
  -- NULL when no user matched — a failed guess at an unknown email still
  -- needs a row.
  user_id    uuid         REFERENCES users (id) ON DELETE SET NULL,
  succeeded  boolean      NOT NULL DEFAULT false,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_attempts_email_time ON login_attempts (email, created_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts (ip_address, created_at DESC)
  WHERE ip_address IS NOT NULL;
CREATE INDEX idx_login_attempts_user_id ON login_attempts (user_id);

-- -------------------------------------------------------- customer_notes
CREATE TABLE customer_notes (
  id         uuid        PRIMARY KEY,
  profile_id uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  note       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_notes_profile_id ON customer_notes (profile_id);

-- ----------------------------------------------------- staff_invitations
CREATE TABLE staff_invitations (
  id         uuid         PRIMARY KEY,
  email      varchar(255) NOT NULL,
  role_id    uuid         NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
  token_hash varchar(255) NOT NULL UNIQUE,
  status     varchar(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at timestamptz  NOT NULL,
  invited_by uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_invitations_email ON staff_invitations (email);

-- ------------------------------------------------------------- audit_logs
CREATE TABLE audit_logs (
  id         uuid        PRIMARY KEY,
  actor_id   uuid        REFERENCES users (id) ON DELETE SET NULL,
  action     varchar(100) NOT NULL,
  entity     varchar(100) NOT NULL,
  entity_id  uuid,
  diff       jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
-- One import summary row per product per job. A retried or double-clicked
-- import cannot log the same job twice.
CREATE UNIQUE INDEX one_import_summary_per_product_job
  ON audit_logs (entity, entity_id, (diff ->> 'job_id'))
  WHERE action = 'stock.import' AND (diff ->> 'job_id') IS NOT NULL;
