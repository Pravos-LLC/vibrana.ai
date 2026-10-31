-- AI Transformation Readiness Assessment tables
-- Ports the schema from john-ellison.com.
-- Renames `leads` -> `assessment_leads` to avoid colliding with future generic lead tables.

CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_name TEXT NOT NULL,
  website TEXT,
  linkedin TEXT,
  email TEXT NOT NULL,
  dimension_scores JSONB DEFAULT '{}'::jsonb,
  overall_score INTEGER,
  readiness_level TEXT,
  blockers JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  company_insights JSONB,
  archetype JSONB,
  axis_scores JSONB,
  industry_analysis TEXT
);

CREATE TABLE IF NOT EXISTS assessment_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,
  website TEXT,
  linkedin TEXT,
  company_insights JSONB,
  converted_to_assessment BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS whitepaper_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  whitepaper_sent BOOLEAN NOT NULL DEFAULT FALSE,
  nurture_sequence_started BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_leads_email ON assessment_leads(email);
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_email ON whitepaper_leads(email);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitepaper_leads ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; no public policies needed because all
-- writes/reads go through the service-role client in lib/supabase.ts.
