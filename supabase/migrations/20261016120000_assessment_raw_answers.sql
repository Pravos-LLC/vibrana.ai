-- Raw answers for org assessments (AI Readiness plan, Workstream D §5.1): the option score
-- the buyer picked for each question, keyed by question id (l1..c5). Until now only the
-- dimension scores were kept, so a report could not say which answers it was based on.
-- Nullable: rows from before this migration have no answers.

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS answers JSONB;

COMMENT ON COLUMN assessments.answers IS
  'Raw answers: question id -> option score (0, 40, 70 or 100). Null for rows before 2026-10-15.';
