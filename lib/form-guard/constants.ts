/**
 * Shared names for the anti-spam fields every public form sends.
 * Kept dependency-free so both the client hook and the server guard can import it.
 */

/** Hidden honeypot input. Real people never see or fill it; naive bots fill every input. */
export const HONEYPOT_FIELD = '_gotcha';

/** Signed render-timestamp token issued by GET /api/form-token. */
export const TOKEN_FIELD = '_ft';

/** Where the client fetches a fresh token. */
export const FORM_TOKEN_ENDPOINT = '/api/form-token';

/** A token older than this is rejected (visible "please refresh" error, not a silent drop). */
export const TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Allow a little clock skew between function instances. */
export const TOKEN_FUTURE_SKEW_MS = 30 * 1000;

/** Cloudflare Turnstile response token, sent by forms that opt in (see GuardConfig.turnstile). */
export const TURNSTILE_FIELD = '_ts';
