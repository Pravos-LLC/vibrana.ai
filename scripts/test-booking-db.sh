#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="vibrana-booking-test-$$"
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
trap cleanup EXIT
# Disposable local database; no host port, production credentials, or shared data.
docker run --rm -d --name "$container" -e POSTGRES_PASSWORD=local-test-only postgres:17-alpine >/dev/null
for attempt in $(seq 1 30); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
psql_test() { docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 "$@"; }
psql_test <<'SQL'
create role anon;
create role authenticated;
create role service_role bypassrls;
grant usage on schema public to service_role, anon, authenticated;
-- A historical paid-booking table must coexist with the new scheduling module.
create table public.bookings (id uuid primary key, product text);
insert into public.bookings values ('90000000-0000-4000-8000-000000000001', 'legacy-sentinel');
SQL
psql_test < supabase/migrations/20261102124352_booking_scheduler.sql
psql_test < tests/sql/booking.sql
psql_test < tests/sql/booking-jobs.sql
# Two connections compete while the first transaction retains the host row lock.
psql_test <<'SQL' >/dev/null &
begin;
select public.booking_reserve(public.booking_test_input('10000000-0000-4000-8000-000000000001'), (select schedule from public.booking_hosts where id='john'));
select pg_sleep(2);
commit;
SQL
first=$!
sleep 0.5
if psql_test <<'SQL' >/dev/null 2>&1
select public.booking_reserve(public.booking_test_input('10000000-0000-4000-8000-000000000002'), (select schedule from public.booking_hosts where id='john'));
SQL
then
  echo 'FAIL: two overlapping reservations succeeded' >&2
  exit 1
fi
wait "$first"
psql_test <<'SQL'
do $$ begin
  if (select count(*) from public.booking_reservations where status <> 'cancelled') <> 1 then raise exception 'Expected exactly one concurrent reservation'; end if;
end $$;
SQL
echo 'Booking database checks passed: permissions, invitation limits, overlap, movement, configuration revisions, concurrency.'
