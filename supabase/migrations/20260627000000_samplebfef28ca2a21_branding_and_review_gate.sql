-- Samplebfef28ca2a21 × Vibrana: partner-branded assessments + human-review gate.
--
-- Adds:
--   1. `brand` + review `status` columns to the existing org `assessments` table,
--      so partner-branded submissions (e.g. the Samplebfef28ca2a21/Seven flow) can be tagged
--      and held for human review instead of auto-delivering a report.
--   2. A parallel `individual_assessments` table for the ported Executive/Individual
--      assessment, with the same brand + review-gate columns.
--
-- The default org flow is unaffected: existing rows get brand = NULL and
-- status = 'delivered' (back-compat — they were auto-sent under the old flow).

-- 1. Org assessments: brand + review gate -----------------------------------
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS brand TEXT,                         -- e.g. 'samplebfef28ca2a21'; NULL = default Vibrana flow
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'delivered', -- 'pending_review' | 'reviewed' | 'delivered'
  ADD COLUMN IF NOT EXISTS reviewer_context TEXT,             -- org context the reviewer adds before sending
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Existing rows predate the gate and were already auto-delivered.
UPDATE assessments SET status = 'delivered' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_assessments_brand ON assessments(brand);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);

-- 2. Individual / Executive assessments -------------------------------------
CREATE TABLE IF NOT EXISTS individual_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  email TEXT NOT NULL,
  title TEXT,
  company TEXT,
  brand TEXT,                                                 -- e.g. 'samplebfef28ca2a21'; NULL = default Vibrana flow
  answers JSONB DEFAULT '{}'::jsonb,
  archetype JSONB,
  axis_scores JSONB,
  overall_score INTEGER,
  time_savings JSONB,
  recommendations JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_review',              -- 'pending_review' | 'reviewed' | 'delivered'
  reviewer_context TEXT,                                      -- context the reviewer adds before sending
  industry_context TEXT,                                      -- reserved for async/AI context, parity with org `industry_analysis`
  reviewed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_individual_assessments_email ON individual_assessments(email);
CREATE INDEX IF NOT EXISTS idx_individual_assessments_created_at ON individual_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_individual_assessments_brand ON individual_assessments(brand);
CREATE INDEX IF NOT EXISTS idx_individual_assessments_status ON individual_assessments(status);

ALTER TABLE individual_assessments ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS; all writes/reads go through the service-role client.
