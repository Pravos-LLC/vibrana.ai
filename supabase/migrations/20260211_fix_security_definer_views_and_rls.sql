-- =============================================================
-- Fix Supabase security linter errors (2026-02-11)
--
-- ERRORS:
--   1. Recreate 3 views with security_invoker = on
--      (Postgres defaults views to security definer)
--   2. Enable RLS on course_types & cohorts (already done)
--
-- WARNINGS:
--   3. Drop overly permissive USING(true) RLS policies
--      (service role bypasses RLS, so no policies needed)
--   4. Set search_path on 3 functions
-- =============================================================


-- -------------------------------------------------------------
-- 1. Recreate views with security_invoker = on
--    (plain CREATE VIEW defaults to security definer in PG15+)
-- -------------------------------------------------------------

-- 1a. course_statistics
DROP VIEW IF EXISTS public.course_statistics;
CREATE VIEW public.course_statistics
  WITH (security_invoker = on) AS
SELECT
  ct.id AS course_type_id,
  ct.name AS course_name,
  ct.duration_days,
  c.id AS cohort_id,
  c.name AS cohort_name,
  c.start_date AS cohort_start,
  COUNT(DISTINCT s.id) AS total_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscribers,
  COUNT(DISTINCT CASE WHEN s.completed_at IS NOT NULL THEN s.id END) AS completed_subscribers,
  COUNT(DISTINCT CASE WHEN s.status = 'unsubscribed' THEN s.id END) AS unsubscribed,
  ROUND(AVG(s.current_day), 2) AS avg_current_day,
  ROUND(
    COUNT(DISTINCT CASE WHEN s.completed_at IS NOT NULL THEN s.id END)::NUMERIC
    / NULLIF(COUNT(DISTINCT s.id), 0) * 100,
    2
  ) AS completion_rate
FROM course_types ct
LEFT JOIN cohorts c ON c.course_type = ct.id
LEFT JOIN subscribers s ON s.course_type = ct.id
GROUP BY ct.id, ct.name, ct.duration_days, c.id, c.name, c.start_date
ORDER BY c.start_date DESC;

-- 1b. daily_response_rates
DROP VIEW IF EXISTS public.daily_response_rates;
CREATE VIEW public.daily_response_rates
  WITH (security_invoker = on) AS
SELECT
  cohort,
  day,
  COUNT(*) as total_checkins,
  COUNT(student_response) as responses,
  COUNT(CASE WHEN response_option = 1 THEN 1 END) as done_count,
  COUNT(CASE WHEN response_option = 2 THEN 1 END) as stuck_count,
  COUNT(CASE WHEN response_option = 3 THEN 1 END) as not_yet_count,
  ROUND(100.0 * COUNT(student_response) / NULLIF(COUNT(*), 0), 1) as response_rate
FROM bot_interactions
WHERE message_type = 'checkin'
GROUP BY cohort, day
ORDER BY cohort, day;

-- 1c. stuck_points
DROP VIEW IF EXISTS public.stuck_points;
CREATE VIEW public.stuck_points
  WITH (security_invoker = on) AS
SELECT
  cohort,
  day,
  COUNT(*) as stuck_count,
  array_agg(DISTINCT subscriber_id) as stuck_students
FROM bot_interactions
WHERE response_option = 2
GROUP BY cohort, day
HAVING COUNT(*) > 0
ORDER BY stuck_count DESC;


-- -------------------------------------------------------------
-- 2. Drop overly permissive RLS policies
--    Service role bypasses RLS entirely, so no policies needed.
--    With RLS on + no policies, anon/authenticated get zero access.
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Allow service role full access on course_types" ON public.course_types;
DROP POLICY IF EXISTS "Allow service role full access on cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "Service role has full access" ON public.bot_interactions;


-- -------------------------------------------------------------
-- 3. Set search_path on functions to prevent search-path attacks
-- -------------------------------------------------------------

-- 3a. get_course_duration
CREATE OR REPLACE FUNCTION public.get_course_duration(course_type_id TEXT)
RETURNS INTEGER AS $$
  SELECT duration_days FROM public.course_types WHERE id = course_type_id;
$$ LANGUAGE SQL STABLE
SET search_path = '';

-- 3b. is_course_completed
CREATE OR REPLACE FUNCTION public.is_course_completed(subscriber_row public.subscribers)
RETURNS BOOLEAN AS $$
  SELECT subscriber_row.current_day >= public.get_course_duration(subscriber_row.course_type);
$$ LANGUAGE SQL STABLE
SET search_path = '';

-- 3c. update_bot_interactions_updated_at
CREATE OR REPLACE FUNCTION public.update_bot_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';
