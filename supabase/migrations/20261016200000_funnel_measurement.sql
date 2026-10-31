-- Funnel measurement for the AI Readiness and Build Sprint front doors
-- (hub gtm/programs/ai-readiness/plan.md §8, Workstream G; docs/funnel-measurement.md).
--
-- The cockpit counts each front door from the database, not from Vercel Analytics:
--
--   assessments.entry_point   which front door a completed assessment came through
--                             (src/lib/funnel/entry.ts). Null on rows from before this
--                             migration, and on a submission from a page loaded before it.
--   funnel_events             server-side counts that no other table holds:
--                               call_click  a "Book a call" link was clicked (the booking
--                                           itself happens on Google Calendar, which we can't see)
--                               roi_lead    the ROI calculator emailed an estimate. assessment_leads
--                                           keeps the first source per address, so a repeat or an
--                                           earlier assessment lead would hide it there.
--                             No person, address, IP or session id: an event, a front door,
--                             where on the site, and when.
--
-- Service role only, like the other lead tables: RLS on, no public policies.

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS entry_point TEXT
    CONSTRAINT assessments_entry_point_check
    CHECK (entry_point IS NULL OR entry_point IN ('landing', 'direct', 'roi', 'sprint', 'email', 'simulator'));

COMMENT ON COLUMN public.assessments.entry_point IS
  'Front door: landing (/ai-readiness), direct, roi (/ai-build-sprint/roi), sprint (/ai-build-sprint), email (?entry=email or utm_medium=email), simulator. Null before 2026-10-16.';

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  event TEXT NOT NULL CHECK (event IN ('call_click', 'roi_lead')),
  entry_point TEXT NOT NULL CHECK (entry_point IN ('landing', 'direct', 'roi', 'sprint', 'email', 'simulator')),
  location TEXT CHECK (location IS NULL OR location ~ '^[a-z0-9-]{1,40}$')
);

COMMENT ON TABLE public.funnel_events IS
  'Anonymous funnel counts the site records server-side: call_click (a booking link was clicked) and roi_lead (the ROI calculator emailed an estimate). No personal data.';
COMMENT ON COLUMN public.funnel_events.location IS
  'Where on the site the event happened, e.g. readiness-hero, report, assessment-complete, sprint-thank-you (docs/funnel-measurement.md).';

CREATE INDEX IF NOT EXISTS funnel_events_created_at_idx ON public.funnel_events (created_at);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.funnel_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.funnel_events_id_seq TO service_role;

-- ROI leads saved before this migration, so the weekly count has history.
INSERT INTO public.funnel_events (created_at, event, entry_point, location)
SELECT created_at, 'roi_lead', 'roi', 'backfill'
  FROM public.assessment_leads
 WHERE source = 'roi-calculator';
