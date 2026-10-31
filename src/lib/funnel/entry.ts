/**
 * Front doors into the AI Readiness, EU AI Act Readiness and Build Sprint funnels
 * (docs/funnel-measurement.md). `eu-ai-act` is the /eu-ai-act-readiness landing page; `video` is
 * a link from a social video (?entry=video).
 *
 * The same values are stored in assessments.entry_point and funnel_events.entry_point (the
 * migration's CHECK constraints list them too) and sent as the `entry` property on every
 * Vercel Analytics funnel event. Pure: no window, no storage, so the server can validate with it.
 */
export const ENTRY_POINTS = ['landing', 'direct', 'roi', 'sprint', 'email', 'simulator', 'eu-ai-act', 'video'] as const
export type EntryPoint = (typeof ENTRY_POINTS)[number]

export function isEntryPoint(value: unknown): value is EntryPoint {
  return typeof value === 'string' && (ENTRY_POINTS as readonly string[]).includes(value)
}

/** A stored or submitted value, or null when it is missing or not one of ours. */
export function parseEntryPoint(value: unknown): EntryPoint | null {
  return isEntryPoint(value) ? value : null
}

/**
 * Which front door a visit came through, from the URL first, then what this browser tab
 * remembered from the landing page it saw, else `direct`:
 *   ?entry=<one of ENTRY_POINTS>        an explicit link (our emails use ?entry=email)
 *   ?from=simulator                     the simulator's prefilled assessment link
 *   utm_medium=email / utm_source=email a campaign email link
 *   remembered                          set by /ai-readiness, /eu-ai-act-readiness, /ai-build-sprint or /ai-build-sprint/roi
 */
export function resolveEntry(search: string, remembered: string | null | undefined): EntryPoint {
  const params = new URLSearchParams(search)
  const explicit = parseEntryPoint(params.get('entry'))
  if (explicit) return explicit
  if (params.get('from') === 'simulator') return 'simulator'
  const medium = (params.get('utm_medium') || '').toLowerCase()
  const source = (params.get('utm_source') || '').toLowerCase()
  if (medium === 'email' || source === 'email' || source === 'newsletter') return 'email'
  return parseEntryPoint(remembered) ?? 'direct'
}

/** Where a "Book a call" link sits. Stored in funnel_events.location (lowercase, digits, dashes). */
export const CALL_LOCATIONS = [
  'readiness-hero',
  'readiness-closing',
  'assessment-complete',
  'report',
  'roi-close',
  'sprint-form',
  'sprint-form-submit',
  'sprint-thank-you',
  'eu-ai-act-hero',
  'eu-ai-act-closing',
  'eu-ai-act-report',
] as const
export type CallLocation = (typeof CALL_LOCATIONS)[number]

export function isCallLocation(value: unknown): value is CallLocation {
  return typeof value === 'string' && (CALL_LOCATIONS as readonly string[]).includes(value)
}

/** A site link that tells the next page which front door it came through ("/x#y" -> "/x?entry=email#y"). */
export function withEntry(href: string, entry: EntryPoint): string {
  const hashAt = href.indexOf('#')
  const base = hashAt >= 0 ? href.slice(0, hashAt) : href
  const hash = hashAt >= 0 ? href.slice(hashAt) : ''
  return `${base}${base.includes('?') ? '&' : '?'}entry=${entry}${hash}`
}
