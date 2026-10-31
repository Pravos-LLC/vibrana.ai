-- Bot Interactions Table
-- Tracks all student interactions with JEClawdBot for analytics and learning

CREATE TABLE IF NOT EXISTS bot_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES subscribers(id) ON DELETE CASCADE,

  -- Interaction metadata
  day integer NOT NULL, -- Which day of the course (0-14)
  cohort text NOT NULL, -- Which cohort (e.g., 'jan-19-2026')
  message_type text NOT NULL, -- 'welcome', 'checkin', 'question', 'response'

  -- Content
  bot_message text, -- What the bot sent
  student_response text, -- What the student replied
  response_option integer, -- For numbered responses: 1 (Done), 2 (Stuck), 3 (Not yet)

  -- Timing
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz,

  -- Delivery status
  channel text NOT NULL, -- 'whatsapp' or 'telegram'
  message_id text, -- Provider's message ID for tracking
  delivery_status text DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bot_interactions_subscriber ON bot_interactions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_cohort_day ON bot_interactions(cohort, day);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_sent_at ON bot_interactions(sent_at);
CREATE INDEX IF NOT EXISTS idx_bot_interactions_response_option ON bot_interactions(response_option) WHERE response_option IS NOT NULL;

-- Enable RLS
ALTER TABLE bot_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access"
  ON bot_interactions
  FOR ALL
  USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_bot_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bot_interactions_updated_at
  BEFORE UPDATE ON bot_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_interactions_updated_at();

-- Useful views for analytics

-- Daily response rates
CREATE OR REPLACE VIEW daily_response_rates AS
SELECT
  cohort,
  day,
  COUNT(*) as total_checkins,
  COUNT(student_response) as responses,
  COUNT(CASE WHEN response_option = 1 THEN 1 END) as done_count,
  COUNT(CASE WHEN response_option = 2 THEN 1 END) as stuck_count,
  COUNT(CASE WHEN response_option = 3 THEN 1 END) as not_yet_count,
  ROUND(100.0 * COUNT(student_response) / NULLIF(COUNT(*), 0), 1) as response_rate
FROM bot_interactions
WHERE message_type = 'checkin'
GROUP BY cohort, day
ORDER BY cohort, day;

-- Most common stuck points
CREATE OR REPLACE VIEW stuck_points AS
SELECT
  cohort,
  day,
  COUNT(*) as stuck_count,
  array_agg(DISTINCT subscriber_id) as stuck_students
FROM bot_interactions
WHERE response_option = 2 -- Stuck
GROUP BY cohort, day
HAVING COUNT(*) > 0
ORDER BY stuck_count DESC;

COMMENT ON TABLE bot_interactions IS 'Tracks all JEClawdBot interactions with students for analytics and curriculum improvement';
COMMENT ON VIEW daily_response_rates IS 'Daily check-in response rates by cohort and day';
COMMENT ON VIEW stuck_points IS 'Identifies which days students get stuck most often';
