-- One-time WhatsApp OTP used by the "forgot password" self-serve reset flow.
-- Only accounts that have a registered phone (i.e. members) can complete it.
-- The OTP itself is never stored in clear text — only its BCrypt hash.
CREATE TABLE password_reset_otp (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  consumed    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NULL,
  CONSTRAINT fk_pro_user FOREIGN KEY (user_id) REFERENCES "user"(id)
);
CREATE INDEX idx_pro_user_active ON password_reset_otp (user_id, consumed, expires_at);