# Booking setup and operations

The app lives at `/book`, with host settings at `/book/settings` and management links at `/book/manage#id=…&token=…`. Host-conditioned rewrites also provide `/`, `/john` and `/abe` on `book.vibrana.ai`. The main website homepage is unchanged.

## Included

- John and Abe each connect one or more Google accounts, select conflict calendars, and choose one writable destination calendar. The destination must also be checked for conflicts. Abe starts paused until he enables his schedule.
- Default public hours are weekdays 14:00–19:00 Asia/Makassar. Private invitations use weekdays 08:00–11:00. Both schedules, the host timezone and date exceptions are editable. Exceptions replace hours on that date for both schedules, including a whole-day closure.
- Meetings last 30 minutes, with 15 minutes between meetings, 12 hours' notice, and a 30-day booking horizon. Guest times include their date and timezone; calendar dates are explicitly labeled with the host timezone.
- Private invitations are date-limited, expire within 30 days, can be revoked, and authorize one booking over their lifetime. Cancellation does not restore the link. An optional recipient restriction compares the submitted email address; it does not verify email ownership. An unrestricted link is a bearer credential and can be forwarded.
- Google sends calendar invitations and updates with Meet and management links. Guests can cancel or reschedule. A pending meeting can also be canceled while calendar recovery completes.
- Confirmation offers a relevant link from a fixed library: the readiness assessment, team learning, or case studies. Booking pages reuse statements from existing published case studies; no new testimonial, quote or result is invented.
- CRM sync and optional private AI preparation run through durable jobs separately from booking. They do not enroll visitors in marketing or change sales stages.

Before setup is complete, guests see a contact option rather than fictional available times. The configuration endpoint exposes only readiness and the public canonical origin. Host and management credentials never enter query strings, telemetry is suppressed on booking routes/the booking hostname, and responses use no-referrer/no-store/noindex policies. A private URL fragment remains visible to its recipient and their browser; keep management links private.

## Final setup checklist

Complete this after the code review, using your own production configuration. Public CI and local tests must keep using synthetic services.

1. **Database:** apply only the reviewed forward migration `supabase/migrations/20261102124352_booking_scheduler.sql` to the existing Supabase database. Use a transaction and the normal reviewed migration procedure. Do not replay sanitized historical migrations, reset production, or run a blind history push. The migration depends on the existing `form_rate_limit_hit` RPC. It creates new `booking_*` tables; historical paid `bookings` records are untouched. Verify RLS, grants and service-role RPC access after applying it.
2. **Domain:** attach `book.vibrana.ai` to the existing website project and configure DNS/TLS. Do not activate a different preview project as production.
3. **Google:** enable Calendar API in a suitable Google Cloud project and create a web OAuth client. Register exactly `https://book.vibrana.ai/api/booking/callback`. Configure the consent screen, privacy URL and internal/external audience for the actual host accounts. Complete applicable verification before relying on long-lived offline access; temporary testing-mode access is not a production setup.
4. **Server variables:** set the required names below in the production provider environment. Keep secrets outside public Git. Create a dedicated encryption key and retain it securely across releases. If using `.env.local` for a private local check, it must remain ignored; never paste a plaintext key into an issue or a PR.
5. **Hosts:** each host visits `/book/settings` and signs in with the exact approved primary Google account. Connect any additional accounts, select conflict calendars and a destination, save, then enable bookings. An obsolete account can be excluded from new availability by clearing its selection; existing bookings still need access to their original destination for management.
6. **Recovery:** configure a trusted scheduler to GET `https://book.vibrana.ai/api/booking/reconcile` every five minutes with an `Authorization: Bearer <CRON_SECRET>` header. This recovers one due calendar operation and one due integration job in parallel per run. No scheduler is activated by this PR. Watch the queue and address repeated failures.
7. **Optional integrations:** enable CRM/briefing only after their credentials, permissions and schema/model choices are configured. Hosts can see queued/delivered/attention states and private briefings in settings. CRM jobs needing attention can be queued again without changing record IDs.
8. **Live acceptance:** with the hosts' consent, book a real test meeting for each host. Check Google invitation/Meet creation, a busy event on a second calendar, cancel, reschedule, public afternoon boundaries and private morning restrictions. Test a revoked and used private link. Verify CRM/briefing only if enabled, then clean up the test records through the relevant service's normal controls.

This work opens a PR; it does not merge, deploy, configure provider accounts or make real calendar/CRM/email calls during tests.

## Environment reference

Required server-only configuration:

| Name | Purpose |
| --- | --- |
| `BOOKING_ORIGIN` | Exact canonical origin, normally `https://book.vibrana.ai`, with no path/query/fragment |
| `BOOKING_GOOGLE_CLIENT_ID` | Web OAuth client ID |
| `BOOKING_GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `BOOKING_ENCRYPTION_KEY` | Dedicated 32 random bytes encoded as base64 |
| `BOOKING_JOHN_EMAIL` | John's exact primary Google sign-in identity |
| `BOOKING_ABE_EMAIL` | Abe's exact primary Google sign-in identity |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Existing server database access |
| `CRON_SECRET` | Bearer credential for the recovery scheduler |

At least one host identity is needed for readiness; configure both to support both hosts. Additional calendar accounts require an existing primary host session. Google scopes are `openid`, `email`, `calendar.calendarlist.readonly`, `calendar.events.freebusy` and `calendar.events`. Event permission covers creating/managing meetings and the destination-calendar timing reads needed to exclude our own event safely during rescheduling.

Optional server-only integrations are off until explicitly enabled:

| Name | Purpose |
| --- | --- |
| `BOOKING_CRM_ENABLED=1` | Enable durable Twenty CRM processing |
| `BOOKING_CRM_URL` | Trusted HTTPS Twenty origin or `/graphql` endpoint |
| `BOOKING_CRM_API_KEY` | Scoped key for person lookup/create, note lookup/create and note-target lookup/create |
| `BOOKING_BRIEFING_ENABLED=1` | Enable briefing jobs for visitors who opted in |
| `BOOKING_BRIEFING_MODEL` | Your approved open-weight OpenRouter model supporting structured output |
| `OPENROUTER_API_KEY` | Existing server model access |

`node --env-file=.env.local scripts/booking-check.mjs` checks local configuration by name and format without printing values. It never connects to Google, CRM, a model, or a database. Local development permits `http://localhost:<port>` outside production. Use a separate registered local OAuth callback; never weaken the production origin or credential checks for a preview. The primary website redirects a configured booking session to the canonical booking origin before it submits credentials.

Changing the encryption key without migrating stored ciphertext breaks calendar/management recovery and host sessions. A proper rotation needs a reviewed re-encryption procedure; do not rotate it as a routine deployment step.

## Reliability and integration boundaries

The database serializes host reservations/configuration changes and prevents overlapping app-originated bookings, including buffers and pending moves. Invitation use is atomic. Deterministic Google event IDs recover lost create responses; uncertain operations remain reserved. Leases prevent concurrent recovery of the same meeting. Unknown reservation RPC failures retain the guest's original credential. A persisted retry time prevents a broken account from monopolizing recovery. Meet creation is asynchronous; confirmation waits for its link, and definitive conference failures get a new persisted request ID.

Google and PostgreSQL cannot share an atomic transaction: someone can manually edit a calendar immediately after an availability check. Manage scheduled meetings through the app's management link. General synchronization of externally edited event times is not implemented. A revoked connection hides affected availability; old meetings retain their original destination. Calendar/provider failures must be repaired rather than silently treating the host as free.

Lifecycle changes atomically enqueue immutable integration snapshots. CRM deduplicates by primary email, creates an inbound person only when absent, and adds a separate note for booking/reschedule/cancel events. Deterministic person/note/target IDs and readback handle ambiguous creates. Existing person fields and human-edited notes are never overwritten; ambiguous matches and persistent failures need attention. Alias/secondary-email identity merging is deliberately not automatic. No sales-stage update, prospect scoring, outbound sequence or marketing subscription is performed.

AI receives only visitor-provided meeting notes, with an explicit optional checkbox; it does not receive the booking name/email fields or existing CRM records. Output is a private draft, rendered as text. Suggestions must be verified by the host. Each job gets at most one paid attempt, including uncertain timeouts, with a global ceiling of twenty attempts per database day, 320 output tokens and 2,000 input characters. Invalid output, budget exhaustion and interrupted attempts fall back to the original notes. CRM failures retry at most five times before host attention; a host can explicitly queue CRM work again. Briefing work cannot use that retry control to repeat a paid attempt.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run guardrail`, `npm run test:coverage`; thresholds are not lowered.
- `bash scripts/test-booking-db.sh`: disposable PostgreSQL 17 container, no published ports or shared data; tests historical-table coexistence, RLS/grants, invitation consumption, real concurrent reservations, durable jobs, worker claims and the AI budget. Containers use `--rm` and a cleanup trap. No image is built.
- Full local migration replay, schema lint and `supabase test db`. Every new public table is seeded inside the existing rolled-back access tests so the global anonymous/authenticated/forged-owner/owner sweeps are meaningful.
- Full production build and repository Playwright suite against local services. Focused UI checks can also run with `npx playwright test --config playwright.booking.config.ts` after building. Booking provider APIs are intercepted, and no real invitations or integrations are sent.
- Independent exact-head adversarial review and the required public-repository CI before release. Private provenance/reports remain outside product Git. New wording is functional UI microcopy; proof statements are reused from published source, not newly authored claims.
