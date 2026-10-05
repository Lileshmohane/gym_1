ALTER TABLE "user"
  ADD COLUMN has_photo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE member_profile_photo (
  id                 BIGSERIAL PRIMARY KEY,
  member_id          BIGINT NOT NULL UNIQUE,
  gym_id             BIGINT NOT NULL,
  photo_data         BYTEA NOT NULL,
  photo_content_type VARCHAR(50) NOT NULL,
  CONSTRAINT fk_profile_photo_member FOREIGN KEY (member_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_profile_photo_gym FOREIGN KEY (gym_id) REFERENCES gym(id)
);