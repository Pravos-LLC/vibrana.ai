-- A homepage read straight from the site (no paid scrape) is a valid profile source.
alter table public.simulator_company_profiles
  drop constraint if exists simulator_company_profiles_source_check;
alter table public.simulator_company_profiles
  add constraint simulator_company_profiles_source_check
  check (source in ('firecrawl', 'browser_run', 'direct'));

-- The intelligent summary on the result page: the company's name as it writes it, how AI changes
-- the economics of its industry, and up to three profit levers. Written by the classifier; no page text stored.
alter table public.simulator_company_profiles
  add column if not exists company_name text check (company_name is null or length(company_name) <= 80),
  add column if not exists ai_role text check (ai_role is null or length(ai_role) <= 320),
  add column if not exists levers text[] not null default '{}' check (cardinality(levers) <= 3);
