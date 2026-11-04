-- Server-only booking data. No browser role may access credentials or attendees.
create table public.booking_hosts (
  id text primary key check (id in ('john','abe')),
  schedule jsonb not null,
  revision uuid not null default gen_random_uuid(),
  destination_connection uuid,
  destination_calendar text
);
insert into public.booking_hosts(id, schedule) values
('john', '{"enabled":true,"timezone":"Asia/Makassar","weekdays":[1,2,3,4,5],"public":{"start":"14:00","end":"19:00"},"morning":{"start":"08:00","end":"11:00"},"exceptions":{}}'),
('abe', '{"enabled":false,"timezone":"Asia/Makassar","weekdays":[1,2,3,4,5],"public":{"start":"14:00","end":"19:00"},"morning":{"start":"08:00","end":"11:00"},"exceptions":{}}');
create table public.booking_connections (
  id uuid primary key default gen_random_uuid(),
  host_id text not null references public.booking_hosts(id),
  account text not null,
  token text not null,
  calendars text[] not null default '{}',
  unique(host_id, account)
);
create index booking_connections_host_idx on public.booking_connections(host_id);
alter table public.booking_hosts add constraint booking_destination_fk foreign key (destination_connection) references public.booking_connections(id);
create table public.booking_invites (
  id uuid primary key default gen_random_uuid(),
  host_id text not null references public.booking_hosts(id),
  token_hash text not null unique,
  from_date date not null,
  to_date date not null check (to_date >= from_date),
  expires_at timestamptz not null,
  recipient text,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index booking_invites_host_idx on public.booking_invites(host_id);
create table public.booking_reservations (
  id uuid primary key,
  host_id text not null references public.booking_hosts(id),
  token_hash text not null,
  management_secret text not null,
  name text not null,
  email text not null,
  context text not null default '',
  ai_consent boolean not null default false,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  next_start timestamptz,
  next_end timestamptz,
  status text not null check (status in ('pending','confirmed','moving','cancelling','cancelled')),
  connection_id uuid not null references public.booking_connections(id),
  calendar_id text not null,
  invite_id uuid references public.booking_invites(id),
  meet_url text,
  conference_request_id uuid not null default gen_random_uuid(),
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check ((next_start is null and next_end is null) or (next_start is not null and next_end > next_start))
);
create index booking_reservations_host_time_idx on public.booking_reservations(host_id, start_at) where status <> 'cancelled';
create index booking_reservations_invite_idx on public.booking_reservations(invite_id);
create index booking_reservations_pending_idx on public.booking_reservations(next_attempt_at) where status in ('pending','moving','cancelling');

alter table public.booking_hosts enable row level security;
alter table public.booking_connections enable row level security;
alter table public.booking_invites enable row level security;
alter table public.booking_reservations enable row level security;
revoke all on public.booking_hosts, public.booking_connections, public.booking_invites, public.booking_reservations from public, anon, authenticated;
grant all on public.booking_hosts, public.booking_connections, public.booking_invites, public.booking_reservations to service_role;

-- Service-only invoker: host row lock serializes every reservation and configuration update.
-- The caller checks Google; this transaction independently enforces overlap and invite use.
create function public.booking_reserve(p_booking jsonb, p_schedule jsonb, p_move boolean default false)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  h public.booking_hosts;
  b public.booking_reservations;
  inv public.booking_invites;
  bid uuid := (p_booking->>'id')::uuid;
  hs text := p_booking->>'host_id';
  st timestamptz := (p_booking->>'start_at')::timestamptz;
  en timestamptz := (p_booking->>'end_at')::timestamptz;
  iid uuid := nullif(p_booking->>'invite_id','')::uuid;
begin
  select * into strict h from public.booking_hosts where id = hs for update;
  if h.schedule <> p_schedule or h.revision::text <> p_booking->>'revision' or not (h.schedule->>'enabled')::boolean then raise exception 'schedule_changed'; end if;
  select * into b from public.booking_reservations where id = bid for update;
  if p_move then
    if b.id is null or b.host_id <> hs or b.token_hash <> p_booking->>'token_hash' or b.status <> 'confirmed' then raise exception 'booking_state'; end if;
    iid := b.invite_id;
  elsif b.id is not null then
    if b.token_hash <> p_booking->>'token_hash' then raise exception 'booking_state'; end if;
    return b.id;
  end if;
  if st < now() + interval '12 hours' or st > now() + interval '30 days' or en <> st + interval '30 minutes' then raise exception 'invalid_time'; end if;
  if exists(select 1 from public.booking_reservations x where x.host_id = hs and x.id <> bid and x.status <> 'cancelled' and (
    tstzrange(x.start_at, x.end_at + interval '15 minutes', '[)') && tstzrange(st, en + interval '15 minutes', '[)') or
    (x.next_start is not null and tstzrange(x.next_start, x.next_end + interval '15 minutes', '[)') && tstzrange(st, en + interval '15 minutes', '[)')))) then raise exception 'slot_taken'; end if;
  if iid is not null then
    select * into strict inv from public.booking_invites where id = iid and host_id = hs for update;
    if inv.revoked or inv.expires_at <= now() or (st at time zone (h.schedule->>'timezone'))::date not between inv.from_date and inv.to_date
      or (inv.recipient is not null and inv.recipient <> p_booking->>'email') then raise exception 'invite_invalid'; end if;
    -- One invitation authorizes one booking over its entire lifetime, including cancellation.
    if not p_move and exists(select 1 from public.booking_reservations where invite_id = iid) then raise exception 'invite_used'; end if;
  end if;
  if p_move then
    update public.booking_reservations set next_start = st, next_end = en, status = 'moving' where id = bid;
  else
    if h.destination_connection is null or h.destination_calendar is null then raise exception 'not_connected'; end if;
    insert into public.booking_reservations(id, host_id, token_hash, management_secret, name, email, context, ai_consent, start_at, end_at, status, connection_id, calendar_id, invite_id)
    values(bid, hs, p_booking->>'token_hash', p_booking->>'management_secret', p_booking->>'name', p_booking->>'email', p_booking->>'context', coalesce((p_booking->>'ai_consent')::boolean,false), st, en, 'pending', h.destination_connection, h.destination_calendar, iid);
  end if;
  return bid;
end $$;
revoke all on function public.booking_reserve(jsonb,jsonb,boolean) from public, anon, authenticated;
grant execute on function public.booking_reserve(jsonb,jsonb,boolean) to service_role;

alter table public.booking_reservations add column worker_until timestamptz;
alter table public.booking_reservations add column worker_id uuid;
create function public.booking_config(p_host text, p_schedule jsonb, p_destination uuid, p_calendar text, p_connections jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.booking_hosts where id = p_host for update;
  if p_destination is not null and not exists(select 1 from public.booking_connections where id = p_destination and host_id = p_host) then raise exception 'invalid_destination'; end if;
  update public.booking_connections c set calendars = array(select jsonb_array_elements_text(item->'calendars'))
    from jsonb_array_elements(p_connections) item where c.id = (item->>'id')::uuid and c.host_id = p_host;
  update public.booking_hosts set schedule = p_schedule, destination_connection = p_destination, destination_calendar = p_calendar, revision = gen_random_uuid() where id = p_host;
end $$;
revoke all on function public.booking_config(text,jsonb,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.booking_config(text,jsonb,uuid,text,jsonb) to service_role;

-- Durable, immutable lifecycle snapshots. CRM/AI failures never roll back a booking.
create table public.booking_jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_reservations(id),
  host_id text not null references public.booking_hosts(id),
  kind text not null check (kind in ('crm','briefing')),
  event_key text not null,
  payload jsonb not null,
  state text not null default 'pending' check (state in ('pending','delivered','attention')),
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  worker_id uuid,
  worker_until timestamptz,
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  unique(booking_id,kind,event_key)
);
create index booking_jobs_queue_idx on public.booking_jobs(next_attempt_at) where state='pending';
create index booking_jobs_host_idx on public.booking_jobs(host_id,created_at);
alter table public.booking_jobs enable row level security;
revoke all on public.booking_jobs from public,anon,authenticated;
grant all on public.booking_jobs to service_role;
create table public.booking_ai_budget (
  day date primary key,
  hits integer not null default 0 check (hits>=0)
);
alter table public.booking_ai_budget enable row level security;
revoke all on public.booking_ai_budget from public,anon,authenticated;
grant all on public.booking_ai_budget to service_role;

create function public.booking_enqueue() returns trigger language plpgsql security invoker set search_path='' as $$
declare event text; snapshot jsonb; stamp text;
begin
  if new.status='confirmed' and old.status='pending' then event := 'booked';
  elsif new.status='confirmed' and old.status='moving' then event := 'rescheduled';
  elsif new.status='cancelled' and old.status<>'cancelled' and old.meet_url is not null then event := 'cancelled';
  else return new; end if;
  stamp := event || ':' || gen_random_uuid()::text;
  snapshot := jsonb_build_object('bookingId',new.id,'host',new.host_id,'name',new.name,'email',new.email,'context',new.context,'start',new.start_at,'end',new.end_at,'event',event,'occurredAt',now(),'aiConsent',new.ai_consent);
  insert into public.booking_jobs(booking_id,host_id,kind,event_key,payload) values(new.id,new.host_id,'crm',stamp,snapshot) on conflict do nothing;
  if new.ai_consent and event<>'cancelled' then
    insert into public.booking_jobs(booking_id,host_id,kind,event_key,payload) values(new.id,new.host_id,'briefing',stamp,snapshot) on conflict do nothing;
  end if;
  return new;
end $$;
revoke all on function public.booking_enqueue() from public,anon,authenticated;
grant execute on function public.booking_enqueue() to service_role;
create trigger booking_lifecycle_jobs after update of status on public.booking_reservations for each row execute function public.booking_enqueue();

-- Claim one due job using a short row lock, then release the transaction before I/O.
create function public.booking_claim_job(p_kinds text[],p_worker uuid)
returns setof public.booking_jobs language sql security invoker set search_path='' as $$
  update public.booking_jobs set worker_id=p_worker,worker_until=now()+interval '2 minutes',next_attempt_at=now()+interval '5 minutes',attempts=attempts+1
  where id=(select id from public.booking_jobs where kind=any(p_kinds) and state='pending' and next_attempt_at<=now() and (worker_until is null or worker_until<now()) order by next_attempt_at,id for update skip locked limit 1)
  returning *;
$$;
revoke all on function public.booking_claim_job(text[],uuid) from public,anon,authenticated;
grant execute on function public.booking_claim_job(text[],uuid) to service_role;

-- An AI job can make at most one paid attempt, including ambiguous timeouts.
-- The global daily ceiling is twenty attempts; no provider key means no call.
create function public.booking_start_brief(p_id uuid,p_worker uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare job public.booking_jobs; used integer;
begin
  select * into job from public.booking_jobs where id=p_id and worker_id=p_worker and kind='briefing' and state='pending' for update;
  if job.id is null or coalesce((job.result->>'started')::boolean,false) then return false; end if;
  insert into public.booking_ai_budget(day,hits) values(current_date,0) on conflict do nothing;
  select hits into used from public.booking_ai_budget where day=current_date for update;
  if used>=20 then return false; end if;
  update public.booking_ai_budget set hits=hits+1 where day=current_date;
  update public.booking_jobs set result=jsonb_build_object('started',true) where id=p_id;
  return true;
end $$;
revoke all on function public.booking_start_brief(uuid,uuid) from public,anon,authenticated;
grant execute on function public.booking_start_brief(uuid,uuid) to service_role;
