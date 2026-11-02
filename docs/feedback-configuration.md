# Feedback configuration

The general form is built in and served at `/feedback` in every environment. It carries no client identity and needs no configuration. The rest of this page covers optional client-specific forms at `/feedback/<slug>`.

Set real `FEEDBACK_FORMS_JSON` only in the Production server environment. Hosted Preview and Development contexts reject it, even if supplied. Its strict envelope is `{ "schema": 1, "forms": { "form-slug": FeedbackFormConfig } }`; the form shape is defined in `src/feedback-content.ts` and validated in `lib/feedback/forms.ts`. Use the synthetic fixture there as a structural example, and configure real forms privately. Never commit deployed form identities or private configuration.

The dynamic page and POST route read the same current envelope. A missing hosted configuration exposes no forms. Malformed configuration fails closed; errors never include configuration values. Local development and tests alone can use the synthetic sample when no envelope is set; isolated browser tests explicitly supply a synthetic envelope. Set `thankYou.connectUrl` to an HTTPS URL if a connection button is desired; otherwise it is omitted.

Responses have no invitation-token attribution. Optional contact fields are voluntary. Quote consent is offered only at or above the configured score gate (minimum 8); only `anonymous_quote` is stored. A stale consent version returns HTTP 409 without saving, and the browser retains its draft for retry. Keep the rendered privacy promise and versioned consent wording aligned. Update the consent snapshot fingerprint test whenever that wording changes. Existing nullable legacy attribution columns remain unused.

The production anonymous route intentionally exposes its selected form's display fields to respondents. The server envelope and other forms remain private. No per-head environment pin is required. Use `FEEDBACK_NOTIFY_EMAIL` (or the existing `ADMIN_EMAIL` fallback) for one internal notification after a save; `FROM_EMAIL` controls the sender. Keep actual addresses and credentials out of public fixtures and documentation. A notification failure does not undo a saved response, and no email is sent to the respondent. See [operations](operations.md) for release ownership and production/preview isolation.

## Backdrop and thank-you screen

The form sits on a timed carousel of seven city photos (`src/feedback-backdrops.ts`, `src/components/feedback/FeedbackBackdrop.tsx`). The server picks the starting city per request, each slide has its own prism tint (hue falls from violet to amber across the set while the glow moves left to right), and dots near a fine pointer pick up the slide's hue. Under `prefers-reduced-motion` the start photo stays still and the pointer glow is off.

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

The thank-you screen mirrors the AI Build Sprint brief result: a booking card with John's photo and a call link (`SPRINT_FIT_CALL_URL`), plus three link cards. The card thumbnails in `public/assets/feedback/card-*.webp` are the pages' share images scaled to 640 px wide (the share PNGs are about 590 KB each).
