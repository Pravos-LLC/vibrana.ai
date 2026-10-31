ALTER TABLE engagement_inquiries
  ADD COLUMN IF NOT EXISTS intent TEXT NOT NULL DEFAULT 'ai_native_transformation',
  ADD COLUMN IF NOT EXISTS track TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS proposal_value_usd INTEGER CHECK (proposal_value_usd IS NULL OR proposal_value_usd >= 0),
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

ALTER TABLE engagement_inquiries
  DROP CONSTRAINT IF EXISTS engagement_inquiries_status_check;

ALTER TABLE engagement_inquiries
  ADD CONSTRAINT engagement_inquiries_status_check
  CHECK (status IN ('new', 'booked', 'qualified', 'proposal', 'won', 'lost', 'nurture', 'archived'));

ALTER TABLE engagement_inquiries
  DROP CONSTRAINT IF EXISTS engagement_inquiries_track_check;

ALTER TABLE engagement_inquiries
  ADD CONSTRAINT engagement_inquiries_track_check
  CHECK (track IS NULL OR track IN ('product', 'workflow'));

CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_intent_status
  ON engagement_inquiries(intent, status);

CREATE INDEX IF NOT EXISTS idx_engagement_inquiries_updated_at
  ON engagement_inquiries(updated_at DESC);
