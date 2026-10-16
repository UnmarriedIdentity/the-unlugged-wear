-- 001-auth.sql — Auth & RBAC (10 tables)
-- Source of truth: DOC/backend/03-Auth-RBAC.md (transcribed 1:1).
-- Conventions: UUIDv7 PKs (app-generated), timestamptz pairs, varchar+CHECK.
-- Order matters: parents before children (roles/permissions before joins).

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
CREATE TABLE users (
  id            uuid         PRIMARY KEY,
  email         varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  first_name    varchar(100) NOT NULL,
  last_name     varchar(100) NOT NULL,
  phone         varchar(20),
  status        varchar(20)  NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','disabled')),
  last_login_at timestamptz,
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

-- ------------------------------------------------------------- addresses
CREATE TABLE addresses (
  id          uuid         PRIMARY KEY,
  user_id     uuid         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        varchar(10)  NOT NULL DEFAULT 'shipping'
    CHECK (type IN ('shipping','billing')),
  label       varchar(50),
  line1       varchar(255) NOT NULL,
  line2       varchar(255),
  city        varchar(100) NOT NULL,
  state       varchar(100),
  postal_code varchar(20)  NOT NULL,
  country     varchar(2)   NOT NULL DEFAULT 'IN',
  is_default  boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user_id ON addresses (user_id);
CREATE UNIQUE INDEX one_default_per_user ON addresses (user_id)
  WHERE is_default;

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

-- -------------------------------------------------------- customer_notes
CREATE TABLE customer_notes (
  id         uuid        PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  note       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_notes_user_id ON customer_notes (user_id);

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
