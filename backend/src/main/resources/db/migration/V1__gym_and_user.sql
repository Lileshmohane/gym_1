-- Database Schema Design Document, Sections 3.1-3.2.
-- created_at/updated_at are on every table (BaseEntity), a superset of the doc.
CREATE TABLE gym (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  email       VARCHAR(150) NOT NULL,
  address     VARCHAR(255) NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'TRIAL',
  plan_tier   VARCHAR(20)  NOT NULL DEFAULT 'BASIC',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL,
  CONSTRAINT uq_gym_email UNIQUE (email),
  CONSTRAINT chk_gym_status CHECK (status IN ('ACTIVE','SUSPENDED','TRIAL')),
  CONSTRAINT chk_gym_tier CHECK (plan_tier IN ('BASIC','STANDARD','PREMIUM'))
) ;

CREATE TABLE "user" (
  id             BIGSERIAL PRIMARY KEY,
  gym_id         BIGINT NULL,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(20)  NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NULL,
  CONSTRAINT fk_user_gym FOREIGN KEY (gym_id) REFERENCES gym(id),
  CONSTRAINT uq_user_gym_email UNIQUE (gym_id, email),
  CONSTRAINT chk_user_role CHECK (role IN ('PLATFORM_ADMIN','GYM_OWNER','GYM_STAFF','MEMBER')),
  CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ;

CREATE INDEX idx_user_gym_role ON "user" (gym_id, role);
CREATE INDEX idx_user_email ON "user" (email);
