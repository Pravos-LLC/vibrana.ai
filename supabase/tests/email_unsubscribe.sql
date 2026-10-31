-- Behaviour tests for 20261016170000_email_unsubscribe.sql.
-- psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/email_unsubscribe.sql   (also `supabase test db`)
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'email_opt_outs', 'opt-outs are stored');
select has_table('public', 'scheduled_emails', 'scheduled sends are stored');
select col_is_pk('public', 'scheduled_emails', 'resend_id', 'one row per Resend email id');

set local role service_role;
select lives_ok($$insert into public.email_opt_outs (email, source) values ('optout@example.test', 'one-click')$$,
  'the service role records an opt-out');
select throws_ok($$insert into public.email_opt_outs (email, source) values ('other@example.test', 'guess')$$,
  '23514', null, 'an unknown opt-out source is rejected');
select lives_ok($$insert into public.scheduled_emails (resend_id, email, sequence, step, scheduled_for)
  values ('re_1', 'lead@example.test', 'assessment-nurture', 'day2', now() + interval '2 days')$$,
  'the service role records a scheduled send');
select is((select status from public.scheduled_emails where resend_id = 're_1'), 'scheduled',
  'a new send starts as scheduled');
select throws_ok($$update public.scheduled_emails set status = 'gone' where resend_id = 're_1'$$,
  '23514', null, 'an unknown status is rejected');

select * from finish();
rollback;
