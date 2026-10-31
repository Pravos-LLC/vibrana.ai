# Feedback configuration

Set `FEEDBACK_FORMS_JSON` only in the server environment. Its strict envelope is `{ "schema": 1, "forms": { "form-slug": FeedbackFormConfig } }`; the form shape is defined in `src/feedback-content.ts` and validated in `lib/feedback/forms.ts`. Use the synthetic fixture there as a structural example, and configure real forms privately. Never commit deployed form identities or private configuration.

The dynamic page and POST route read the same current envelope. A missing hosted configuration exposes no forms. Malformed configuration fails closed; errors never include configuration values. Local development and tests alone can use the synthetic sample when no envelope is set. Set `thankYou.connectUrl` to an HTTPS URL if a connection button is desired; otherwise it is omitted.

Responses have no invitation-token attribution. Optional contact fields are voluntary. Quote consent is offered only at or above the configured score gate (minimum 8); only `anonymous_quote` is stored. A stale consent version returns HTTP 409 without saving, and the browser retains its draft for retry. Keep the rendered privacy promise and versioned consent wording aligned. Update the consent snapshot fingerprint test whenever that wording changes. Existing nullable legacy attribution columns remain unused.
