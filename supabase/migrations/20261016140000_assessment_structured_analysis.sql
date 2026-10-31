-- The staged report pipeline (AI Readiness plan, Workstream D §5.3) writes the analysis as data:
-- a summary, the strongest and weakest areas each with its basis (answers or a finding), and one
-- starting point. `analysis` holds that JSON; web, email and PDF all render it from here.
-- `analysis_meta` records how it was produced (models, attempts, judge scores, or why nothing was
-- stored), for the admin list. `industry_analysis` stays for rows written before this.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS analysis JSONB,
  ADD COLUMN IF NOT EXISTS analysis_meta JSONB;

COMMENT ON COLUMN assessments.analysis IS
  'Structured written analysis (version 1): summary, strongest, weakest, startingPoint. Null when none passed the checks and the judge.';
COMMENT ON COLUMN assessments.analysis_meta IS
  'How the analysis was produced: status (stored or failed), reason, models, attempts, judge verdict, cost.';
