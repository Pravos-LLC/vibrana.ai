// Derived views of an EUProfile for the results page and the results email: which tier each
// obligation belongs to, the status tally, days until each date, the suggested first-90-days
// order and the penalty rows that relate to the answers. Pure and deterministic: every number
// here comes from the profile (dates from the obligation content, counted from `profile.asOf`).

import { EU_OBLIGATIONS, type ObligationDef, type ObligationId } from '@/src/eu-ai-act-obligations-content'
import type { EUTone } from '@/src/eu-ai-act-readiness-content'
import type { EUProfile, ObligationResult, ObligationStatus } from './engine'
import { orderObligations } from './order'

const DAY = 86_400_000

/** The tier each obligation belongs to: the same color it wears on the landing page. */
export const OBLIGATION_TONE: Record<ObligationId, EUTone> = {
  'prohibited-practices': 'prohibited',
  'ai-literacy': 'baseline',
  'inventory-classification': 'baseline',
  'role-clarity': 'baseline',
  'transparency-interaction': 'transparency',
  'transparency-content': 'transparency',
  'high-risk-deployer': 'high-risk',
  'inform-workers': 'high-risk',
  'inform-affected-people': 'high-risk',
  fria: 'high-risk',
  'provider-obligations': 'high-risk',
  'vendor-contracts': 'baseline',
  'accountable-owner': 'baseline',
}

/** The profile's risk tier as a pyramid tone ("minimal" sits in the baseline band). */
export function tierTone(tier: EUProfile['riskTier']): EUTone {
  return tier === 'minimal' ? 'baseline' : tier
}

export const STATUS_ORDER: readonly ObligationStatus[] = ['met', 'partial', 'gap', 'unanswered']

export interface ReportRow {
  result: ObligationResult
  def: ObligationDef
  tone: EUTone
  /** Days from `asOf` to the date it applies: negative once in force, null when undated. */
  days: number | null
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY)
}

/**
 * The profile's obligations in report order, joined to their content. Days and "in force" are
 * counted from `today` (ISO date; the page passes the real date, the email the assessment date).
 * A stored profile from an older build may name an obligation this build no longer has: it is
 * skipped.
 */
export function reportRows(profile: EUProfile, today: string = profile.asOf): ReportRow[] {
  return orderObligations(profile.obligations).flatMap((r) => {
    const def = EU_OBLIGATIONS.find((d) => d.id === r.id)
    if (!def) return []
    const result = { ...r, inForce: r.appliesFrom !== null && r.appliesFrom <= today }
    return [{ result, def, tone: OBLIGATION_TONE[def.id], days: r.appliesFrom ? daysBetween(today, r.appliesFrom) : null }]
  })
}

export function statusTally(rows: readonly ReportRow[]): Record<ObligationStatus, number> {
  const tally: Record<ObligationStatus, number> = { met: 0, partial: 0, gap: 0, unanswered: 0 }
  for (const r of rows) tally[r.result.status]++
  return tally
}

/** The soonest date still ahead that applies to this company, with its obligations. */
export function nextDate(rows: readonly ReportRow[]): { date: string; days: number; rows: ReportRow[] } | null {
  const ahead = rows.filter((r) => r.days !== null && r.days > 0)
  if (!ahead.length) return null
  const date = ahead.reduce((min, r) => (r.result.appliesFrom! < min ? r.result.appliesFrom! : min), ahead[0].result.appliesFrom!)
  const same = ahead.filter((r) => r.result.appliesFrom === date)
  return { date, days: same[0].days!, rows: same }
}

export type PlanPhase = 'now' | 'foundations' | 'next'

/**
 * The suggested first-90-days order (practitioner judgment, labeled as such on the page): open
 * items that already apply, then undated foundations, then what applies next, by date. Within a
 * phase a gap comes before a partial gap, and a possible prohibited practice always leads.
 */
export function actionPlan(profile: EUProfile, rows: readonly ReportRow[] = reportRows(profile)): Record<PlanPhase, ReportRow[]> {
  const open = rows.filter((r) => r.result.status !== 'met')
  const weight = (r: ReportRow) => (r.def.id === 'prohibited-practices' && profile.prohibitedFlag ? -1 : r.result.status === 'partial' ? 1 : 0)
  const byWeight = (a: ReportRow, b: ReportRow) => weight(a) - weight(b)
  return {
    now: open.filter((r) => r.result.inForce).sort(byWeight),
    foundations: open.filter((r) => r.result.appliesFrom === null).sort(byWeight),
    next: open.filter((r) => r.result.appliesFrom !== null && !r.result.inForce),
  }
}

/** Which penalty caps (EU_PENALTIES.tiers, in order) the answers point at. */
export function linkedPenalties(profile: EUProfile): [boolean, boolean, boolean] {
  return [profile.prohibitedFlag, profile.riskTier !== 'minimal', false]
}

/**
 * Which figure caps each fine (EU_PENALTIES.tiers, in order: Art. 99(3), 99(4), 99(5)) for the
 * size band. SMEs: the lower of the amount and the percentage for all three (Art. 99(6)). Small
 * mid-caps: the lower for 99(4) and 99(5) only (Art. 99(6a), inserted by Reg. (EU) 2026/1744); the
 * prohibited-practice fine keeps the higher. Unknown band: null, nothing is claimed.
 */
export function capRule(sizeBand: EUProfile['sizeBand']): ['lower' | 'higher', 'lower' | 'higher', 'lower' | 'higher'] | null {
  if (sizeBand === 'sme') return ['lower', 'lower', 'lower']
  if (sizeBand === 'smc') return ['higher', 'lower', 'lower']
  return null
}

/** Readiness bands, as the engine sets them: early below 45, advanced from 75. */
export const READINESS_BANDS = [
  { level: 'early', from: 0, to: 45 },
  { level: 'developing', from: 45, to: 75 },
  { level: 'advanced', from: 75, to: 100 },
] as const

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const oneOf = (x: unknown, xs: readonly string[]) => typeof x === 'string' && xs.includes(x)
const isoDate = (x: unknown) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)

/**
 * True when a stored report has every field the report reads, with values this build knows. A
 * report saved by an older or newer build that fails this shows the empty state, not a crash.
 */
export function isStoredReport(x: unknown): x is { profile: EUProfile; company: { name: string; email: string } } {
  if (!isObj(x) || !isObj(x.profile) || !isObj(x.company)) return false
  const p = x.profile
  const c = x.company
  return (
    typeof c.name === 'string' &&
    typeof c.email === 'string' &&
    isoDate(p.asOf) &&
    oneOf(p.scope, ['in-scope', 'likely', 'out-of-scope']) &&
    oneOf(p.role, ['deployer', 'builder', 'provider', 'model-provider', 'unknown']) &&
    oneOf(p.sizeBand, ['sme', 'smc', 'check']) &&
    oneOf(p.riskTier, ['high-risk', 'transparency', 'minimal']) &&
    oneOf(p.readinessLevel, ['early', 'developing', 'advanced']) &&
    typeof p.readinessScore === 'number' &&
    typeof p.prohibitedFlag === 'boolean' &&
    Array.isArray(p.highRisk) &&
    p.highRisk.every((h) => isObj(h) && oneOf(h.area, ['employment', 'credit-insurance', 'education', 'sensitive']) && oneOf(h.level, ['yes', 'pilot', 'planned'])) &&
    Array.isArray(p.sectionScores) &&
    p.sectionScores.every((s) => isObj(s) && typeof s.key === 'string' && typeof s.title === 'string' && (s.score === null || typeof s.score === 'number')) &&
    Array.isArray(p.obligations) &&
    p.obligations.length > 0 &&
    p.obligations.every((o) => isObj(o) && typeof o.id === 'string' && oneOf(o.status, STATUS_ORDER) && (o.appliesFrom === null || isoDate(o.appliesFrom)))
  )
}
