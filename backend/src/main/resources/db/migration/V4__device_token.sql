CREATE TABLE device_token (
  id             BIGSERIAL PRIMARY KEY,
  gym_id         BIGINT NOT NULL,
  user_id        BIGINT NOT NULL,
  platform       VARCHAR(10) NOT NULL,
  push_token     VARCHAR(255) NOT NULL,
  last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NULL,
  CONSTRAINT fk_dev_gym  FOREIGN KEY (gym_id)  REFERENCES gym(id),
  CONSTRAINT fk_dev_user FOREIGN KEY (user_id) REFERENCES "user"(id),
  CONSTRAINT uq_dev_token UNIQUE (push_token),
  CONSTRAINT chk_dev_platform CHECK (platform IN ('IOS','ANDROID'))
) ;
CREATE INDEX idx_dev_user ON device_token (user_id);
CREATE INDEX idx_dev_gym ON device_token (gym_id);
