-- Behavioural access checks: what the Data API roles actually see and change.
--
-- Production still carries Supabase's old default grants (anon/authenticated
-- have table privileges almost everywhere), so RLS is the only thing between
-- the Data API and the rows. Fresh local databases have no such grants, which
-- would let reads fail on "permission denied" before RLS is ever consulted.
-- So, inside this rolled-back transaction, grant every table to anon and
-- authenticated, which is at least as open as production, and require RLS alone
-- to hold. A permission error is not treated as "not leaking"; it fails the run.
--
-- Every public table is seeded, and an owner-side check fails if any public
-- relation is empty, so a new table can't pass these checks vacuously: it
-- needs a seed row below.
--
-- Roles:
--   * anon                                   -> sees nothing, changes nothing
--   * authenticated, no gtm_owner claim      -> sees nothing, changes nothing
--   * authenticated, gtm_owner in user_metadata (user-editable) -> same as above
--   * authenticated, app_metadata.gtm_owner  -> reads gtm_* + review rounds only
--                                               and decides Story assets via RPC

begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- ---- mirror production's grants ---------------------------------------------
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- ---- helpers ------------------------------------------------------------------
create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

-- Rows of `rel` visible to the current role. Errors propagate.
create or replace function tests.visible_rows(rel regclass)
returns bigint language plpgsql set search_path = '' as $$
declare n bigint;
begin
  execute format('select count(*) from %s', rel) into n;
  return n;
end $$;

-- Rows changed by a DML statement run as the current role.
create or replace function tests.affected_rows(stmt text)
returns bigint language plpgsql set search_path = '' as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- Public tables and views, optionally excluding an allowlist.
create or replace function tests.public_relations(excluding text[] default '{}')
returns setof regclass language sql set search_path = '' as $$
  select c.oid::regclass
    from pg_catalog.pg_class c
   where c.relnamespace = 'public'::regnamespace
     and c.relkind in ('r', 'p', 'v')
     and not (c.relname = any (excluding))
$$;

-- Relations the current role can see rows in.
create or replace function tests.leaking_relations(excluding text[] default '{}')
returns setof text language sql set search_path = '' as $$
  select r::text from tests.public_relations(excluding) r where tests.visible_rows(r) > 0
$$;

-- Write attempts the current role must not be able to make, as one row per
-- violation ('<table>: <op> ...'). For every public base table:
--   * UPDATE <first column> = NULL      -> 0 rows, or 42501 (blocked by WITH CHECK)
--   * DELETE (no WHERE)                 -> 0 rows, or 42501
--   * INSERT DEFAULT VALUES             -> 42501 (RLS WITH CHECK runs before
--                                          NOT NULL / CHECK constraints)
-- The UPDATE assigns a constant rather than the column to itself: an
-- assignment that reads a column also applies SELECT policies, which would hide
-- an open UPDATE policy on a table the role can't read. Each attempt runs in a
-- subtransaction that is always rolled back. Callers set
-- session_replication_role = replica so row triggers can't pre-empt RLS with
-- their own errors. `allowed` lists reviewed '<table>:<op>' exceptions.
create or replace function tests.write_violations(allowed text[] default '{}')
returns setof text language plpgsql set search_path = '' as $$
declare
  t record;
  op text;
  stmt text;
  n bigint;
  code text;
  msg text;
begin
  for t in
    select c.oid::regclass as rel, c.relname::text as name,
           (select quote_ident(a.attname) from pg_catalog.pg_attribute a
             where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
               and a.attgenerated = '' and a.attidentity <> 'a'
             order by a.attnum limit 1) as col
      from pg_catalog.pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p')
     order by c.relname
  loop
    foreach op in array array['update', 'delete', 'insert'] loop
      continue when (t.name || ':' || op) = any (allowed);
      stmt := case op
        when 'update' then format('update %s set %s = null', t.rel, t.col)
        when 'delete' then format('delete from %s', t.rel)
        else format('insert into %s default values', t.rel) end;
      n := null; code := null; msg := null;
      begin
        execute stmt;
        get diagnostics n = row_count;
        raise exception using errcode = 'TSTRB', message = n::text;
      exception when others then
        if sqlstate = 'TSTRB' then n := sqlerrm::bigint;
        else code := sqlstate; msg := sqlerrm; end if;
      end;
      if op = 'insert' then
        if code is distinct from '42501' then
          return next format('%s: insert %s', t.name,
            coalesce('raised ' || code || ' ' || msg, 'succeeded'));
        end if;
      elsif code is not null and code <> '42501' then
        return next format('%s: %s raised %s %s', t.name, op, code, msg);
      elsif n > 0 then
        return next format('%s: %s changed %s rows', t.name, op, n);
      end if;
    end loop;
  end loop;
end $$;

grant execute on all functions in schema tests to anon, authenticated;

-- Readable by a GTM owner (policies <table>_owner_read) and views over them.
create or replace function tests.owner_readable()
returns text[] language sql immutable set search_path = '' as $$
  select array[
    'gtm_channel_daily', 'gtm_content_items', 'gtm_crm_snapshots', 'gtm_enrichment_runs',
    'gtm_post_metrics', 'gtm_post_metrics_latest', 'gtm_spend', 'gtm_zernio_events',
    'review_batches', 'review_assets', 'review_comments',
    'gtm_piece_delivery_attempts','gtm_piece_deliveries','gtm_piece_decision_events',
    'gtm_piece_reviews', 'gtm_piece_part_decisions', 'gtm_piece_fixes',
    'gtm_stories', 'gtm_story_assets', 'gtm_story_asset_channels', 'gtm_story_feedback', 'gtm_story_asset_versions', 'gtm_seasons',
    'gtm_story_stages', 'gtm_story_stage_decisions',
    'gtm_inspiration', 'gtm_signal_stories', 'gtm_signal_items', 'gtm_signal_feedback', 'gtm_signal_runs',
    'gtm_comments', 'gtm_comment_runs', 'gtm_red_flag_alerts', 'gtm_red_flag_resolutions', 'gtm_engage_lessons',
    'gtm_manual_metrics', 'gtm_content_reports', 'gtm_report_actions', 'gtm_sync_state',
    'gtm_content_candidates', 'gtm_ideas',
    'gtm_storyboards', 'gtm_storyboard_versions', 'gtm_storyboard_rules', 'gtm_storyboard_comments',
    'gtm_storyboard_scene_decisions', 'gtm_storyboard_spend', 'gtm_broll_shots',
    'gtm_reviewer_invites', 'gtm_reviewer_invite_accounts', 'gtm_reviewer_asset_decisions', 'gtm_work_items', 'gtm_people',
    'gtm_outreach_drafts', 'gtm_outreach_draft_versions', 'gtm_outreach_dossiers', 'gtm_outreach_desk', 'gtm_outreach_tracks',
    'gtm_outreach_angle_runs', 'gtm_outreach_angle_edits', 'gtm_outreach_lessons', 'gtm_outreach_learn_runs'
  ]
$$;
grant execute on function tests.owner_readable() to authenticated;

-- ---- seed every public table (as the migration owner) -------------------------
insert into public.subscribers (id, email)
  values ('00000000-0000-0000-0000-00000000000a', 'seed-subscriber@example.test');
insert into public.email_log (subscriber_id, email_day)
  values ('00000000-0000-0000-0000-00000000000a', 1);
-- checkin + "stuck" feeds both daily_response_rates and stuck_points
insert into public.bot_interactions (subscriber_id, day, cohort, message_type, channel, response_option, student_response)
  values ('00000000-0000-0000-0000-00000000000a', 1, 'seed', 'checkin', 'telegram', 2, 'stuck');
insert into public.whitepaper_leads (email) values ('seed-wp@example.test');
insert into public.assessment_leads (email) values ('seed-al@example.test');
insert into public.assessments (company_name, email) values ('Seed Co', 'seed-assess@example.test');
insert into public.assessment_notification_claims (email) values ('seed-claim@example.test');
insert into public.email_opt_outs (email) values ('seed-optout@example.test');
insert into public.client_feedback (slug, answers, overall_score) values ('seed', '{}'::jsonb, 5);
insert into public.funnel_events (event, entry_point, location) values ('call_click', 'direct', 'seed');
insert into public.scheduled_emails (resend_id, email, sequence, step, scheduled_for)
  values ('seed-resend-id', 'seed-scheduled@example.test', 'assessment-nurture', 'day2', now());
insert into public.individual_assessments (email) values ('seed-ia@example.test');
insert into public.companies (name) values ('Seed Co');
insert into public.commons_applications (full_name, email, organization, role, connection, product_idea)
  values ('Seed', 'seed-commons@example.test', 'Org', 'Role', 'Conn', 'Idea');
insert into public.engagement_inquiries
  (company_name, contact_name, email, team_size, revenue_band, department_focus, timeline, goals)
  values ('Seed Co', 'Seed', 'seed-inquiry@example.test', '1-10', 'seed', 'seed', 'seed', 'seed');
insert into public.gtm_content_items (id, week, date, pillar, title, format, status)
  values ('seed-1', 1, current_date, 'proof', 'Seed', 'post', 'drafted');
insert into public.gtm_inspiration (kind, url) values ('post', 'https://example.test/inspiration');
insert into public.gtm_signal_stories (id, title) values ('00000000-0000-0000-0000-0000000000b1', 'Seed signal story');
insert into public.gtm_signal_items (url, source, source_kind, title, story_id)
  values ('https://example.test/signal', 'seed', 'rss', 'Seed signal', '00000000-0000-0000-0000-0000000000b1');
insert into public.gtm_signal_feedback (story_id, actor, action) values ('00000000-0000-0000-0000-0000000000b1', 'seed', 'save');
insert into public.gtm_signal_runs (kind) values ('collect');
insert into public.gtm_comments (source, platform, external_id, text) values ('poll', 'instagram', 'seed-comment', 'Seed comment');
insert into public.gtm_comment_runs (kind) values ('daily');
insert into public.gtm_red_flag_alerts (post_key, flag) values ('instagram|seed', 'backlash');
insert into public.gtm_red_flag_resolutions (post_key, flag, note) values ('instagram|seed', 'backlash', 'Seed resolution');
insert into public.gtm_engage_lessons (kind, lesson) values ('voice', 'Seed lesson');
insert into public.gtm_manual_metrics (week_start, channel) values (date_trunc('week', current_date)::date, 'youtube');
insert into public.gtm_content_reports (id, kind, period_start, period_end)
  values ('00000000-0000-0000-0000-0000000000e1', 'weekly', current_date, current_date);
insert into public.gtm_report_actions (report_id, type, proposal)
  values ('00000000-0000-0000-0000-0000000000e1', 'move', 'Seed change');
insert into public.gtm_sync_state (key, value) values ('seed', '{}');
insert into public.gtm_content_candidates (week_start, slug, format, lens, pillar, channels, title, body, sources, agent_draft)
  values (date_trunc('week', current_date)::date, 'seed', 'text', 'regenerative', 'perspective', '{linkedin}', 'Seed', 'Seed', '[{}]', '{}');
insert into public.gtm_ideas (slug, title) values ('seed', 'Seed idea');
insert into public.gtm_reviewer_invites (token_sha256, party, expires_at) values (repeat('e', 64), 'Seed Partner', now() + interval '1 day');
insert into public.gtm_reviewer_invite_accounts (invite_id, user_id, email)
  select id, '00000000-0000-0000-0000-0000000000e2', 'seed@example.test' from public.gtm_reviewer_invites where token_sha256 = repeat('e', 64);
insert into public.gtm_seasons (id, title, starts_on, ends_on) values ('seed-season', 'Seed Season', current_date, current_date);
insert into public.gtm_stories (id, title, link_url)
  values ('seed-story', 'Seed Story', 'https://example.test/story');
insert into public.gtm_story_assets (id, story_id, title, kind, source, sha256, body)
  values ('seed-copy', 'seed-story', 'Seed Copy', 'copy', 'seed/copy.txt', repeat('a', 64), 'Seed copy');
-- Separate shared piece keeps the legacy RPC fixture below meaningful.
insert into public.gtm_stories(id,title,link_url) values('seed-shared','Shared','https://example.test/shared');
insert into public.gtm_story_assets(id,story_id,title,kind,source,sha256,body,storage_path) values
 ('seed-shared-text','seed-shared','Text','copy','text.md',repeat('b',64),'Shared caption',null),
 ('seed-shared-video','seed-shared','Video','video','video.mp4',repeat('c',64),null,'shared/video.mp4');
insert into public.gtm_piece_reviews(story_id,text_asset_id,video_asset_id,channels) values('seed-shared','seed-shared-text','seed-shared-video','{linkedin}');
insert into public.gtm_piece_part_decisions(story_id,part,fingerprint) values('seed-shared','text','seed');
insert into public.gtm_content_items(id,story_id,week,date,time,pillar,title,format,channels,status) values('seed-shared-linkedin','seed-shared',1,'2030-01-01','14:00','proof','Shared','video','{linkedin}','drafted');
insert into public.gtm_piece_deliveries(story_id,channel,calendar_id,slot_date,slot_time,timezone,review_snapshot) values('seed-shared','linkedin','seed-shared-linkedin','2030-01-01','14:00','UTC','{}');
insert into public.gtm_piece_delivery_attempts(id,delivery_id,story_id,channel,calendar_id,request) select gen_random_uuid(),id,story_id,channel,calendar_id,'{}' from public.gtm_piece_deliveries where story_id='seed-shared';
-- Decision-event trigger seeded the append-only event with the preceding pending decision.
insert into public.gtm_piece_fixes(story_id,part,asset_id,note,base_fingerprint,base_revision,base_asset) values('seed-shared','text','seed-shared-text','Correct spelling','seed',1,'{}');
insert into public.gtm_reviewer_asset_decisions (story_id, asset_id, asset_sha256, revision, party, decision, note)
  values ('seed-story', 'seed-copy', repeat('a', 64), 1, 'Seed Partner', 'note', 'Seed note');
insert into public.gtm_story_asset_channels (asset_id, channel)
  values ('seed-copy', 'linkedin');
insert into public.gtm_story_feedback (asset_id, channel, body)
  values ('seed-copy', 'linkedin', 'Seed feedback');
insert into public.gtm_work_items (story_id, title) values ('seed-story', 'Seed Story: 1 note');
insert into public.gtm_people (name) values ('Seed Person');
insert into public.gtm_outreach_drafts (id, batch, domain, subject, body) values ('00000000-0000-0000-0000-0000000000f7', 'seed-batch', 'seed.example', 'Seed subject', 'Seed body');
update public.gtm_outreach_drafts set body = 'Seed body, edited', edited_by = 'seed', edited_at = now() where id = '00000000-0000-0000-0000-0000000000f7';
insert into public.gtm_outreach_dossiers (twenty_person_id, domain, name) values ('seed-person', 'seed.example', 'Seed Person');
insert into public.gtm_outreach_angle_runs (id, person, angles) values ('00000000-0000-0000-0000-0000000000f8', 'seed-person', '[]');
insert into public.gtm_outreach_angle_edits (run_id, draft_id, person, channel, angle_key, generated, final)
  values ('00000000-0000-0000-0000-0000000000f8', '00000000-0000-0000-0000-0000000000f7', 'seed-person', 'email', 'light_touch', '{}', '{}');
insert into public.gtm_outreach_lessons (kind, lesson) values ('body', 'Seed lesson');
insert into public.gtm_outreach_learn_runs default values;
insert into public.gtm_story_stages (story_id, stage, status) values ('seed-story', 'draft', 'done');
insert into public.gtm_story_stage_decisions (story_id, stage, party, decision) values ('seed-story', 'draft', 'john', 'approved');
insert into public.gtm_storyboards (id, story_id, stage, format, title) values ('sb-seed', 'seed-story', 'enhance-plan', 'short', 'Seed storyboard');
insert into public.gtm_storyboard_versions (storyboard_id, version, doc, doc_sha, schema, scene_shas, produced_by)
  values ('sb-seed', 1, '{}', repeat('a', 64), 'vibrana.storyboard/1', jsonb_build_object('sc-hook', repeat('b', 64)), 'seed');
insert into public.gtm_storyboard_comments (storyboard_id, version, kind, body) values ('sb-seed', 1, 'note', 'Seed note');
insert into public.gtm_storyboard_scene_decisions (storyboard_id, version, scene_id, scene_sha, decision)
  values ('sb-seed', 1, 'sc-hook', repeat('b', 64), 'approved');
insert into public.gtm_storyboard_spend (storyboard_id, version, kind, credits) values ('sb-seed', 1, 'authorized', 0);
insert into public.gtm_broll_shots (id, file) values ('seed-01', 'media/seed.mp4');
insert into public.gtm_spend (id, date, currency, amount, merchant)
  values ('seed-1', current_date, 'USD', 1, 'Seed');
insert into public.gtm_channel_daily (account_id, platform, date) values ('seed', 'linkedin', current_date);
insert into public.gtm_crm_snapshots (date, metrics) values (current_date, '{}');
insert into public.gtm_enrichment_runs (run, status) values ('seed', 'ok');
insert into public.gtm_post_metrics (zernio_post_id, platform, captured_at) values ('seed', 'linkedin', now());
insert into public.gtm_zernio_events (event_id, event, payload) values ('seed', 'seed', '{}');
insert into public.review_batches (id, series, round, title, workspace_dir)
  values ('00000000-0000-0000-0000-0000000000b1', 'seed', 1, 'Seed', 'seed');
insert into public.review_assets (id, batch_id, position, slug, title, kind, storage_path)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 1, 'seed', 'Seed', 'image', 'seed/r1/1-seed.png');
insert into public.review_comments (asset_id, body)
  values ('00000000-0000-0000-0000-0000000000a1', 'seed');
insert into public.review_publications (id, series, round, title, workspace_dir)
  values ('00000000-0000-0000-0000-0000000000c1', 'seed', 1, 'Seed', 'seed');
insert into public.review_publication_cancellations (id) values ('00000000-0000-0000-0000-0000000000c2');
insert into public.form_rate_limits (bucket, window_start, hits) values ('seed:bucket', now(), 1);
insert into public.simulator_company_profiles (domain, sector, sector_confidence, function_mix, source, classifier)
  values ('seed.example', 'other', 0.9, '{"operations": 1}', 'firecrawl', 'seed/model');
insert into public.simulator_runs (slug, domain, headcount, inputs, result, engine_version, benchmarks_version, prices_version, ip_hash, owner_token_hash)
  values ('seedslug01', 'seed.example', 200, '{}', '{}', '1.0.0', 'seed', 'seed', 'seed', repeat('f', 64));
insert into public.simulator_budget (day) values (current_date);
-- The booking tables are being retired; seed them only while they exist.
do $$
begin
  if to_regclass('public.bookings') is not null then
    insert into public.bookings (id, email, name, product, amount_cents, slot_start, slot_end, timezone)
      values ('00000000-0000-0000-0000-0000000000d1', 'seed-booking@example.test', 'Seed', 'pro-setup', 100,
              now(), now() + interval '1 hour', 'UTC');
  end if;
  if to_regclass('public.booking_emails') is not null then
    insert into public.booking_emails (booking_id, email_type)
      values ('00000000-0000-0000-0000-0000000000d1', 'confirmation');
  end if;
end $$;
-- cohorts and course_types are seeded by their migrations.

select is_empty(
  $$ select r::text from tests.public_relations() r where tests.visible_rows(r) = 0 $$,
  'every public table and view has seed data (add a seed row for new tables)');

-- ---- write sweep: no role writes outside its reviewed paths --------------------
-- Setting session_replication_role requires SUSET, so only a superuser/owner role
-- (never anon/authenticated) can run this file; 01_schema_security.test.sql's
-- ENABLE ALWAYS/REPLICA assertion is what guarantees no trigger escapes this
-- replica-mode window and fires anyway.
set local session_replication_role = replica;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is_empty($$ select tests.write_violations() $$,
  'anon cannot update, delete or insert in any public table');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{}}', true);
select is_empty($$ select tests.write_violations() $$,
  'signed-in non-owner cannot update, delete or insert in any public table');

select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","user_metadata":{"gtm_owner":true}}', true);
select is_empty($$ select tests.write_violations() $$,
  'gtm_owner in user_metadata grants no writes');

-- Reviewed owner write paths: editing and deleting comments on an open review
-- batch (20260928150000_content_review). Everything else, including every
-- gtm_* and Story table, stays unwritable for the owner. Story decisions go
-- through gtm_decide_story_asset (tested below and in gtm_story.sql).
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"gtm_owner":true}}', true);
select is_empty(
  $$ select tests.write_violations(array['review_comments:update', 'review_comments:delete']) $$,
  'gtm owner writes only through the reviewed comment paths');

reset role;
set local session_replication_role = origin;

-- ---- anon ----------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is_empty($$ select tests.leaking_relations() $$,
  'anon sees no rows in any public table or view');

select throws_ok(
  $$ select public.gtm_decide_story_asset('seed-copy', 'linkedin', 'approved', '', repeat('a', 64), 1) $$,
  '42501', null, 'anon cannot call the Story decision RPC');

select throws_ok(
  $$ insert into public.subscribers (email) values ('anon@example.test') $$,
  '42501', null, 'anon cannot insert into subscribers');

select throws_ok(
  $$ insert into public.engagement_inquiries
       (company_name, contact_name, email, team_size, revenue_band, department_focus, timeline, goals)
     values ('a', 'a', 'anon@example.test', '1-10', 'a', 'a', 'a', 'a') $$,
  '42501', null, 'anon cannot insert into engagement_inquiries');

select is(tests.affected_rows($$ update public.subscribers set status = 'unsubscribed' $$), 0::bigint,
  'anon updates 0 subscribers rows');

select is(tests.affected_rows($$ delete from public.commons_applications $$), 0::bigint,
  'anon deletes 0 commons_applications rows');

-- ---- authenticated, not a GTM owner --------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{}}', true);

select is_empty($$ select tests.leaking_relations() $$,
  'signed-in non-owner sees no rows in any public table or view');

select throws_ok(
  $$ select public.gtm_decide_story_asset('seed-copy', 'linkedin', 'approved', '', repeat('a', 64), 1) $$,
  '42501', null, 'signed-in non-owner cannot decide Story assets');

select is(tests.affected_rows($$ update public.engagement_inquiries set status = 'lost' $$), 0::bigint,
  'signed-in non-owner updates 0 engagement_inquiries rows');

-- user_metadata is user-editable; it must not grant access.
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","user_metadata":{"gtm_owner":true}}', true);

select is_empty($$ select tests.leaking_relations() $$,
  'gtm_owner in user_metadata grants nothing');

-- ---- authenticated GTM owner ---------------------------------------------------
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"gtm_owner":true}}', true);

select is_empty(
  $$ select o from unnest(tests.owner_readable()) o
      where tests.visible_rows(('public.' || quote_ident(o))::regclass) = 0 $$,
  'gtm owner can read every gtm_* and review relation');

select is_empty($$ select tests.leaking_relations(tests.owner_readable()) $$,
  'gtm owner sees nothing outside gtm_* and review rounds');

select lives_ok(
  $$ select public.gtm_decide_story_asset('seed-copy', 'linkedin', 'approved', '', repeat('a', 64), 1) $$,
  'gtm owner can approve the current Story asset revision');

select is(
  (select approved_sha256 from public.gtm_story_asset_channels where asset_id = 'seed-copy' and channel = 'linkedin'),
  repeat('a', 64), 'Story approval stores the asset digest');

select throws_ok(
  $$ select public.gtm_decide_story_asset('seed-copy', 'linkedin', 'approved', '', repeat('b', 64), 1) $$,
  'PT409', 'Story asset changed; refresh and review the new version', 'stale Story asset digest cannot be approved');

select is(tests.affected_rows($$ update public.gtm_story_asset_channels set status = 'rejected' $$), 0::bigint,
  'gtm owner cannot bypass the Story decision RPC with a direct update');

select is(tests.affected_rows($$ update public.gtm_spend set amount = 2 $$), 0::bigint,
  'gtm owner updates 0 gtm_spend rows (read-only)');

select is(tests.affected_rows($$ delete from public.gtm_content_items $$), 0::bigint,
  'gtm owner deletes 0 gtm_content_items rows (read-only)');

select throws_ok(
  $$ insert into public.gtm_spend (id, date, currency, amount, merchant)
     values ('owner-1', current_date, 'USD', 1, 'x') $$,
  '42501', null, 'gtm owner cannot insert into gtm_spend');

reset role;
select * from finish();
rollback;
