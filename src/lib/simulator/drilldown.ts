import type { Currency, FunctionId, SimulatorResult } from './types'
import { FUNCTIONS } from './types'
import {
  ADOPTION,
  DEPARTMENT_PAY,
  GOVERNANCE_TOOLS,
  GATEWAY_FEE,
  HOURLY_COST_SOURCES,
  PEOPLE_PER_WORKFLOW,
  SPEND_RESERVE,
  TRAINING_HOURS,
  WORKING_WEEKS,
  type Param,
} from './assumptions'
import { EVIDENCE, FUNCTION_PARAMS } from './benchmarks'
import { formatMoney, formatMoneyRange, formatPercent } from './format'
import { FX, SEAT_PRICES, midTier, type Source } from './prices'
import { DEFAULT_TOOLS, STACK, TOOLING, type ToolId } from './tooling'
import { SIM_DRILL, SIM_FUNCTION_LABELS, SIM_PACES, SIM_PROVIDER_LABELS } from '@/src/simulator-content'

export type DrillRow = {
  label: string
  value: string
  note?: string
  /** One or more links; empty means the row is our own assumption and says so. */
  sources: Source[]
}

export type DrillSection = { id: 'adoption' | 'pricing' | 'tooling' | 'labor' | 'benchmarks'; rows: DrillRow[] }

const d = SIM_DRILL

/** Dust customer stories the adoption curves are calibrated to (vendor-published, self-reported). */
const DUST = {
  alma: { label: 'Dust, Alma', url: 'https://dust.tt/customers/alma-scaled-ai-personal-productivity-to-company-infrastructure' },
  syxperiane: { label: 'Dust, SYXPERIANE', url: 'https://dust.tt/customers/syxperiane-achieved-ai-adoption' },
  paddle: { label: 'Dust, Paddle', url: 'https://dust.tt/customers/paddle-ai-strategy-achieved-91-company-wide-adoption' },
  applium: { label: 'Dust, Applium', url: 'https://dust.tt/customers/how-applium-reached-90-ai-adoption' },
} satisfies Record<string, Source>

const ADOPTION_SOURCES = { cautious: [], steady: [DUST.alma, DUST.syxperiane], ambitious: [DUST.paddle, DUST.applium] } satisfies Record<string, Source[]>

const sourcesOf = (p: Param<unknown>): Source[] => ('source' in p && p.source ? [p.source] : [])

/** The numbers behind the model, grouped, each with where it came from. Display only: nothing here feeds the engine. */
export function drilldown(result: SimulatorResult, currency: Currency): DrillSection[] {
  const r = result.resolved
  const pace = r.pace
  const money = (usd: number) => formatMoney(usd, currency)
  const central = (f: FunctionId) => FUNCTION_PARAMS[f]

  const adoption: DrillRow[] = [
    { label: d.adoption.ceiling, value: formatPercent(r.adoptionCurve.aMax), note: `${SIM_PACES[pace].label}. ${ADOPTION[pace].note}`, sources: ADOPTION_SOURCES[pace] },
    { label: d.adoption.halfway, value: d.adoption.months(Math.round(r.adoptionCurve.t0 * 10) / 10), note: d.adoption.halfwayNote, sources: [] },
    { label: d.adoption.perWorkflow, value: d.adoption.people(PEOPLE_PER_WORKFLOW[pace].value), note: PEOPLE_PER_WORKFLOW[pace].note, sources: [] },
    { label: d.adoption.training, value: d.adoption.hours(r.trainingHoursPerPerson), note: TRAINING_HOURS[pace].note, sources: [] },
  ]

  const pricing: DrillRow[] = result.inputs.providers.flatMap((p) => {
    const seat = SEAT_PRICES[p]
    const mid = midTier(p)
    return [
      { label: d.pricing.seat(SIM_PROVIDER_LABELS[p]), value: d.pricing.perPerson(money(seat.usd)), note: `${seat.plan}. ${seat.note}`, sources: [seat.source] },
      { label: d.pricing.tokens(SIM_PROVIDER_LABELS[p], mid.model), value: d.pricing.perMillion(`$${mid.input}`, `$${mid.output}`), note: d.pricing.tokensNote, sources: [mid.source] },
    ]
  })
  pricing.push(
    { label: d.pricing.reserve, value: formatPercent(SPEND_RESERVE.central.value), note: SPEND_RESERVE.central.note, sources: sourcesOf(SPEND_RESERVE.central) },
    { label: d.pricing.gateway, value: formatPercent(GATEWAY_FEE.central.value, 1), note: GATEWAY_FEE.central.note, sources: sourcesOf(GATEWAY_FEE.central) },
    { label: d.pricing.fx, value: d.pricing.fxValue(FX.readOn), sources: [FX.source] },
  )

  const picked = (result.inputs.tools ?? DEFAULT_TOOLS) as ToolId[]
  const tooling: DrillRow[] = picked.map((id) => {
    const t = TOOLING[id]
    return {
      label: t.label,
      value: d.tooling.monthly(formatMoneyRange({ low: t.monthly.optimistic, high: t.monthly.conservative }, currency, { compact: true })),
      note: `${t.detail} ${d.tooling.estimate}`,
      sources: [t.source],
    }
  })
  for (const id of result.inputs.stack ?? []) {
    const a = STACK[id]?.addOn
    if (a) tooling.push({ label: STACK[id].label, value: d.tooling.addOn(money(a.usd)), note: a.plan, sources: [a.source] })
  }
  tooling.push({ label: d.tooling.governance, value: d.tooling.monthly(money(GOVERNANCE_TOOLS.value)), note: GOVERNANCE_TOOLS.note, sources: sourcesOf(GOVERNANCE_TOOLS) })

  const pay = HOURLY_COST_SOURCES[r.region]
  const deptParam = r.region === 'us' ? DEPARTMENT_PAY.us : DEPARTMENT_PAY.uk
  const rates = FUNCTIONS.map((f) => r.hourlyByFunction[f])
  const labor: DrillRow[] = [
    { label: d.labor.hourly, value: d.labor.perHour(money(r.hourlyCost)), note: `${pay.period}. ${pay.measure}`, sources: [{ label: pay.label, url: pay.url }] },
    { label: d.labor.pay, value: d.labor.spread(money(Math.min(...rates)), money(Math.max(...rates))), note: deptParam.note, sources: sourcesOf(deptParam) },
    { label: d.labor.weeks, value: d.labor.weeksValue(result.inputs.overrides?.workingWeeks ?? WORKING_WEEKS.value), note: WORKING_WEEKS.note, sources: [] },
  ]

  const benchmarks: DrillRow[] = FUNCTIONS.filter((f) => r.functionMix[f] > 0 && central(f).s.optimistic > 0).map((f) => {
    const p = central(f)
    const ids = [...new Set([...p.rows.conservative, ...p.rows.central, ...p.rows.optimistic])]
    const rows = ids.map((id) => EVIDENCE.find((e) => e.id === id)).filter((e): e is (typeof EVIDENCE)[number] => Boolean(e))
    return {
      label: SIM_FUNCTION_LABELS[f],
      value: d.benchmarks.saved(formatPercent(p.s.conservative), formatPercent(p.s.optimistic)),
      note: p.extrapolated ? d.benchmarks.extrapolated : rows.map((e) => `${e.effect} (${e.setting})`).join('; '),
      sources: rows.map((e) => ({ label: e.citation, url: e.url })),
    }
  })

  return [
    { id: 'adoption', rows: adoption },
    { id: 'pricing', rows: pricing },
    { id: 'tooling', rows: tooling },
    { id: 'labor', rows: labor },
    { id: 'benchmarks', rows: benchmarks },
  ]
}
