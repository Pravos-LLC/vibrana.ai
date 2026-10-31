-- Behaviour tests for 20261016200000_funnel_measurement.sql.
-- psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/funnel_measurement.sql   (also `supabase test db`)
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public', 'funnel_events', 'funnel events are stored');
select has_column('public', 'assessments', 'entry_point', 'an assessment records its front door');

set local role service_role;
select lives_ok($$insert into public.funnel_events (event, entry_point, location) values ('call_click', 'landing', 'readiness-hero')$$,
  'the service role records a call click');
select lives_ok($$insert into public.funnel_events (event, entry_point) values ('roi_lead', 'roi')$$,
  'the service role records an ROI lead without a location');
select throws_ok($$insert into public.funnel_events (event, entry_point) values ('page_view', 'landing')$$,
  '23514', null, 'an unknown event is rejected');
select throws_ok($$insert into public.funnel_events (event, entry_point) values ('call_click', 'twitter')$$,
  '23514', null, 'an unknown front door is rejected');
select throws_ok($$insert into public.funnel_events (event, entry_point, location) values ('call_click', 'direct', 'Has Spaces')$$,
  '23514', null, 'a free-text location is rejected');
select lives_ok($$insert into public.assessments (company_name, email, entry_point) values ('Entry Co', 'entry@example.test', 'sprint')$$,
  'an assessment stores a known front door');
select throws_ok($$insert into public.assessments (company_name, email, entry_point) values ('Entry Co', 'entry2@example.test', 'nowhere')$$,
  '23514', null, 'an assessment rejects an unknown front door');

select * from finish();
rollback;
