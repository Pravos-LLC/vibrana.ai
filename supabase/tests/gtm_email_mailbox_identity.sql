-- Behaviour tests for 20261106020000_gtm_email_mailbox_identity.sql (VIB-508 follow-up).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

set local role service_role;
insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox) values ('TIDA', 'aa1', 'aa1', 'outreach', now(), 'one@example.com');
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox) values ('TIDA', 'aa1', 'aa1', 'outreach', now(), 'two@example.com')$$,
  'the same Gmail id in another mailbox of the same member is its own row');
select throws_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox) values ('TIDB', 'aa1', 'aa1', 'outreach', now(), 'one@example.com')$$,
  '23505', null, 'a Gmail id is counted once per mailbox');
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at) values ('TIDA', 'aa2', 'aa2', 'outreach', now())$$, 'a row without a mailbox still inserts');
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at) values ('TIDA', 'aa2', 'aa2', 'outreach', now())$$, 'rows without a mailbox never collide');
select ok(exists (select 1 from pg_constraint where conname = 'gtm_team_mail_events_mailbox_once' and contype = 'u'), 'the per-mailbox key is a constraint an upsert can target');

insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, stream)
  select id, repeat('q', 32), 'to', 'unmatched', 'unknown' from public.gtm_team_mail_events where mailbox = 'one@example.com';
insert into public.gtm_email_reply_labels (event_id, source, intent) select id, 'legacy', 'neutral' from public.gtm_team_mail_events where mailbox = 'one@example.com';
select throws_ok($$delete from public.gtm_email_reply_labels where intent = 'neutral' and source = 'legacy' and event_id in (select id from public.gtm_team_mail_events where mailbox = 'one@example.com')$$,
  '42501', null, 'a decision still cannot be deleted on its own');
select lives_ok($$delete from public.gtm_team_mail_events where mailbox = 'one@example.com'$$, 'disconnecting deletes the events');
select is((select count(*) from public.gtm_email_attempts where recipient_hash = repeat('q', 32)), 0::bigint, 'their attempts go with them');
select is((select count(*) from public.gtm_email_reply_labels l where not exists (select 1 from public.gtm_team_mail_events e where e.id = l.event_id) and l.event_id is not null), 0::bigint, 'and their decisions');

select * from finish();
rollback;
