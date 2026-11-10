-- 011-household.sql — Household accounts (5 tables)
-- Source of truth: DOC/backend/17-Household-Accounts.md (transcribed 1:1).
-- profiles lives in 001-auth.sql (identity: users = credential, profiles =
-- person). This file owns the grouping: households, memberships, sizes,
-- invitations, and the private per-profile address book (moved from 001).
-- A household shares sizes, never addresses.
-- Order matters: households before members/invitations; profiles first.
-- The composite FK from orders is added at the end of this file.

-- ------------------------------------------------------------ households
CREATE TABLE households (
  id         uuid        PRIMARY KEY,
  name       varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------- household_members
-- Leaving is a soft leave (left_at), not a DELETE: orders keep pointing at the
-- membership row, so "who was this order for" survives the member leaving.
CREATE TABLE household_members (
  household_id uuid        NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  profile_id   uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  role         varchar(10) NOT NULL DEFAULT 'member'
    CHECK (role IN ('manager','member')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  left_at      timestamptz,                                   -- NULL = active
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, profile_id)
);
-- One active household per person. Re-joining the same household reactivates
-- the existing row instead of inserting a second one (PK does that for us).
CREATE UNIQUE INDEX one_active_household_per_profile
  ON household_members (profile_id) WHERE left_at IS NULL;
CREATE INDEX idx_household_members_profile_id ON household_members (profile_id);

-- ----------------------------------------------- profile_size_preferences
-- Myntra-style saved sizes: one row per person per category (a tee size, a
-- pant size, a shoe size). The definition is stored, not derived, so the
-- composite FK below can prove the value really belongs to that definition.
CREATE TABLE profile_size_preferences (
  profile_id         uuid        NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  category_id        uuid        NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  size_definition_id uuid        NOT NULL REFERENCES attribute_definitions (id) ON DELETE RESTRICT,
  size_value_id      uuid        NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, category_id),
  FOREIGN KEY (size_definition_id, size_value_id)
    REFERENCES attribute_values (definition_id, id) ON DELETE RESTRICT
);
CREATE INDEX idx_psp_category_id ON profile_size_preferences (category_id);
CREATE INDEX idx_psp_size_value_id ON profile_size_preferences (size_value_id);
CREATE INDEX idx_psp_size_definition_id ON profile_size_preferences (size_definition_id);

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
-- Moved from 001-auth.sql. The book belongs to ONE profile, not to the
-- household: family membership shares sizes, never addresses, so no query can
-- return another member's rows. No cap on how many a person saves.
-- The recipient is a plain column, not a profile FK: an address can be
-- delivered to someone who has no profile (a parent, a gift recipient), and
-- the label on the parcel must survive a profile rename. Phone is the
-- courier's contact string, stored as entered.
CREATE TABLE addresses (
  id             uuid         PRIMARY KEY,
  profile_id     uuid         NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  type           varchar(10)  NOT NULL DEFAULT 'shipping'
    CHECK (type IN ('shipping','billing')),
  label          varchar(50),
  recipient_name varchar(120) NOT NULL,
  phone          varchar(30),
  line1          varchar(255) NOT NULL,
  line2          varchar(255),
  city           varchar(100) NOT NULL,
  state          varchar(100),
  postal_code    varchar(20)  NOT NULL,
  country        varchar(2)   NOT NULL DEFAULT 'IN',
  is_default     boolean      NOT NULL DEFAULT false,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_profile_id ON addresses (profile_id);
-- One default per person per type — two members can each have their own.
CREATE UNIQUE INDEX one_default_shipping_per_profile
  ON addresses (profile_id) WHERE is_default AND type = 'shipping';
CREATE UNIQUE INDEX one_default_billing_per_profile
  ON addresses (profile_id) WHERE is_default AND type = 'billing';

-- ------------------------------------------- deferred FK, now satisfiable
-- orders ships in 004-orders.sql, household_members does not exist yet at that
-- point. Same pattern as 004's stock_movements.order_id: this is still a
-- from-scratch build, not a forward migration of a live schema. The pair makes
-- "order for a member of my own household" a database rule, not a promise.
-- Nullable only for guest orders: the CHECK ties it to the account columns,
-- and the composite FK (MATCH SIMPLE) is skipped when the row is a guest's.
ALTER TABLE orders
  ADD COLUMN for_household_id uuid,
  ADD CONSTRAINT orders_household_matches_buyer
    CHECK ((placed_by_user_id IS NULL) = (for_household_id IS NULL)),
  ADD CONSTRAINT orders_for_household_member_fk
    FOREIGN KEY (for_household_id, for_profile_id)
    REFERENCES household_members (household_id, profile_id) ON DELETE RESTRICT;
CREATE INDEX idx_orders_for_household_id ON orders (for_household_id);
