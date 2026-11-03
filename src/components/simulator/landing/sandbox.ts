/**
 * The hero sandbox's glue to the real engine. No math lives here: every number comes from
 * `simulate` in src/lib/simulator/engine.ts, read the same way the dashboard and the sample
 * preview read it (headline ranges at month 12). This file only picks the inputs and the
 * fields to show.
 */
import { simulate } from '@/src/lib/simulator/engine'
import { formatMoneyRange, formatPercent } from '@/src/lib/simulator/format'
import type { Pace, SectorId, SimulatorInputs, SimulatorResult } from '@/src/lib/simulator/types'
import { SAMPLE_INPUTS } from '../SamplePreview'

export type Sandbox = { sector: SectorId; people: number; pace: Pace }

/** The sample insurer the page has always shown: 240 people at a steady pace. */
export const SANDBOX_DEFAULT: Sandbox = { sector: 'insurance', people: 240, pace: 'steady' }

/** Sector chips shown up front; "More sectors" opens the rest (deck §1). */
export const SANDBOX_SECTORS: readonly SectorId[] = ['insurance', 'financial-services', 'professional-services', 'software', 'healthcare']

/** Slider stops: one per notch, so every value is a round company size. 240 is the sample. */
export const PEOPLE_STOPS = [
  20, 30, 40, 50, 60, 80, 100, 120, 150, 180, 200, 240, 300, 350, 400, 500, 600, 750, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000,
] as const

/** Each pace chip sits on the engine's calibrated curve for that label (assumptions.ts ADOPTION). */
export const PACE_TARGET: Record<Pace, number> = { cautious: 0.6, steady: 0.8, ambitious: 0.92 }

/**
 * Inputs held fixed in the preview: two providers, a $50 ceiling, internal data, US pay levels.
 * SIM_MINI.howBody states exactly these; change both together.
 */
export const SANDBOX_FIXED = {
  providers: SAMPLE_INPUTS.providers,
  cap: SAMPLE_INPUTS.cap,
  dataRule: SAMPLE_INPUTS.dataRule,
  region: 'us',
} as const

export function sandboxInputs(s: Sandbox): SimulatorInputs {
  return {
    domain: null,
    headcount: s.people,
    sector: s.sector,
    providers: [...SANDBOX_FIXED.providers],
    cap: SANDBOX_FIXED.cap,
    dataRule: SANDBOX_FIXED.dataRule,
    pace: s.pace,
    adoptionTarget: PACE_TARGET[s.pace],
    overrides: { region: SANDBOX_FIXED.region },
  }
}

export function runSandbox(s: Sandbox): SimulatorResult {
  return simulate(sandboxInputs(s))
}

export type SandboxOutputs = {
  /** Extra capacity a year at the month-12 pace: the dashboard's monthly capacity value times 12. */
  capacity: { low: number; high: number; text: string }
  runCost: { low: number; high: number; text: string }
  /** Hours freed at month 12 as a share of all working hours that month. */
  timeFreed: { low: number; high: number; text: string }
}

export function sandboxOutputs(r: SimulatorResult): SandboxOutputs {
  const h = r.headline
  const cap = { low: h.capacityValue.low * 12, high: h.capacityValue.high * 12 }
  const run = { low: h.runCost.low, high: h.runCost.high }
  const hours = r.inputs.headcount * r.resolved.workingHoursPerMonth
  const freed = { low: h.hoursFreed.low / hours, high: h.hoursFreed.high / hours }
  return {
    capacity: { ...cap, text: formatMoneyRange(cap, 'USD', { compact: true }) },
    runCost: { ...run, text: formatMoneyRange(run, 'USD', { compact: true }) },
    timeFreed: { ...freed, text: `${formatPercent(freed.low, 1)} to ${formatPercent(freed.high, 1)}` },
  }
}

export const isSample = (s: Sandbox) => s.sector === SANDBOX_DEFAULT.sector && s.people === SANDBOX_DEFAULT.people && s.pace === SANDBOX_DEFAULT.pace

/** The nearest slider stop to a company size. */
export function nearestStop(n: number): number {
  return PEOPLE_STOPS.reduce((best, v) => (Math.abs(v - n) < Math.abs(best - n) ? v : best), PEOPLE_STOPS[0])
}

/**
 * What "Run it on your company" hands the form: nothing unless the visitor actually played. An
 * untouched sandbox is the sample insurer, and pre-filling 240 people into a lead form would
 * record a size the visitor never gave. Returning to the exact sample counts as untouched too.
 */
export function sandboxSeed(s: Sandbox, touched: boolean): { sector: SectorId; headcount: number; adoptionTarget: number } | undefined {
  if (!touched || isSample(s)) return undefined
  return { sector: s.sector, headcount: s.people, adoptionTarget: PACE_TARGET[s.pace] }
}
