-- EU AI Act Readiness assessment (/eu-ai-act-readiness; docs/eu-ai-act-assessment-methodology.md).
--
-- One assessments table for both instruments:
--   assessment_type      'ai-readiness' (every row before this migration) or 'eu-ai-act'
--   compliance_profile   the EU AI Act profile (src/lib/eu-ai-act/engine.ts EUProfile): scope,
--                        role, risk tier, size band, high-risk areas, obligations with status
--                        and dates. Null for AI Readiness rows.
-- EU rows reuse answers, instrument_version (the EU instrument's own numbering), overall_score
-- (readiness), dimension_scores (per section) and entry_point.
--
-- Two new front doors (src/lib/funnel/entry.ts): 'eu-ai-act' (the landing page) and 'video'
-- (links from social video, ?entry=video).

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS assessment_type TEXT NOT NULL DEFAULT 'ai-readiness'
    CONSTRAINT assessments_assessment_type_check CHECK (assessment_type IN ('ai-readiness', 'eu-ai-act')),
  ADD COLUMN IF NOT EXISTS compliance_profile JSONB;

COMMENT ON COLUMN public.assessments.assessment_type IS
  'Which assessment: ai-readiness (/ai-readiness) or eu-ai-act (/eu-ai-act-readiness, from 2026-10-17).';
COMMENT ON COLUMN public.assessments.compliance_profile IS
  'EU AI Act profile (EUProfile in src/lib/eu-ai-act/engine.ts). Null for AI Readiness rows.';

CREATE INDEX IF NOT EXISTS assessments_assessment_type_idx ON public.assessments (assessment_type, created_at DESC);

ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_entry_point_check;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_entry_point_check
  CHECK (entry_point IS NULL OR entry_point IN ('landing', 'direct', 'roi', 'sprint', 'email', 'simulator', 'eu-ai-act', 'video'));

ALTER TABLE public.funnel_events DROP CONSTRAINT IF EXISTS funnel_events_entry_point_check;
ALTER TABLE public.funnel_events ADD CONSTRAINT funnel_events_entry_point_check
  CHECK (entry_point IN ('landing', 'direct', 'roi', 'sprint', 'email', 'simulator', 'eu-ai-act', 'video'));
