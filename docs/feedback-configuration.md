# Feedback configuration

The general form is built in and served at `/feedback` in every environment. It carries no client identity and needs no configuration. The rest of this page covers optional client-specific forms at `/feedback/<slug>`.

Set real `FEEDBACK_FORMS_JSON` only in the Production server environment. Hosted Preview and Development contexts reject it, even if supplied. Its strict envelope is `{ "schema": 1, "forms": { "form-slug": FeedbackFormConfig } }`; the form shape is defined in `src/feedback-content.ts` and validated in `lib/feedback/forms.ts`. Use the synthetic fixture there as a structural example, and configure real forms privately. Never commit deployed form identities or private configuration.

The dynamic page and POST route read the same current envelope. A missing hosted configuration exposes no forms. Malformed configuration fails closed; errors never include configuration values. Local development and tests alone can use the synthetic sample when no envelope is set; isolated browser tests explicitly supply a synthetic envelope. Set `thankYou.connectUrl` to an HTTPS URL if a connection button is desired; otherwise it is omitted.

Responses have no invitation-token attribution. Optional contact fields are voluntary. The public testimonial question is offered only at or above the configured score gate (minimum 8), as its own question after the written answers and before the contact step. A Yes opens a short testimonial step (fresh text, a credit choice: name and company, company only, or anonymous) and the contact step then requires an email, because the exact wording is always confirmed with the person before it is used. Only the testimonial decision, credit choice and text are stored with the consent record; private answers are never published from this form. A stale consent version returns HTTP 409 without saving, and the browser retains its draft for retry. Keep the rendered privacy promise and versioned consent wording aligned. Update the consent snapshot fingerprint test whenever that wording changes. Existing nullable legacy attribution columns remain unused.

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

The thank-you screen (on the flat dark surface) mirrors the AI Build Sprint brief result: a booking card with John's photo and a call link (`SPRINT_FIT_CALL_URL`), plus three link cards. The card thumbnails in `public/assets/feedback/card-*.webp` are each page's own imagery, cropped to 600 x 315 (the share images are one template with the same collage on every page, so they made three identical cards): the team at a sticky-note wall for the AI Readiness Assessment, the pocket watch from the EU AI Act page's own set, and the prototype laptop for the Simulator. Keep each under 40 KB.

## Spam and abuse protection

`/api/feedback` is a public endpoint behind one shared link, so it layers several guards (shared policy in `lib/form-guard/server.ts`, see `docs/form-protection.md`):

1. **Same-origin only.** A POST whose `Origin` host differs from the request host is refused with 403.
2. **Honeypot.** A filled hidden field is a silent success for the bot, with nothing saved.
3. **Signed render token with a five-second minimum fill time.** Missing, forged or too-fast tokens are a retryable error and never a fake success, so a real person keeps their draft.
4. **Vercel BotID** on `POST /api/feedback` (`instrumentation-client.ts`).
5. **Per-IP and per-token limits:** 20 an hour and 60 a day per IP, 6 a day per token.
6. **Link limit.** More than two links across all free text, the contact fields and the testimonial is refused with a visible 400 so a real person can remove them and resend.
7. **Shared budgets** that cap a flood spread over many IPs: at most 200 saves a day (a retryable 429 after that) and at most 20 notification emails an hour (past that the row is still saved and the email is skipped, with a log line).
8. **Size and shape.** 32 KB body cap, strict schemas, per-field length limits, a client-supplied submission id so a retry cannot double-save, and the respondent's text is escaped in the notification email.

The rate-limit layers need the `form_rate_limit_hit` function (`supabase/migrations/20260929120000_form_rate_limits.sql`). If it is missing they fail open and log `[form-guard] Rate-limit RPC failed`; check production logs for that line after any database change. A Cloudflare Turnstile challenge is supported by the guard (set `turnstile: true` on the endpoint and the Turnstile keys) but is off for this form; BotID is the bot check.
