-- Add email tracking columns to email_log table
-- Tracks delivery, opens, clicks, bounces, and complaints from Resend webhooks

ALTER TABLE email_log
  ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN events JSONB DEFAULT '[]'::jsonb;

-- Add column to track updated time
ALTER TABLE email_log
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Rename sent_at to created_at if it exists (migration-safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_log' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE email_log DROP COLUMN created_at;
    ALTER TABLE email_log RENAME COLUMN sent_at TO created_at;
  END IF;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_log_resend_id ON email_log(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_log_delivered ON email_log(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_log_opened ON email_log(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_log_clicked ON email_log(clicked_at) WHERE clicked_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN email_log.delivered_at IS 'Timestamp when email was delivered to recipient inbox (from Resend webhook)';
COMMENT ON COLUMN email_log.opened_at IS 'Timestamp when recipient first opened the email (from Resend webhook)';
COMMENT ON COLUMN email_log.clicked_at IS 'Timestamp when recipient first clicked a link (from Resend webhook)';
COMMENT ON COLUMN email_log.bounced_at IS 'Timestamp when email bounced (from Resend webhook)';
COMMENT ON COLUMN email_log.complained_at IS 'Timestamp when recipient marked as spam (from Resend webhook)';
COMMENT ON COLUMN email_log.events IS 'Array of all webhook events received from Resend';
