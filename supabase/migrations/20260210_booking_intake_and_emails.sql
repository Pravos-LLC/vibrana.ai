-- Add intake fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS os TEXT CHECK (os IN ('mac', 'windows', 'linux')),
  ADD COLUMN IF NOT EXISTS vibe_coding_level TEXT CHECK (vibe_coding_level IN ('none', 'beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS cli_level TEXT CHECK (cli_level IN ('none', 'beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS project_goals TEXT,
  ADD COLUMN IF NOT EXISTS readiness_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_weekend BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekend_surcharge_cents INTEGER DEFAULT 0;

-- Booking email sequence tracking
CREATE TABLE IF NOT EXISTS booking_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'confirmation',
    'vps_setup_guide',
    'reminder_48h',
    'reminder_24h',
    'post_session_followup'
  )),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'failed', 'skipped')),

  -- Prevent sending same email type twice per booking
  UNIQUE(booking_id, email_type)
);

CREATE INDEX idx_booking_emails_booking ON booking_emails(booking_id);
CREATE INDEX idx_booking_emails_type ON booking_emails(email_type, status);

-- Service-role only (it bypasses RLS). Added 2026-09-28.
ALTER TABLE booking_emails ENABLE ROW LEVEL SECURITY;
