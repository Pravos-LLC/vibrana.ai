#!/usr/bin/env bash
# Print `export` lines for the E2E environment. Used by CI and locally:
#
#   eval "$(bash scripts/e2e-env.sh)"            # Supabase started from ./supabase
#   eval "$(bash scripts/e2e-env.sh <workdir>)"  # Supabase started with --workdir <workdir>
#
# The Supabase URL and service key come from the running local stack. Resend
# points at e2e/stub-server.mjs. OpenRouter and Firecrawl are left empty,
# so those features skip themselves. No production credential is used.
set -euo pipefail

WORKDIR="${1:-.}"
STUB_PORT="${STUB_PORT:-4217}"
APP_PORT="${E2E_APP_PORT:-3217}"

status="$(supabase status --workdir "$WORKDIR" -o env 2>/dev/null)"
api_url="$(printf '%s\n' "$status" | sed -n 's/^API_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')"
service_key="$(printf '%s\n' "$status" | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')"

if [ -z "$api_url" ] || [ -z "$service_key" ]; then
  echo "echo 'e2e-env: local Supabase is not running (supabase start)' >&2; false"
  exit 1
fi

cat <<EOF
export SUPABASE_URL='$api_url'
export SUPABASE_SERVICE_KEY='$service_key'
export RESEND_API_KEY='re_e2e_placeholder'
export RESEND_BASE_URL='http://localhost:$STUB_PORT'
export RESEND_WEBHOOK_SECRET='whsec_e2e_placeholder'
export CRON_SECRET='e2e-cron-secret'
export ADMIN_EMAIL='e2e-admin@example.test'
export OPENROUTER_API_KEY=''
export FIRECRAWL_API_KEY=''
export NEXT_PUBLIC_APP_URL='http://localhost:$APP_PORT'
export NEXT_PUBLIC_BASE_URL='http://localhost:$APP_PORT'
export STUB_PORT='$STUB_PORT'
export E2E_APP_PORT='$APP_PORT'
export FORM_GUARD_MIN_FILL_MS='0'
EOF
