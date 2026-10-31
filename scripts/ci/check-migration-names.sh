#!/usr/bin/env bash
# Every migration version must be a 14-digit timestamp (YYYYMMDDHHMMSS_name.sql).
# Short versions sort inconsistently against 14-digit ones, locally vs remote,
# which broke `supabase db push` for months (VIB-392). The files below predate
# this check and are recorded in production under their short versions; renaming
# them would need a history repair, so they are grandfathered. Add nothing here.
set -euo pipefail

cd "$(dirname "$0")/../../supabase/migrations"

GRANDFATHERED=(
  20260107_add_design_course.sql
  20260112_add_bot_interactions.sql
  20260113_add_contact_fields.sql
  20260209_create_bookings.sql
  20260210_booking_intake_and_emails.sql
  20260211_fix_security_definer_views_and_rls.sql
)

bad=0
for f in *.sql; do
  [[ "$f" =~ ^[0-9]{14}_[a-z0-9_]+\.sql$ ]] && continue
  if printf '%s\n' "${GRANDFATHERED[@]}" | grep -qxF "$f"; then continue; fi
  echo "::error file=supabase/migrations/$f::migration name must be <14-digit timestamp>_<snake_case>.sql (see VIB-392)"
  bad=1
done

# Versions must be unique.
dupes=$(ls *.sql | cut -d_ -f1 | sort | uniq -d)
if [[ -n "$dupes" ]]; then
  echo "::error::duplicate migration versions: $dupes"
  bad=1
fi

[[ $bad -eq 0 ]] && echo "migration names OK ($(ls *.sql | wc -l | tr -d ' ') files)"
exit $bad
