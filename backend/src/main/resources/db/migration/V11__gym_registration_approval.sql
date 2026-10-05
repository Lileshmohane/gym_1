-- Registration approval workflow. A gym self-registered from the mobile app
-- now lands as PENDING and its owner cannot log in until the super admin
-- approves it; a rejected gym keeps its owner account INACTIVE. Gyms created
-- directly by the super admin are APPROVED on creation. Existing rows predate
-- the gate and are all backfilled to APPROVED so nothing regresses.
ALTER TABLE gym
  ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN approval_note   VARCHAR(255) NULL,
  ADD COLUMN approved_at     TIMESTAMP NULL;

ALTER TABLE gym
  ADD CONSTRAINT chk_gym_approval CHECK (approval_status IN ('PENDING','APPROVED','REJECTED'));

UPDATE gym SET approval_status = 'APPROVED', approved_at = CURRENT_TIMESTAMP;

CREATE INDEX idx_gym_approval ON gym (approval_status);
