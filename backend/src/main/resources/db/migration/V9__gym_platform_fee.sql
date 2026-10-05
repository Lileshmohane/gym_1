-- Fixed ₹2,500/month platform fee the super admin charges each gym owner.
CREATE TABLE gym_platform_fee (
  id           BIGSERIAL PRIMARY KEY,
  gym_id       BIGINT NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NULL,
  CONSTRAINT fk_gpf_gym FOREIGN KEY (gym_id) REFERENCES gym(id),
  CONSTRAINT uq_gpf_gym UNIQUE (gym_id),
  CONSTRAINT chk_gpf_status CHECK (status IN ('ACTIVE','EXPIRING','EXPIRED','SUSPENDED'))
);
CREATE INDEX idx_gpf_period_status ON gym_platform_fee (period_end, status);
