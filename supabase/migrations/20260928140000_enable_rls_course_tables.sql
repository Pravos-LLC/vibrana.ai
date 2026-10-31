-- Enable RLS on course_types and cohorts.
--
-- 20260211_fix_security_definer_views_and_rls says "Enable RLS on course_types
-- & cohorts (already done)". That was done by hand in the dashboard and never
-- captured in a migration, so a from-scratch replay left both tables open to
-- anon/authenticated. Production already has RLS on for both. This is a no-op
-- there and makes a fresh replay match it. Service role bypasses RLS; no
-- policies are needed.

ALTER TABLE public.course_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- bookings / booking_emails (20260209, 20260210) were created without RLS.
-- They are recorded as applied in production but do not exist there, so
-- guard on existence: enable RLS wherever the tables are present.
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
  END IF;
  IF to_regclass('public.booking_emails') IS NOT NULL THEN
    ALTER TABLE public.booking_emails ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
