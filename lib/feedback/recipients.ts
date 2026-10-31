import 'server-only'

// Only synthetic public fixtures live here. Real invitation tokens and identities
// are supplied through FEEDBACK_RECIPIENTS_JSON on the server, never browser code.
export type FeedbackRecipient = { name: string; role?: string }
type RecipientForms = Record<string, Record<string, FeedbackRecipient>>

const SAMPLE_RECIPIENTS: RecipientForms = {
  'sample-feedback': {
    'demo-reviewer-01': { name: 'ReviewerOne' },
    'demo-reviewer-02': { name: 'ReviewerTwo' },
    'demo-reviewer-03': { name: 'ReviewerThree' },
  },
}
const SAMPLE_TOKENS = new Set(Object.values(SAMPLE_RECIPIENTS).flatMap(Object.keys))
const TOKEN_PATTERN = /^[a-z0-9_-]{1,32}$/
const PRIVATE_TOKEN_PATTERN = /^[a-z0-9_-]{16,32}$/
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/
const RESERVED = new Set(['__proto__', 'constructor', 'prototype'])

function localSamplesAllowed(): boolean {
  return (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
    && !process.env.VERCEL && !process.env.VERCEL_ENV
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function invalid(): never {
  // Never include configuration values or parser exceptions in errors.
  throw new Error('Invalid FEEDBACK_RECIPIENTS_JSON configuration')
}

function displayText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value)
}

function recipients(): RecipientForms {
  if (typeof window !== 'undefined') throw new Error('Feedback recipients are server-only')
  const raw = process.env.FEEDBACK_RECIPIENTS_JSON
  if (!raw?.trim()) return localSamplesAllowed() ? SAMPLE_RECIPIENTS : Object.create(null)
  if (raw.length > 32_768) invalid()
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { invalid() }
  if (!record(parsed) || parsed.schema !== 1 || !record(parsed.forms)
    || Object.keys(parsed).some((key) => !['schema', 'forms'].includes(key))) invalid()
  const entries = Object.entries(parsed.forms)
  if (entries.length > 50) invalid()
  const forms: RecipientForms = Object.create(null)
  for (const [slug, table] of entries) {
    if (!SLUG_PATTERN.test(slug) || RESERVED.has(slug) || !record(table)) invalid()
    const people = Object.entries(table)
    if (people.length > 200) invalid()
    const recipients: Record<string, FeedbackRecipient> = Object.create(null)
    for (const [token, person] of people) {
      if (!PRIVATE_TOKEN_PATTERN.test(token) || RESERVED.has(token) || !record(person)
        || Object.keys(person).some((key) => !['name', 'role'].includes(key))
        || !displayText(person.name, 120)
        || (person.role !== undefined && !displayText(person.role, 160))
        || (!localSamplesAllowed() && SAMPLE_TOKENS.has(token))) invalid()
      recipients[token] = { name: person.name, ...(person.role !== undefined && { role: person.role }) }
    }
    forms[slug] = recipients
  }
  return forms
}

/** Lowercases and validates a raw query token. It never resolves a person by name. */
export function sanitizeToken(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  const token = value.trim().toLowerCase()
  return TOKEN_PATTERN.test(token) ? token : null
}

export function resolveRecipient(slug: string, rawToken: unknown): { token: string | null; recipient: FeedbackRecipient | null } {
  const table = recipients()[slug]
  const token = sanitizeToken(rawToken)
  const recipient = token && table && Object.prototype.hasOwnProperty.call(table, token) ? table[token] : null
  return recipient ? { token, recipient } : { token: null, recipient: null }
}

/** Server-side invitation lookup; browser output never includes this mapping. */
export function tokenFor(slug: string, name: string): string | null {
  const table = recipients()[slug] ?? {}
  return Object.keys(table).find((token) => table[token].name === name) ?? null
}
