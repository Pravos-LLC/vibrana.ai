import { describe, expect, it } from 'vitest'
import {
  SPRINT_FROM_USD,
  calculate,
  defaultAssumptions,
  defaultWorkflow,
  formatHours,
  formatMoney,
  formatMonths,
  paybackMonths,
  roundAbout,
  sanitizeAssumptions,
  sanitizeWorkflow,
  sprintFromPrice,
  workflowResult,
  type WorkflowInput,
} from '@/src/lib/roi/calc'
import { WHOLE_JOB, WORKFLOW_EVIDENCE, WORKFLOW_IDS } from '@/src/lib/roi/evidence'
import ledger from '@/src/lib/roi/evidence-ledger.json'

const usd = defaultAssumptions('USD')
const row = (over: Partial<WorkflowInput> = {}): WorkflowInput => ({
  id: 'support',
  people: 10,
  hoursPerWeek: 20,
  hourlyCost: 50,
  conservativePct: 8.5,
  expectedPct: 15,
  ...over,
})

describe('workflow defaults come from the knowledge base snapshot', () => {
  it('has every library workflow, with conservative at or below expected', () => {
    for (const id of WORKFLOW_IDS) {
      const e = WORKFLOW_EVIDENCE[id]
      expect(e.conservativePct).toBeLessThanOrEqual(e.expectedPct)
      expect(e.conservative.url).toMatch(/^https:\/\//)
      expect(e.expected.url).toMatch(/^https:\/\//)
    }
  })

  it('never uses a lab ceiling as a default', () => {
    expect(WORKFLOW_EVIDENCE.reports.ceilingPct).toBe(40)
    expect(WORKFLOW_EVIDENCE.reports.expectedPct).toBeLessThan(40)
    expect(WORKFLOW_EVIDENCE.software.ceilingPct).toBe(55.8)
    expect(WORKFLOW_EVIDENCE.software.expectedPct).toBeLessThan(55.8)
    expect(defaultWorkflow('software').expectedPct).toBe(WORKFLOW_EVIDENCE.software.expectedPct)
  })

  it('labels vendor-authored studies', () => {
    expect(WORKFLOW_EVIDENCE['email-crm'].expected.vendorNote).toBeTruthy()
    expect(WORKFLOW_EVIDENCE.software.expected.vendorNote).toBeTruthy()
  })

  it('cites only ledger findings, and no contested one', () => {
    const slugs = Object.keys(ledger.findings)
    expect(slugs).not.toContain('metr-2025-experienced-devs-19-percent-slower')
    for (const f of Object.values(ledger.findings)) expect(['public', 'anonymized']).toContain(f.publishable)
  })

  it('carries the whole-job range', () => {
    expect(WHOLE_JOB.lowPct).toBeLessThan(WHOLE_JOB.highPct)
  })
})

describe('workflowResult', () => {
  it('applies the percentage to the hours spent on the task only', () => {
    const r = workflowResult(row(), usd)
    // 10 people x 20 h x 48 weeks = 9,600 task hours
    expect(r.taskHours).toBe(9600)
    expect(r.hoursFreed.conservative).toBeCloseTo(816)
    expect(r.hoursFreed.expected).toBeCloseTo(1440)
    expect(r.timeValue.conservative).toBeCloseTo(40_800)
    expect(r.timeValue.expected).toBeCloseTo(72_000)
  })

  it('reports the share of a whole working week and flags anything above the whole-job check', () => {
    const r = workflowResult(row(), usd)
    // 20 h x 15% = 3 h of a 40 h week = 7.5%, above the 6.1% whole-job high
    expect(r.shareOfWorkWeek.expected).toBeCloseTo(0.075)
    expect(r.aboveWholeJobCheck).toBe(true)
    expect(workflowResult(row({ hoursPerWeek: 10 }), usd).aboveWholeJobCheck).toBe(false)
  })

  it('treats empty, negative and non-numeric inputs as zero', () => {
    const r = workflowResult(row({ people: -4, hoursPerWeek: Number.NaN, hourlyCost: -1 }), usd)
    expect(r.taskHours).toBe(0)
    expect(r.timeValue.expected).toBe(0)
    expect(r.aboveWholeJobCheck).toBe(false)
  })
})

describe('sanitize', () => {
  it('caps percentages at 100 and swaps a low end typed above the high end', () => {
    const w = sanitizeWorkflow(row({ conservativePct: 30, expectedPct: 120 }))
    expect(w.expectedPct).toBe(100)
    expect(w.conservativePct).toBe(30)
    const swapped = sanitizeWorkflow(row({ conservativePct: 20, expectedPct: 5 }))
    expect(swapped).toMatchObject({ conservativePct: 5, expectedPct: 20 })
  })

  it('falls back to the default working year and an unknown currency to USD', () => {
    const a = sanitizeAssumptions({ currency: 'JPY' as never, weeksPerYear: Number.NaN, workWeekHours: 0, sprintCost: -5, runCostPerMonth: -3 })
    expect(a.currency).toBe('USD')
    expect(a.weeksPerYear).toBe(48)
    expect(a.workWeekHours).toBe(1)
    expect(a.sprintCost).toBe(0)
    expect(a.runCostPerMonth).toBe(0)
  })
})

describe('calculate', () => {
  it('sums workflows and picks the one with the most expected hours freed', () => {
    const r = calculate(
      [row(), row({ id: 'software', people: 5, hoursPerWeek: 30, conservativePct: 0, expectedPct: 21 })],
      usd,
    )
    // software: 5 x 30 x 48 = 7,200 h x 21% = 1,512 h, more than support's 1,440 h
    expect(r.startWith).toBe('software')
    expect(r.totals.hoursFreed.expected).toBeCloseTo(1440 + 1512)
    expect(r.totals.hoursFreed.conservative).toBeCloseTo(816)
  })

  it('has no workflow to start with when nothing is entered', () => {
    const r = calculate([defaultWorkflow('support')], usd)
    expect(r.startWith).toBeNull()
    expect(r.paybackMonths.fastest).toBe(Infinity)
  })

  it('ignores duplicate and unknown workflows', () => {
    const r = calculate([row(), row(), row({ id: 'payroll' as never })], usd)
    expect(r.workflows).toHaveLength(1)
  })

  it('gives a payback range against the sprint cost, fastest from the expected value', () => {
    const r = calculate([row()], { ...usd, sprintCost: 10_000 })
    // expected 72,000 a year = 6,000 a month -> 1.67 months; conservative 40,800 -> 3,400 a month -> 2.94
    expect(r.paybackMonths.fastest).toBeCloseTo(10_000 / 6_000)
    expect(r.paybackMonths.slowest).toBeCloseTo(10_000 / 3_400)
    expect(formatMonths(r.paybackMonths.fastest)).toBe('2')
    expect(formatMonths(r.paybackMonths.slowest)).toBe('3')
  })

  it('subtracts a monthly running cost before payback', () => {
    // expected 6,000 a month - 1,000 run = 5,000 -> 2 months; conservative 3,400 - 1,000 = 2,400
    const r = calculate([row()], { ...usd, sprintCost: 10_000, runCostPerMonth: 1_000 })
    expect(r.paybackMonths.fastest).toBeCloseTo(2)
    expect(r.paybackMonths.slowest).toBeCloseTo(10_000 / 2_400)
    expect(paybackMonths(10_000, 12_000, 1_000)).toBe(Infinity)
  })

  it('names the low-end leader when it differs from the high-end one', () => {
    const r = calculate(
      [row(), row({ id: 'research', people: 10, hoursPerWeek: 30, conservativePct: 0, expectedPct: 25 })],
      usd,
    )
    expect(r.startWith).toBe('research')
    expect(r.safestBet).toBe('support')
    expect(calculate([row()], usd).safestBet).toBeNull()
  })

  it('has no payback at the conservative end when the low figure is zero', () => {
    const r = calculate([row({ id: 'research', conservativePct: 0, expectedPct: 25 })], usd)
    expect(r.paybackMonths.slowest).toBe(Infinity)
    expect(formatMonths(r.paybackMonths.slowest)).toBeNull()
    expect(Number.isFinite(r.paybackMonths.fastest)).toBe(true)
  })
})

describe('currency', () => {
  it('quotes the sprint price as $10,000 and converts it at the published rate', () => {
    expect(sprintFromPrice('USD')).toBe(SPRINT_FROM_USD)
    expect(sprintFromPrice('EUR')).toBe(8940)
    expect(sprintFromPrice('GBP')).toBe(7560)
    expect(defaultAssumptions('GBP').sprintCost).toBe(7560)
  })

  it('does not convert user-entered costs: the result is in the currency they were typed in', () => {
    const gbp = calculate([row()], { ...defaultAssumptions('GBP'), sprintCost: 7560 })
    expect(gbp.totals.timeValue.expected).toBeCloseTo(72_000)
    expect(formatMoney(gbp.totals.timeValue.expected, 'GBP')).toBe('£72,000')
    expect(formatMoney(1_234_567, 'EUR')).toBe('€1.2M')
  })
})

describe('formatting', () => {
  it('rounds to two significant figures above 100', () => {
    expect(roundAbout(1512)).toBe(1500)
    expect(roundAbout(816)).toBe(820)
    expect(roundAbout(42.4)).toBe(42)
    expect(formatHours(14_563)).toBe('15,000')
  })

  it('handles zero and instant payback', () => {
    expect(paybackMonths(0, 100)).toBe(0)
    expect(formatMonths(0)).toBe('0')
    expect(formatMonths(0.2)).toBe('1')
  })
})

describe('payback wording', async () => {
  const { paybackParts } = await import('@/src/lib/roi/email')
  it('uses the singular for one month and notes a zero low end', () => {
    const r = calculate([row({ id: 'research', people: 10, hoursPerWeek: 40, hourlyCost: 100, conservativePct: 0, expectedPct: 25 })], usd)
    const p = paybackParts(r)
    expect(p.text).toBe('1 month at the high end')
    expect(p.note).toMatch(/None at the low end/)
    expect(paybackParts(calculate([row()], usd)).text).toBe('2 to 3 months')
  })
})
