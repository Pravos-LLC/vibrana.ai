-- Create subscribers table for the 14-Day Vibe Coding Challenge
CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cohort TEXT DEFAULT 'jan-6-2025',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  current_day INTEGER DEFAULT 0,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create email log table for tracking sent emails
CREATE TABLE email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  email_day INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resend_id TEXT,
  status TEXT DEFAULT 'sent'
);

-- Indexes for efficient queries
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_cohort ON subscribers(cohort);
CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token);
CREATE INDEX idx_email_log_subscriber_id ON email_log(subscriber_id);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access on subscribers" ON subscribers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on email_log" ON email_log
  FOR ALL USING (auth.role() = 'service_role');
