-- AI Readiness assessment, instrument version 2 (hub gtm/programs/ai-readiness/plan.md §5.1).
-- The questions were rewritten with new ids, so each row records which question set its answers
-- come from, and the workflows the buyer named after the questions are kept with the row.
-- Both columns are nullable and additive: rows from before this migration keep null, which the
-- code reads as version 1 (the 38-question set) and "no workflows named".

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS instrument_version SMALLINT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS workflows JSONB;

COMMENT ON COLUMN assessments.instrument_version IS
  'Question set the answers come from: 2 from 2026-10-16 (src/assessment-questions-content.ts), 1 before (src/assessment-questions-v1-content.ts). Null on rows before 2026-10-16.';
COMMENT ON COLUMN assessments.workflows IS
  'Workflows the buyer named: {"currency": "USD", "items": [{"id": "support", "people": 4, "hoursPerWeek": 10, "hourlyCost": 45}]}. Ids from src/lib/roi/evidence.ts. Null when none were named.';
