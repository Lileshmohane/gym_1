CREATE TABLE membership_plan (
  id            BIGSERIAL PRIMARY KEY,
  gym_id        BIGINT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  duration_days INT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NULL,
  CONSTRAINT fk_plan_gym FOREIGN KEY (gym_id) REFERENCES gym(id),
  CONSTRAINT chk_plan_status CHECK (status IN ('ACTIVE','ARCHIVED'))
);
CREATE INDEX idx_plan_gym ON membership_plan (gym_id);

CREATE TABLE subscription (
  id          BIGSERIAL PRIMARY KEY,
  gym_id      BIGINT NOT NULL,
  member_id   BIGINT NOT NULL,
  plan_id     BIGINT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL,
  CONSTRAINT fk_sub_gym    FOREIGN KEY (gym_id)    REFERENCES gym(id),
  CONSTRAINT fk_sub_member FOREIGN KEY (member_id) REFERENCES "user"(id),
  CONSTRAINT fk_sub_plan   FOREIGN KEY (plan_id)   REFERENCES membership_plan(id),
  CONSTRAINT chk_sub_status CHECK (status IN ('ACTIVE','EXPIRING','EXPIRED','CANCELLED'))
);
CREATE INDEX idx_sub_gym_end_status ON subscription (gym_id, end_date, status);
CREATE INDEX idx_sub_member ON subscription (member_id);
