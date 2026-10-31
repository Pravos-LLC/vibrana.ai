-- Retire the Build Like a Pro booking system.
--
-- The checkout / Stripe webhook / booking-emails code is deleted in the same
-- PR. Production never had these tables (its migration history records
-- 20260209 and 20260210 as applied, but the tables are absent), so this is a
-- no-op there. It makes a fresh replay of supabase/migrations match
-- production, which the nightly drift check compares against.
--
-- btree_gist was installed only for the bookings exclusion constraint and is
-- absent in production too.

DROP TABLE IF EXISTS public.booking_emails;
DROP TABLE IF EXISTS public.bookings;
DROP EXTENSION IF EXISTS btree_gist;
