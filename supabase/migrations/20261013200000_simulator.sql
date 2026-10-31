-- AI Transformation Simulator (VIB-430, hub gtm/simulator/SPEC.md section 6).
--
-- Three service-role-only tables and two lead columns. Results are served through
-- the app (/ai-transformation/simulator/r/<slug>), never straight from the Data API,
-- so RLS is on with no policies and client roles get no grants.
--
-- Privacy (spec 13): no scraped page text is stored, only the classification; no raw
-- IPs (the app stores an HMAC with a daily salt). Retention: profiles expire at 30
-- days; runs without a lead are deleted after 180 days. The sweep runs inside
-- simulator_budget_hit on about 1% of calls, the same pattern as form_rate_limit_hit.

-- One row per company domain: the cached classification, 30-day TTL.
create table public.simulator_company_profiles (
  domain            text primary key check (domain ~ '^[a-z0-9.-]{1,253}$'),
  sector            text not null check (length(sector) between 1 and 64),
  sector_confidence real not null check (sector_confidence between 0 and 1),
  alternatives      text[] not null default '{}',
  function_mix      jsonb not null,
  signals           jsonb not null default '{}',
  source            text not null check (source in ('firecrawl', 'browser_run')),
  classifier        text not null check (length(classifier) between 1 and 200),
  classified_at     timestamptz not null default now(),
  expires_at        timestamptz not null default now() + interval '30 days'
);
comment on table public.simulator_company_profiles is
  'Simulator: cached sector + function-mix classification per domain (30-day TTL). No page text is stored.';

create table public.simulator_runs (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null check (slug ~ '^[A-Za-z0-9_-]{10}$'),
  created_at           timestamptz not null default now(),
  domain               text references public.simulator_company_profiles(domain) on delete set null,
  show_company_name    boolean not null default false,
  company_name         text check (company_name is null or length(company_name) <= 200),
  headcount            int not null check (headcount between 5 and 100000),
  inputs               jsonb not null,
  result               jsonb not null,
  engine_version       text not null,
  benchmarks_version   text not null,
  prices_version       text not null,
  ip_hash              text not null check (length(ip_hash) <= 128),
  lead_id              uuid references public.assessment_leads(id) on delete set null,
  owner_token_hash     text not null check (owner_token_hash ~ '^[0-9a-f]{64}$'),
  deleted_at           timestamptz,
  view_count           int not null default 0,
  forwarded_view_count int not null default 0,
  share_count          int not null default 0,
  constraint simulator_runs_name_opt_in check (show_company_name or company_name is null)
);
create index simulator_runs_created_at_idx on public.simulator_runs (created_at) where lead_id is null;
create index simulator_runs_domain_idx on public.simulator_runs (domain);
create index simulator_runs_lead_idx on public.simulator_runs (lead_id);
comment on table public.simulator_runs is
  'Simulator: one stored, server-computed result per shareable /r/<slug> link. Soft delete via deleted_at (link returns 410).';
comment on column public.simulator_runs.ip_hash is 'HMAC(ip, daily salt). Never the raw IP.';
comment on column public.simulator_runs.forwarded_view_count is 'Views from an IP hash other than the creator''s: the forwarded-to-reviewer signal.';

-- Global daily spend guard for paid scrape / classify calls.
create table public.simulator_budget (
  day             date primary key,
  scrapes         int not null default 0,
  classifications int not null default 0
);
comment on table public.simulator_budget is 'Simulator: daily counters for paid scrape and classification calls.';

alter table public.assessment_leads
  add column if not exists source text check (source is null or length(source) <= 64),
  add column if not exists simulator_run_id uuid references public.simulator_runs(id) on delete set null,
  -- The run's public slug, so the CRM import (vibrana-crm owned_audience.py) can link
  -- /ai-transformation/simulator/r/<slug> without reading simulator_runs.
  add column if not exists simulator_run_slug text check (simulator_run_slug is null or simulator_run_slug ~ '^[A-Za-z0-9_-]{10}$');

alter table public.simulator_company_profiles enable row level security;
alter table public.simulator_runs enable row level security;
alter table public.simulator_budget enable row level security;
revoke all on public.simulator_company_profiles, public.simulator_runs, public.simulator_budget from anon, authenticated;
grant select, insert, update, delete on public.simulator_company_profiles, public.simulator_runs, public.simulator_budget to service_role;

-- Atomically counts one paid call of p_kind ('scrapes' | 'classifications') for today
-- and returns whether today's count is still within p_max. Sweeps expired data on ~1% of calls.
create function public.simulator_budget_hit(p_kind text, p_max integer)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_kind not in ('scrapes', 'classifications') or p_max is null or p_max < 0 then
    raise exception 'simulator_budget_hit: invalid arguments';
  end if;

  if p_kind = 'scrapes' then
    insert into public.simulator_budget as b (day, scrapes) values (current_date, 1)
    on conflict (day) do update set scrapes = b.scrapes + 1
    returning b.scrapes into v_count;
  else
    insert into public.simulator_budget as b (day, classifications) values (current_date, 1)
    on conflict (day) do update set classifications = b.classifications + 1
    returning b.classifications into v_count;
  end if;

  if random() < 0.01 then
    perform public.simulator_purge();
  end if;

  return v_count <= p_max;
end;
$$;

-- Retention (spec 13): expired profiles, runs without a lead after 180 days, budget rows after 90 days.
create function public.simulator_purge()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  delete from public.simulator_runs where lead_id is null and created_at < now() - interval '180 days';
  delete from public.simulator_company_profiles where expires_at < now();
  delete from public.simulator_budget where day < current_date - 90;
end;
$$;

-- Counts one view of a live run. A view from an IP hash other than the creator's
-- also counts as forwarded. Returns false when the run is missing or deleted.
create function public.simulator_run_view(p_slug text, p_ip_hash text)
returns boolean
language sql
security invoker
set search_path = public, pg_temp
as $$
  with hit as (
    update public.simulator_runs
       set view_count = view_count + 1,
           forwarded_view_count = forwarded_view_count + (case when ip_hash is distinct from p_ip_hash then 1 else 0 end)
     where slug = p_slug and deleted_at is null
    returning 1
  )
  select exists (select 1 from hit);
$$;

create function public.simulator_run_share(p_slug text)
returns boolean
language sql
security invoker
set search_path = public, pg_temp
as $$
  with hit as (
    update public.simulator_runs set share_count = share_count + 1
     where slug = p_slug and deleted_at is null
    returning 1
  )
  select exists (select 1 from hit);
$$;

revoke all on function public.simulator_budget_hit(text, integer) from public, anon, authenticated;
revoke all on function public.simulator_purge() from public, anon, authenticated;
revoke all on function public.simulator_run_view(text, text) from public, anon, authenticated;
revoke all on function public.simulator_run_share(text) from public, anon, authenticated;
grant execute on function public.simulator_budget_hit(text, integer) to service_role;
grant execute on function public.simulator_purge() to service_role;
grant execute on function public.simulator_run_view(text, text) to service_role;
grant execute on function public.simulator_run_share(text) to service_role;
