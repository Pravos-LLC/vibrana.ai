-- Add unique constraint to prevent duplicate email sends
-- This provides database-level protection alongside the application-level check
CREATE UNIQUE INDEX idx_email_log_idempotency 
  ON email_log(subscriber_id, email_day) 
  WHERE status = 'sent';

-- Add index for the idempotency check query
CREATE INDEX idx_email_log_sent_lookup 
  ON email_log(subscriber_id, email_day, status);
