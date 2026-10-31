-- Form rate limiting for the public forms on vibrana.ai.
--
-- Fixed-window counters keyed by an opaque bucket string. The app hashes IPs and
-- emails (HMAC-derived salt) before building buckets, so this table never holds
-- raw personal data. Called only from server code with the service-role key via
-- lib/form-guard/server.ts. See docs/form-protection.md.
--
-- Additive only: creates one table and one function. Touches no existing tables.
-- Apply in the Supabase SQL editor (or `supabase db push`) before or right after
-- deploying. The app fails open (allows requests, logs an error) until it exists.

create table if not exists public.form_rate_limits (
  bucket        text        not null,
  window_start  timestamptz not null,
  hits          integer     not null default 0,
  primary key (bucket, window_start)
);

comment on table public.form_rate_limits is
  'Fixed-window rate-limit counters for public forms. Buckets are hashed; no raw IPs or emails.';

create index if not exists form_rate_limits_window_start_idx
  on public.form_rate_limits (window_start);

-- Lock the table down: RLS on, no policies, no grants to client roles.
alter table public.form_rate_limits enable row level security;
revoke all on table public.form_rate_limits from anon, authenticated;
-- Explicit, because fresh databases don't grant service_role by default.
grant select, insert, update, delete on table public.form_rate_limits to service_role;

-- Atomically counts one hit and returns whether the caller is still within p_max
-- for the current window. Also sweeps windows older than two days, about 1% of calls.
create or replace function public.form_rate_limit_hit(
  p_bucket         text,
  p_window_seconds integer,
  p_max            integer
) returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_window_start timestamptz;
  v_hits         integer;
begin
  if p_bucket is null or length(p_bucket) > 200
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 604800
     or p_max is null or p_max < 1 then
    raise exception 'form_rate_limit_hit: invalid arguments';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.form_rate_limits as f (bucket, window_start, hits)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket, window_start)
  do update set hits = f.hits + 1
  returning f.hits into v_hits;

  if random() < 0.01 then
    delete from public.form_rate_limits
    where window_start < now() - interval '2 days';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.form_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.form_rate_limit_hit(text, integer, integer) to service_role;
