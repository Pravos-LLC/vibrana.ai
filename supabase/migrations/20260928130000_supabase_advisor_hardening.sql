-- =============================================================
-- Supabase advisor hardening (VIB-391, VIB-393) — 2026-09-28
--
-- 20260211_fix_security_definer_views_and_rls already fixed the view
-- and the two functions, but the 20260208 cohort-autopilot migrations
-- were applied after it (out of order) and put the old definitions
-- back. This migration applies those fixes again, and clears the
-- auth_rls_initplan warnings.
--
--   1. course_statistics: security_invoker + no Data API access  (lint 0010)
--   2. search_path pinned on get_course_duration / is_course_completed (lint 0011)
--   3. Drop the redundant "Service role full access" policies (lint 0003)
--
-- Leaked-password protection (the fourth VIB-393 item) is an Auth
-- setting, not schema. It is set in the dashboard or Management API.
-- =============================================================


-- -------------------------------------------------------------
-- 1. course_statistics runs as the caller, not as the view owner
--    ALTER keeps the live definition (from 20260208000001) as it is.
--    No app code reads this view, and the underlying tables have no
--    anon/authenticated policies, so revoke Data API access as well.
-- -------------------------------------------------------------

ALTER VIEW public.course_statistics SET (security_invoker = on);
REVOKE ALL ON public.course_statistics FROM anon, authenticated;


-- -------------------------------------------------------------
-- 2. Pin search_path (fully-qualified bodies so '' resolves)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_course_duration(course_type_id TEXT)
RETURNS INTEGER AS $$
  SELECT duration_days FROM public.course_types WHERE id = course_type_id;
$$ LANGUAGE SQL STABLE
SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_course_completed(subscriber_row public.subscribers)
RETURNS BOOLEAN AS $$
  SELECT subscriber_row.current_day >= public.get_course_duration(subscriber_row.course_type);
$$ LANGUAGE SQL STABLE
SET search_path = '';


-- -------------------------------------------------------------
-- 3. Drop "Service role full access" policies
--    service_role has BYPASSRLS, so these never granted it anything.
--    Every app path uses SUPABASE_SERVICE_KEY. With RLS on and no
--    policies, anon/authenticated still get zero rows, the same as
--    before.
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Service role full access on subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Service role full access on email_log" ON public.email_log;
DROP POLICY IF EXISTS "Service role full access on commons_applications" ON public.commons_applications;
