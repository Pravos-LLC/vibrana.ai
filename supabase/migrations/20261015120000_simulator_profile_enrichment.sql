-- Simulator v2 (VIB-430): the company header. Each cached profile gains the homepage title,
-- a one-sentence summary and up to three offerings written by the classifier from the page,
-- the head-office country (which picks the cost region), and the paths of the logo and the
-- homepage screenshot we copy into a public bucket. Still no page text is stored.

alter table public.simulator_company_profiles
  add column title text check (title is null or length(title) <= 300),
  add column summary text check (summary is null or length(summary) <= 200),
  add column offerings text[] not null default '{}' check (cardinality(offerings) <= 3),
  add column hq_country text check (hq_country is null or hq_country ~ '^[A-Z]{2}$'),
  add column logo_path text check (logo_path is null or logo_path ~ '^logos/[a-z0-9.-]{1,253}\.png$'),
  add column screenshot_path text check (screenshot_path is null or screenshot_path ~ '^screens/[a-z0-9.-]{1,253}\.webp$');

comment on column public.simulator_company_profiles.summary is
  'What the company does, at most 200 characters, written by the classifier from the homepage only.';
comment on column public.simulator_company_profiles.logo_path is
  'Object path in the public simulator-screens bucket. Deleted with the profile after 30 days.';
comment on column public.simulator_company_profiles.screenshot_path is
  'Object path in the public simulator-screens bucket (1280-wide webp). Deleted with the profile after 30 days.';

-- Public bucket: anyone can fetch an object by its exact path (the share card and the page
-- show them), nobody can list it, and only the service role writes. No storage.objects
-- policies are added on purpose. Retention: files older than 30 days are swept by the app
-- (sweepExpiredAssets), because storage files can't be deleted from SQL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('simulator-screens', 'simulator-screens', true, 2097152, array['image/webp', 'image/png'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
