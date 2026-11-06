-- Behaviour tests for 20261106010000_gtm_email_outcomes.sql (VIB-508).
-- psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/gtm_email_outcomes.sql   (also `supabase test db`)
begin;
create extension if not exists pgtap with schema extensions;
select plan(48);

create or replace function pg_temp.as_role(r text, owner boolean) returns void language plpgsql as $$
begin
  execute format('set local role %I', r);
  perform set_config('request.jwt.claims', case when owner is null then '' else json_build_object(
    'sub', '00000000-0000-0000-0000-00000000000' || case when owner then '1' else '2' end,
    'role', r, 'app_metadata', json_build_object('gtm_owner', owner))::text end, true);
end $$;

select pg_temp.as_role('service_role', null);

-- Granted scopes
insert into public.gtm_team_mailboxes (member, address, token_ciphertext) values ('TOUT', 'tout@example.com', repeat('x', 60));
select is((select granted_scopes from public.gtm_team_mailboxes where member = 'TOUT'), '{}'::text[],
  'a new connection records no scope until the callback reads Google''s grant');
select lives_ok($$update public.gtm_team_mailboxes set granted_scopes = array['https://www.googleapis.com/auth/gmail.readonly'],
  scopes_checked_at = now() where member = 'TOUT'$$, 'the callback stores the granted scope');

-- Message identity: legacy rows keep working, new rows are unique per mailbox
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at)
  values ('TOUT', 'a01', 'a01', 'outreach', now())$$, 'a legacy-shaped event still inserts');
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox, message_key, calc_version)
  values ('TOUT', 'a02', 'a02', 'outreach', now(), 'tout@example.com', repeat('k', 32), 2)$$, 'a new event records its mailbox and message key');
select throws_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox)
  values ('TOUX', 'a02', 'a02', 'outreach', now(), 'tout@example.com')$$, '23505',
  'duplicate key value violates unique constraint "gtm_team_mail_events_mailbox_once"', 'a Gmail id is counted once per mailbox, whoever it is attributed to');
select throws_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox)
  values ('TOUT', 'a03', 'a03', 'outreach', now(), 'Tout@Example.com')$$, '23514', null, 'a mailbox address is stored lower-case');
select throws_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, source)
  values ('TOUT', 'a04', 'a04', 'outreach', now(), 'forwarded')$$, '23514', null, 'only the two observation sources are allowed');
select lives_ok($$insert into public.gtm_team_mail_events (member, gmail_message_id, thread_id, kind, at, mailbox, source)
  values ('TOUT', 'a05', 'a02', 'bounce', now(), 'tout@example.com', 'team_mailbox')$$, 'a failure report is an event');

-- Attempts
select lives_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, person_id, stream, verification, verification_basis)
  select id, repeat('h', 32), 'to', 'matched', '00000000-0000-0000-0000-0000000000a1', 'cold', 'unverified', 'at_send'
  from public.gtm_team_mail_events where gmail_message_id = 'a02'$$, 'an unverified matched recipient is a counted cold attempt');
select lives_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, stream)
  select id, repeat('j', 32), 'cc', 'ambiguous', 'unknown' from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  'an ambiguous recipient is kept, unattributed');
select throws_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, stream)
  select id, repeat('h', 32), 'to', 'unmatched', 'unknown' from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  '23505', null, 'one attempt per message and recipient');
select throws_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, stream)
  select id, repeat('m', 32), 'to', 'ambiguous', 'cold' from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  '23514', null, 'a cold attempt needs exactly one matched person');
select throws_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, person_id, stream)
  select id, repeat('n', 32), 'to', 'unmatched', '00000000-0000-0000-0000-0000000000a1', 'unknown' from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  '23514', null, 'an unmatched recipient carries no person');
select throws_ok($$insert into public.gtm_email_attempts (event_id, recipient_hash, field, match, stream)
  select id, 'someone@example.com', 'to', 'unmatched', 'unknown' from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  '23514', null, 'a raw address is refused as a recipient hash');
select throws_ok($$update public.gtm_email_attempts set delivery = 'failed_invalid_address' where recipient_hash = repeat('h', 32)$$,
  '23514', null, 'a delivery outcome needs its date');
select lives_ok($$update public.gtm_email_attempts set delivery = 'failed_invalid_address', delivery_at = now(),
  delivery_event_id = (select id from public.gtm_team_mail_events where gmail_message_id = 'a05') where recipient_hash = repeat('h', 32)$$,
  'a terminal failure is recorded on the one attempt it names');
select is((select delivery from public.gtm_email_attempts where recipient_hash = repeat('j', 32)), 'no_failure_observed',
  'the other recipient on the same message keeps its own outcome');
select throws_ok($$update public.gtm_email_attempts set verification = 'deliverable' where recipient_hash = repeat('h', 32)$$,
  '23514', null, 'verification has four states, none of them inferred from silence');
select throws_ok($$delete from public.gtm_team_mail_events where gmail_message_id = 'a02'$$,
  '23503', null, 'an event with attempts cannot be deleted');

-- Reply decisions
insert into public.gtm_outreach_drafts (id, batch, domain, subject, body)
  values ('00000000-0000-0000-0000-0000000000f9', 'outcomes-test', 'seed.example', 'Subject', 'Body');
select lives_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent, opt_out, labeled_by)
  values ('00000000-0000-0000-0000-0000000000f9', 'human', 'interested', 'none', 'owner@example.com')$$, 'a human label is recorded');
select lives_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent, opt_out, model, decision_version)
  values ('00000000-0000-0000-0000-0000000000f9', 'model', 'not_now', 'none', 'test-model', 1)$$, 'a model label sits next to the human one');
select throws_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent, labeled_by)
  values ('00000000-0000-0000-0000-0000000000f9', 'human', 'neutral', 'owner@example.com')$$,
  '23505', null, 'one current decision per source; a correction supersedes');
select throws_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent)
  values ('00000000-0000-0000-0000-0000000000f9', 'model', 'neutral')$$, '23514', null, 'a model decision names its model');
select throws_ok($$insert into public.gtm_email_reply_labels (source, intent) values ('legacy', 'neutral')$$,
  '23514', null, 'a decision belongs to a reply or a draft');
select throws_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent, labeled_by)
  values ('00000000-0000-0000-0000-0000000000f9', 'legacy', 'positive', 'x')$$, '23514', null, 'legacy words are mapped before storage');
select throws_ok($$update public.gtm_email_reply_labels set intent = 'neutral' where source = 'human' and draft_id = '00000000-0000-0000-0000-0000000000f9'$$,
  '42501', null, 'a decision is never edited, not even by the service role');
select throws_ok($$delete from public.gtm_email_reply_labels where source = 'model'$$, '42501', null, 'a decision is never deleted');
select lives_ok($$update public.gtm_email_reply_labels set superseded_at = now() where source = 'human' and draft_id = '00000000-0000-0000-0000-0000000000f9'$$,
  'a correction supersedes the old decision');
select throws_ok($$update public.gtm_email_reply_labels set superseded_at = now() + interval '1 day' where source = 'human' and draft_id = '00000000-0000-0000-0000-0000000000f9'$$,
  '42501', null, 'a decision is superseded once');
select lives_ok($$insert into public.gtm_email_reply_labels (draft_id, source, intent, labeled_by)
  values ('00000000-0000-0000-0000-0000000000f9', 'human', 'not_now', 'owner@example.com')$$, 'the correction is a new current decision');

-- Desk drafts: new labels and their provenance
select lives_ok($$update public.gtm_outreach_drafts set reply_sentiment = 'interested', reply_label_source = 'model',
  email_replied_at = now(), email_replied_at_source = 'gmail' where id = '00000000-0000-0000-0000-0000000000f9'$$,
  'a draft accepts the new labels with their source');
select lives_ok($$update public.gtm_outreach_drafts set reply_sentiment = 'positive' where id = '00000000-0000-0000-0000-0000000000f9'$$,
  'the legacy five remain valid');
select throws_ok($$update public.gtm_outreach_drafts set reply_label_source = 'guess' where id = '00000000-0000-0000-0000-0000000000f9'$$,
  '23514', null, 'a label is human or model');
select lives_ok($$delete from public.gtm_outreach_drafts where id = '00000000-0000-0000-0000-0000000000f9'$$, 'a desk draft can still be deleted');
select is((select count(*) from public.gtm_email_reply_labels where draft_id = '00000000-0000-0000-0000-0000000000f9'), 3::bigint,
  'its decision history outlives it');

-- Sync operations
select throws_ok($$insert into public.gtm_email_sync_ops (op_key, destination, action, address_hash, reason, policy_version, observed_at)
  values ('addr:hhhh:invalid', 'twenty', 'address_restrict', repeat('h', 32), 'EMAIL_BOUNCED', 'v1', now())$$,
  '23514', null, 'an address restriction names its person');
select lives_ok($$insert into public.gtm_email_sync_ops (op_key, destination, action, person_id, address_hash, reason, policy_version, observed_at)
  values ('addr:hhhh:invalid', 'twenty', 'address_restrict', '00000000-0000-0000-0000-0000000000a1', repeat('h', 32), 'EMAIL_BOUNCED', 'v1', now())$$,
  'an address restriction starts pending review');
select lives_ok($$insert into public.gtm_email_sync_ops (op_key, destination, action, address_hash, reason, policy_version, observed_at)
  values ('addr:hhhh:invalid', 'origami', 'exclusion_upsert', repeat('h', 32), 'EMAIL_BOUNCED', 'v1', now())$$,
  'the same restriction has its own Origami state');
select throws_ok($$update public.gtm_email_sync_ops set state = 'applied', applied_at = now() where destination = 'twenty'$$,
  '23514', null, 'nothing is applied without an approval');
select throws_ok($$update public.gtm_email_sync_ops set state = 'confirmed', approved_at = now() where destination = 'origami'$$,
  '23514', null, 'confirmed needs a read-back time');

-- Incidents
select lives_ok($$insert into public.gtm_email_incidents (incident_key, kind, severity, summary) values ('bounce:tout', 'bounce_rate', 'critical', 'Bounces above 2%')$$,
  'an incident opens');
select throws_ok($$insert into public.gtm_email_incidents (incident_key, kind, severity, summary) values ('bounce:tout', 'bounce_rate', 'critical', 'Again')$$,
  '23505', null, 'one open incident per key');

-- Leases
select ok(public.gtm_take_lease('team.hourly', 'run-a', 60) and not public.gtm_take_lease('team.hourly', 'run-b', 60),
  'a held lease refuses a second runner');

select pg_temp.as_role('authenticated', true);
select throws_ok($$select public.gtm_take_lease('team.hourly', 'owner', 60)$$, '42501', null, 'a signed-in user cannot take a lease');
select is((select count(*) from public.gtm_email_attempts where recipient_hash in (repeat('h', 32), repeat('j', 32))), 2::bigint,
  'the owner reads attempts');
select throws_ok($$select token_ciphertext from public.gtm_team_mailboxes$$, '42501', null, 'the owner still cannot read a token');

select pg_temp.as_role('authenticated', false);
select is((select count(*) from public.gtm_email_attempts), 0::bigint, 'a signed-in non-owner reads no attempts');

select pg_temp.as_role('anon', null);
select throws_ok($$select id from public.gtm_email_sync_ops$$, '42501', null, 'anonymous cannot read sync state');

select * from finish();
rollback;
