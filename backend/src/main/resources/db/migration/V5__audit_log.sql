-- Table only: no JPA entity yet. Owner/admin action logging is listed in the
-- Technical Architecture Document (Section 8) as "as the product matures".
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  gym_id        BIGINT NOT NULL,
  actor_user_id BIGINT NOT NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50)  NOT NULL,
  entity_id     BIGINT NOT NULL,
  metadata      JSON NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_gym   FOREIGN KEY (gym_id)        REFERENCES gym(id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES "user"(id)
) ;
CREATE INDEX idx_audit_gym ON audit_log (gym_id);
