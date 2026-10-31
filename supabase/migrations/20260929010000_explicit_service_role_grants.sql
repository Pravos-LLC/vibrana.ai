-- Grant the server role access to the legacy application tables on fresh
-- Supabase databases. Production already has these privileges.
--
-- GTM and Story migrations grant their own privileges. The content-review
-- migration deliberately gives publication tables narrower rights, including
-- no TRUNCATE; a schema-wide GRANT ALL would undo those restrictions.

grant usage on schema public to service_role;

grant select, insert, update, delete on table
  public.subscribers,
  public.assessment_leads,
  public.assessments,
  public.bot_interactions,
  public.cohorts,
  public.commons_applications,
  public.companies,
  public.course_types,
  public.email_log,
  public.engagement_inquiries,
  public.individual_assessments,
  public.whitepaper_leads
to service_role;

grant select on table
  public.course_statistics,
  public.daily_response_rates,
  public.stuck_points
to service_role;

grant usage, select on all sequences in schema public to service_role;
