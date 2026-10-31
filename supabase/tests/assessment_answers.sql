-- Behaviour tests for 20261016120000_assessment_raw_answers.sql and
-- 20261016140000_assessment_structured_analysis.sql and 20261016180000_assessment_instrument_v2.sql.
-- psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/assessment_answers.sql   (also `supabase test db`)
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_column('public', 'assessments', 'answers', 'assessments keeps the raw answers');
select col_type_is('public', 'assessments', 'answers', 'jsonb', 'answers are jsonb');
select col_type_is('public', 'assessments', 'analysis', 'jsonb', 'the structured analysis is jsonb');
select col_type_is('public', 'assessments', 'analysis_meta', 'jsonb', 'how it was produced is jsonb');
select col_type_is('public', 'assessments', 'instrument_version', 'smallint', 'the question set version is a smallint');
select col_type_is('public', 'assessments', 'workflows', 'jsonb', 'the named workflows are jsonb');

set local role service_role;
select lives_ok($$insert into public.assessments (company_name, email, answers)
  values ('Answers Co', 'answers@example.test', '{"l1": 100, "d1": 40}'::jsonb)$$,
  'the service role saves an assessment with its answers');
select is((select (answers->>'d1')::int from public.assessments where email = 'answers@example.test'), 40,
  'an answer reads back by question id');
select lives_ok($$update public.assessments set analysis = '{"version": 1, "summary": "x"}'::jsonb,
  analysis_meta = '{"status": "stored"}'::jsonb where email = 'answers@example.test'$$,
  'the service role stores an analysis and its metadata');

select lives_ok($$insert into public.assessments (company_name, email, answers, instrument_version, workflows)
  values ('Workflow Co', 'workflows@example.test', '{"l_owner": 70}'::jsonb, 2,
  '{"currency": "USD", "items": [{"id": "support", "people": 4, "hoursPerWeek": 10, "hourlyCost": null}]}'::jsonb)$$,
  'the service role saves a version 2 assessment with its named workflows');
select is((select workflows->'items'->0->>'id' from public.assessments where email = 'workflows@example.test'), 'support',
  'a named workflow reads back');

select * from finish();
rollback;
