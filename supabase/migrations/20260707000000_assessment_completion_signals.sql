-- Completion time + response-quality signals for org and individual assessments.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS quality_signals JSONB DEFAULT '{}'::jsonb;

ALTER TABLE individual_assessments
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS quality_signals JSONB DEFAULT '{}'::jsonb;

UPDATE assessments SET completed_at = created_at WHERE completed_at IS NULL;
UPDATE individual_assessments SET completed_at = created_at WHERE completed_at IS NULL;
