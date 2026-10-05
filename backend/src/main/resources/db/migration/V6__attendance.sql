CREATE TABLE attendance (
  id                  BIGSERIAL PRIMARY KEY,
  gym_id              BIGINT NOT NULL,
  member_id           BIGINT NOT NULL,
  check_in_at         TIMESTAMP NOT NULL,
  check_out_at        TIMESTAMP NULL,
  source              VARCHAR(20) NOT NULL,
  recorded_by_user_id BIGINT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NULL,
  CONSTRAINT fk_att_gym      FOREIGN KEY (gym_id)              REFERENCES gym(id),
  CONSTRAINT fk_att_member   FOREIGN KEY (member_id)           REFERENCES "user"(id),
  CONSTRAINT fk_att_recorder FOREIGN KEY (recorded_by_user_id) REFERENCES "user"(id),
  CONSTRAINT chk_att_source CHECK (source IN ('QR_SELF','STAFF_MANUAL','APP_BUTTON')),
  CONSTRAINT chk_att_status CHECK (status IN ('OPEN','CLOSED','AUTO_CLOSED'))
) ;
CREATE INDEX idx_att_gym_member_in ON attendance (gym_id, member_id, check_in_at);
