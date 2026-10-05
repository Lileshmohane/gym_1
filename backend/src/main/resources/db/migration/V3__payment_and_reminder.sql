CREATE TABLE payment (
  id              BIGSERIAL PRIMARY KEY,
  gym_id          BIGINT NOT NULL,
  member_id       BIGINT NOT NULL,
  subscription_id BIGINT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_date    DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  reference       VARCHAR(100) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NULL,
  CONSTRAINT fk_pay_gym    FOREIGN KEY (gym_id)          REFERENCES gym(id),
  CONSTRAINT fk_pay_member FOREIGN KEY (member_id)       REFERENCES "user"(id),
  CONSTRAINT fk_pay_sub    FOREIGN KEY (subscription_id) REFERENCES subscription(id),
  CONSTRAINT chk_pay_status CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED'))
) ;
CREATE INDEX idx_pay_gym_member_date ON payment (gym_id, member_id, payment_date);

CREATE TABLE reminder (
  id              BIGSERIAL PRIMARY KEY,
  gym_id          BIGINT NOT NULL,
  member_id       BIGINT NOT NULL,
  subscription_id BIGINT NOT NULL,
  reminder_type   VARCHAR(20) NOT NULL,
  scheduled_at    TIMESTAMP NOT NULL,
  sent_at         TIMESTAMP NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NULL,
  CONSTRAINT fk_rem_gym    FOREIGN KEY (gym_id)          REFERENCES gym(id),
  CONSTRAINT fk_rem_member FOREIGN KEY (member_id)       REFERENCES "user"(id),
  CONSTRAINT fk_rem_sub    FOREIGN KEY (subscription_id) REFERENCES subscription(id),
  -- prevents the duplicate-reminder bug called out in the product plan
  CONSTRAINT uq_rem_sub_type UNIQUE (subscription_id, reminder_type),
  CONSTRAINT chk_rem_type CHECK (reminder_type IN ('EXPIRY_3_DAY','EXPIRY_TODAY','EXPIRED')),
  CONSTRAINT chk_rem_status CHECK (status IN ('PENDING','SENT','FAILED'))
) ;
CREATE INDEX idx_rem_gym ON reminder (gym_id);
