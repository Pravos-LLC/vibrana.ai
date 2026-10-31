-- Phase 2 (Samplebfef28ca2a21): store the non-scored qualitative "context" answers (Abdul's
-- net-new questions: support-interest, process-to-automate, 6-month priority).
-- Separate from the scored `dimension_scores` so it never affects the rubric.
-- Surfaced in the admin review queue for the human-reviewed report.

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS context_answers JSONB;
