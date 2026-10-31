-- Add ICP-qualifying fields captured during the assessment intro step.
-- Mirrors columns on engagement_inquiries so the contact form and the
-- assessment can populate the same downstream company segmentation.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS team_size TEXT,
  ADD COLUMN IF NOT EXISTS revenue_band TEXT;

ALTER TABLE assessment_leads
  ADD COLUMN IF NOT EXISTS team_size TEXT,
  ADD COLUMN IF NOT EXISTS revenue_band TEXT;

CREATE INDEX IF NOT EXISTS idx_assessments_team_size ON assessments(team_size);
CREATE INDEX IF NOT EXISTS idx_assessments_revenue_band ON assessments(revenue_band);
