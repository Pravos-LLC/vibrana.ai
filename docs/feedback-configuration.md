# Feedback configuration

The general form is built in and served at `/feedback` in every environment. It carries no client identity and needs no configuration. The rest of this page covers optional client-specific forms at `/feedback/<slug>`.

Set real `FEEDBACK_FORMS_JSON` only in the Production server environment. Hosted Preview and Development contexts reject it, even if supplied. Its strict envelope is `{ "schema": 1, "forms": { "form-slug": FeedbackFormConfig } }`; the form shape is defined in `src/feedback-content.ts` and validated in `lib/feedback/forms.ts`. Use the synthetic fixture there as a structural example, and configure real forms privately. Never commit deployed form identities or private configuration.

The dynamic page and POST route read the same current envelope. A missing hosted configuration exposes no forms. Malformed configuration fails closed; errors never include configuration values. Local development and tests alone can use the synthetic sample when no envelope is set; isolated browser tests explicitly supply a synthetic envelope. Set `thankYou.connectUrl` to an HTTPS URL if a connection button is desired; otherwise it is omitted.

Responses have no invitation-token attribution. Optional contact fields are voluntary. The public testimonial question is offered only at or above the configured score gate (minimum 8), as its own question after the written answers and before the contact step. A Yes opens a short testimonial step (fresh text, a credit choice: name and company, company only, or anonymous). The Yes is the permission: contact details stay optional, and the contact step shows the optional `emailNote` (on the built-in form, a prompt to add a name for a named credit). `testimonialHint` and `emailNote` are optional; a form that leaves one out records nothing for it in the consent snapshot. Only the testimonial decision, credit choice and text are stored with the consent record; private answers are never published from this form. A stale consent version returns HTTP 409 without saving, and the browser retains its draft for retry. Keep the rendered privacy promise and versioned consent wording aligned. Update the consent snapshot fingerprint test whenever that wording changes. Existing nullable legacy attribution columns remain unused.

The production anonymous route intentionally exposes its selected form's display fields to respondents. The server envelope and other forms remain private. No per-head environment pin is required. Use `FEEDBACK_NOTIFY_EMAIL` (or the existing `ADMIN_EMAIL` fallback) for one internal notification after a save; `FROM_EMAIL` controls the sender. Keep actual addresses and credentials out of public fixtures and documentation. A notification failure does not undo a saved response, and no email is sent to the respondent. See [operations](operations.md) for release ownership and production/preview isolation.

## Backdrop and thank-you screen

The cover page sits on a timed carousel of seven city photos (`src/feedback-backdrops.ts`, `src/components/feedback/FeedbackBackdrop.tsx`). The server picks the starting city per request, each slide has its own prism tint (hue falls from violet to amber across the set while the glow moves left to right), and dots near a fine pointer pick up the slide's hue. The backdrop is for the cover only: it fades out when the form starts, the carousel and glow stop, and every later screen (questions, consent, contact, thank-you) is the flat dark surface, so nothing moves while someone answers. Under `prefers-reduced-motion` the start photo stays still and the pointer glow is off.

Photos are from [Unsplash](https://unsplash.com/?utm_source=vibrana&utm_medium=referral) and used under the Unsplash License. They are bundled as small webps in `public/assets/feedback/`, credited on screen (photographer and Unsplash, linked with referral parameters) and in this table:

| City | Photographer |
| --- | --- |
| Hong Kong | Steven Wei |
| London | David Monaghan |
| New York | Mike Chavarri |
| San Francisco | Juliann Hervio |
| Berlin | Norbert Braun |
| Barcelona | Taisia Karaseva |
| Lisbon | Tobias Reich |

To add or swap a photo, download the original through the Unsplash API (which registers the download), then process it once so no blur runs in the browser. Use a new filename, because `/assets/*` is served immutable:

```sh
magick original.jpg -resize 1600x -gaussian-blur 0x5 -modulate 88,100,100 -quality 68 -define webp:method=6 public/assets/feedback/bg-<city>.webp
```

Keep each file under 60 KB, add the slide to `src/feedback-backdrops.ts` with its hue and glow position, and check text contrast over the brightest slide.

The cover page signs off from John and the team, with each person's headshot (`public/assets/team/`) and first name under the welcome copy.

The thank-you screen (on the flat dark surface) mirrors the AI Build Sprint brief result: a booking card with John's photo and a call link (`SPRINT_FIT_CALL_URL`), four link cards and the team activity graph.

The four cards (AI Build Sprint brief, AI Readiness Assessment, EU AI Act Readiness, AI Transformation Simulator) show each tool's own report screen, in dark mode, filled with fictional sample data (Northwind Logistics, `scripts/eu-ai-act-report/northwind.ts`; never a real client). `public/assets/feedback/report-*.webp` are 1200 x 750. To recapture after a report changes, run `npm run dev`, then `npx playwright test -c scripts/feedback-report-mocks/playwright.config.ts`. The Build Sprint flow mocks its API calls, so nothing is sent anywhere.

The activity graph (`src/components/feedback/TeamActivity.tsx`) is a GitHub-style grid of the team's merged pull requests over the last 52 weeks. Its cells sweep in column by column and the total counts up the first time it is on screen (both off under `prefers-reduced-motion`). The data is a committed snapshot, `src/data/team-pr-activity.json`, holding only daily team totals: no repository names, titles or per-person numbers. Refresh it with `node scripts/team-pr-activity.mjs`, which uses the GitHub CLI's login and so counts every repository that account can see (private ones included). The team list is in the script.

## Spam and abuse protection

`/api/feedback` is a public endpoint behind one shared link, so it layers several guards (shared policy in `lib/form-guard/server.ts`, see `docs/form-protection.md`):

1. **Same-origin only.** A POST whose `Origin` host differs from the request host (compared case-insensitively) is refused with 403. `Origin: null` is treated as absent.
2. **Honeypot.** A filled hidden field is a silent success for the bot, with nothing saved.
3. **Signed render token with a five-second minimum fill time.** Missing, forged or too-fast tokens are a retryable error and never a fake success, so a real person keeps their draft.
4. **Vercel BotID** on `POST /api/feedback` (`instrumentation-client.ts`).
5. **Per-IP and per-token limits:** 20 an hour and 60 a day per IP, 6 a day per token.
6. **Link limit.** More than two links across all free text, the contact fields and the testimonial is refused with a visible 400 so a real person can remove them and resend.
7. **Shared budgets** that cap a flood spread over many IPs: at most 200 saves a day (a retryable 429 after that) and at most 20 notification emails an hour (past that the row is still saved and the email is skipped, with a log line and one alert email an hour so a flood is noticed).
8. **Size and shape.** 32 KB body cap, strict schemas, per-field length limits, a client-supplied submission id so a retry cannot double-save, and the respondent's text is escaped in the notification email.

The rate-limit layers need the `form_rate_limit_hit` function (`supabase/migrations/20260929120000_form_rate_limits.sql`). If it is missing they fail open and log `[form-guard] Rate-limit RPC failed`; check production logs for that line after any database change. A Cloudflare Turnstile challenge is supported by the guard (set `turnstile: true` on the endpoint and the Turnstile keys) but is off for this form; BotID is the bot check.
