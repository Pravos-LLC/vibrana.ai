-- Simulator RPCs (VIB-430): the daily budget counter, view / share counters and retention.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select ok(public.simulator_budget_hit('scrapes', 2), 'first scrape is within the cap');
select ok(public.simulator_budget_hit('scrapes', 2), 'second scrape is within the cap');
select ok(not public.simulator_budget_hit('scrapes', 2), 'third scrape is over the cap');
select throws_ok($$ select public.simulator_budget_hit('tokens', 2) $$, 'P0001', 'simulator_budget_hit: invalid arguments', 'unknown kinds are refused');

insert into public.simulator_runs (slug, headcount, inputs, result, engine_version, benchmarks_version, prices_version, ip_hash, owner_token_hash, created_at)
  values ('testslug01', 200, '{}', '{}', '1.0.0', 't', 't', 'creator', repeat('a', 64), now()),
         ('oldslug001', 200, '{}', '{}', '1.0.0', 't', 't', 'creator', repeat('b', 64), now() - interval '200 days');

select ok(public.simulator_run_view('testslug01', 'creator') and public.simulator_run_view('testslug01', 'someone-else'), 'views count');
select results_eq($$ select view_count, forwarded_view_count from public.simulator_runs where slug = 'testslug01' $$,
  $$ values (2, 1) $$, 'a view from another IP hash counts as forwarded');

update public.simulator_runs set deleted_at = now() where slug = 'testslug01';
select ok(not public.simulator_run_view('testslug01', 'creator'), 'a deleted run records no views');

select public.simulator_purge();
select is((select count(*) from public.simulator_runs where slug = 'oldslug001')::int, 0, 'runs without a lead are purged after 180 days');
select is((select count(*) from public.simulator_runs where slug = 'testslug01')::int, 1, 'recent runs survive the purge');

-- v2 company header columns and the public screenshot bucket.
insert into public.simulator_company_profiles (domain, sector, sector_confidence, function_mix, source, classifier, summary, offerings, hq_country, logo_path, screenshot_path)
  values ('acme.com', 'insurance', 0.9, '{}', 'firecrawl', 'test', 'Insurance for families.', '{Home insurance,Car insurance}', 'GB', 'logos/acme.com.png', 'screens/acme.com.webp');
select is((select hq_country from public.simulator_company_profiles where domain = 'acme.com'), 'GB', 'profiles store the head-office country');
select throws_ok($$ update public.simulator_company_profiles set hq_country = 'gbr' where domain = 'acme.com' $$, '23514', null, 'country codes are two capital letters');
select throws_ok($$ update public.simulator_company_profiles set offerings = '{a,b,c,d}' where domain = 'acme.com' $$, '23514', null, 'at most three offerings');
select throws_ok($$ update public.simulator_company_profiles set screenshot_path = '../etc/passwd' where domain = 'acme.com' $$, '23514', null, 'asset paths stay inside their folder');
select ok((select public from storage.buckets where id = 'simulator-screens'), 'the screenshot bucket is public for reads');
select is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and (qual like '%simulator-screens%' or with_check like '%simulator-screens%'))::int, 0,
  'no storage policies: nobody but the service role can list or write simulator-screens');

select * from finish();
rollback;
