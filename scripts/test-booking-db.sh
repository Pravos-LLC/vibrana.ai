#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="vibrana-booking-test-$$"
failure_log=$(mktemp)
cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; rm -f "$failure_log"; }
trap cleanup EXIT
# Disposable local database; no host port, production credentials, or shared data.
docker run --rm -d --name "$container" -e POSTGRES_PASSWORD=local-test-only postgres:17-alpine >/dev/null
for attempt in $(seq 1 30); do
  # The image starts a Unix-socket-only bootstrap server, then replaces it.
  # Waiting for TCP avoids racing that temporary server on faster CI runners.
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
psql_test() { docker exec -i -e PGPASSWORD=local-test-only "$container" psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 "$@"; }
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
set application_name='booking-concurrency-first';
select public.booking_reserve(public.booking_test_input('10000000-0000-4000-8000-000000000001'), (select schedule from public.booking_hosts where id='john'));
select pg_sleep(3);
commit;
SQL
first=$!
observed=false
for attempt in $(seq 1 30); do
  if [[ "$(psql_test -Atc "select count(*) from pg_stat_activity where application_name='booking-concurrency-first' and wait_event='PgSleep'")" == 1 ]]; then observed=true; break; fi
  sleep 0.1
done
if [[ "$observed" != true ]]; then echo 'FAIL: first reservation did not hold its transaction open' >&2; exit 1; fi
if psql_test <<'SQL' >/dev/null 2>"$failure_log"
select public.booking_reserve(public.booking_test_input('10000000-0000-4000-8000-000000000002'), (select schedule from public.booking_hosts where id='john'));
SQL
then
  echo 'FAIL: two overlapping reservations succeeded' >&2
  exit 1
fi
if ! rg -q 'slot_taken' "$failure_log" 2>/dev/null && ! grep -q 'slot_taken' "$failure_log"; then
  echo 'FAIL: second reservation did not fail for the expected overlap' >&2
  exit 1
fi
wait "$first"
psql_test <<'SQL'
do $$ begin
  if (select count(*) from public.booking_reservations where status <> 'cancelled') <> 1 then raise exception 'Expected exactly one concurrent reservation'; end if;
end $$;
SQL
echo 'Booking database checks passed: permissions, invitation limits, overlap, movement, configuration revisions, concurrency.'
