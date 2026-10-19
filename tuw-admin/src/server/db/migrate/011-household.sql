-- 011-household.sql — Household accounts (5 tables)
-- Source of truth: DOC/backend/17-Household-Accounts.md (transcribed 1:1).
-- profiles lives in 001-auth.sql (identity: users = credential, profiles =
-- person). This file owns the grouping: households, memberships, sizes,
-- invitations, and the household-scoped address book (moved from 001).
-- Order matters: households before members/invitations; profiles first.

-- ------------------------------------------------------------ households
CREATE TABLE households (
  id         uuid        PRIMARY KEY,
  name       varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------- household_members
CREATE TABLE household_members (
  household_id uuid        NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  profile_id   uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  role         varchar(10) NOT NULL DEFAULT 'member'
    CHECK (role IN ('manager','member')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, profile_id),
  UNIQUE (profile_id)
);

-- ----------------------------------------------- profile_size_preferences
CREATE TABLE profile_size_preferences (
  profile_id    uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  category_id   uuid        NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  size_value_id uuid        NOT NULL REFERENCES attribute_values (id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, category_id)
);
CREATE INDEX idx_psp_category_id ON profile_size_preferences (category_id);
CREATE INDEX idx_psp_size_value_id ON profile_size_preferences (size_value_id);

-- --------------------------------------------- household_invitations
CREATE TABLE household_invitations (
  id           uuid         PRIMARY KEY,
  household_id uuid         NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  email        varchar(255),
  profile_id   uuid         REFERENCES profiles (id) ON DELETE CASCADE,
  token_hash   varchar(255) NOT NULL UNIQUE,
  status       varchar(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at   timestamptz  NOT NULL,
  invited_by   uuid         REFERENCES users (id) ON DELETE SET NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR profile_id IS NOT NULL)
);
CREATE INDEX idx_household_invitations_household_id
  ON household_invitations (household_id);
CREATE INDEX idx_household_invitations_email
  ON household_invitations (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX one_pending_join_per_email
  ON household_invitations (household_id, email)
  WHERE status = 'pending' AND email IS NOT NULL;
CREATE UNIQUE INDEX one_pending_claim_per_profile
  ON household_invitations (profile_id)
  WHERE status = 'pending' AND profile_id IS NOT NULL;

-- ------------------------------------------------------------- addresses
-- Moved from 001-auth.sql — the book is household-scoped, not login-scoped.
-- profile_id NULL = family-shared row; set = personal row.
CREATE TABLE addresses (
  id           uuid         PRIMARY KEY,
  household_id uuid         NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  profile_id   uuid         REFERENCES profiles (id) ON DELETE CASCADE,
  type         varchar(10)  NOT NULL DEFAULT 'shipping'
    CHECK (type IN ('shipping','billing')),
  label        varchar(50),
  line1        varchar(255) NOT NULL,
  line2        varchar(255),
  city         varchar(100) NOT NULL,
  state        varchar(100),
  postal_code  varchar(20)  NOT NULL,
  country      varchar(2)   NOT NULL DEFAULT 'IN',
  is_default   boolean      NOT NULL DEFAULT false,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_household_id ON addresses (household_id);
CREATE INDEX idx_addresses_profile_id ON addresses (profile_id);
CREATE UNIQUE INDEX one_default_shipping_per_household
  ON addresses (household_id) WHERE is_default AND type = 'shipping';
CREATE UNIQUE INDEX one_default_billing_per_household
  ON addresses (household_id) WHERE is_default AND type = 'billing';
