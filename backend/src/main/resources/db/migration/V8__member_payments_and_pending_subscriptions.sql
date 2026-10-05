ALTER TABLE subscription DROP CONSTRAINT chk_sub_status;
ALTER TABLE subscription ADD CONSTRAINT chk_sub_status
  CHECK (status IN ('PENDING_PAYMENT','ACTIVE','EXPIRING','EXPIRED','CANCELLED'));

ALTER TABLE payment
  ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'CASH';
ALTER TABLE payment ADD CONSTRAINT chk_payment_method
  CHECK (payment_method IN ('CASH','ONLINE'));