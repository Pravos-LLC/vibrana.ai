// Copy for the form spam guard (lib/form-guard). Visitors only see these when a
// request is rejected visibly: an expired form or a per-network rate limit. Bots
// and per-email limits get a normal success response and never reach this file.
export const FORM_GUARD_MESSAGES = {
  expired: 'This form has expired. Please refresh the page and try again.',
  rateLimited: 'Too many submissions from your network. Please try again later.',
  invalidEmail: 'Enter a valid email address.',
  /** Accessible name of the hidden honeypot input. Never shown to people. */
  honeypotLabel: 'Leave this field empty',
} as const
