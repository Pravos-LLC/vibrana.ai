import { describe, expect, it } from 'vitest'
import { actionPlan, capRule, daysBetween, isStoredReport, linkedPenalties, nextDate, OBLIGATION_TONE, reportRows, statusTally, tierTone } from '@/src/lib/eu-ai-act/report'
import { EU_OBLIGATIONS } from '@/src/eu-ai-act-obligations-content'
import { EU_PENALTIES, EU_TIERS } from '@/src/eu-ai-act-readiness-content'
import { EU_FINDINGS } from '@/src/lib/eu-ai-act/evidence'
import { NORTHWIND_ANSWERS, NORTHWIND_COMPANY, NORTHWIND_SIZE, northwindProfile } from '@/scripts/eu-ai-act-report/northwind'
import { evaluate } from '@/src/lib/eu-ai-act/engine'

const profile = northwindProfile()
const rows = reportRows(profile)

describe('EU AI Act report views', () => {
  it('gives every obligation a tier from the landing page', () => {
    const tones = EU_TIERS.tiers.map((t) => t.tone)
    for (const o of EU_OBLIGATIONS) expect(tones).toContain(OBLIGATION_TONE[o.id])
    expect(tierTone('minimal')).toBe('baseline')
  })

  it('counts days from the assessment date to each date in the content', () => {
    expect(daysBetween('2026-10-18', '2027-12-02')).toBe(410)
    const hr = rows.find((r) => r.def.id === 'high-risk-deployer')!
    expect(hr.days).toBe(daysBetween(profile.asOf, '2027-12-02'))
    expect(rows.find((r) => r.def.id === 'ai-literacy')!.days).toBeLessThan(0)
    expect(rows.find((r) => r.def.id === 'vendor-contracts')!.days).toBeNull()
  })

  it('tallies every obligation once', () => {
    const t = statusTally(rows)
    expect(t.met + t.partial + t.gap + t.unanswered).toBe(profile.obligations.length)
  })

  it('finds the next date and every obligation on it', () => {
    const next = nextDate(rows)!
    expect(next.date).toBe('2027-12-02')
    expect(next.rows.map((r) => r.def.id).sort()).toEqual(['high-risk-deployer', 'inform-affected-people', 'inform-workers'])
  })

  it('orders open items: what applies now, then foundations, then later dates; never a met item', () => {
    const plan = actionPlan(profile, rows)
    const all = [...plan.now, ...plan.foundations, ...plan.next]
    expect(all.every((r) => r.result.status !== 'met')).toBe(true)
    expect(all.length).toBe(rows.filter((r) => r.result.status !== 'met').length)
    expect(plan.now.every((r) => r.result.inForce)).toBe(true)
    expect(plan.foundations.every((r) => r.result.appliesFrom === null)).toBe(true)
    // A gap comes before a partial gap within a phase.
    expect(plan.foundations[0].result.status).toBe('gap')
  })

  it('puts a possible prohibited practice first and links the top fine to it', () => {
    const flagged = evaluate({ ...NORTHWIND_ANSWERS, eu_emotion: 0 }, NORTHWIND_SIZE, new Date('2026-10-18T00:00:00Z'))
    expect(actionPlan(flagged).now[0].def.id).toBe('prohibited-practices')
    expect(linkedPenalties(flagged)[0]).toBe(true)
    expect(linkedPenalties(profile)).toEqual([false, true, false])
  })

  it('counts days and "in force" from the date it is given, not only the assessment date', () => {
    const later = reportRows(profile, '2027-12-02')
    const hr = later.find((r) => r.def.id === 'high-risk-deployer')!
    expect(hr.days).toBe(0)
    expect(hr.result.inForce).toBe(true)
    expect(reportRows(profile, '2026-10-24').find((r) => r.def.id === 'high-risk-deployer')!.days).toBe(404)
  })

  it('caps fines per size band as Art. 99(6) and 99(6a) say', () => {
    expect(capRule('sme')).toEqual(['lower', 'lower', 'lower'])
    // Small mid-caps: lower cap for 99(4) and 99(5) only; 99(3) prohibited practices keeps the higher.
    expect(capRule('smc')).toEqual(['higher', 'lower', 'lower'])
    expect(capRule('check')).toBeNull()
    expect(EU_FINDINGS['eu-ai-act-art-99-6a-smc-lower-cap'].quote).toContain('paragraphs 4 and 5')
    expect(EU_FINDINGS['eu-ai-act-art-99-6a-smc-lower-cap'].quote).toContain('whichever is lower')
    const smc = EU_PENALTIES.size.items[1]
    expect(smc.findings).toContain('eu-ai-act-art-99-6a-smc-lower-cap')
    expect(smc.body).not.toMatch(/no lower cap/i)
  })

  it('accepts a stored report from this build and rejects partial ones', () => {
    const good = { profile, company: NORTHWIND_COMPANY }
    expect(isStoredReport(JSON.parse(JSON.stringify(good)))).toBe(true)
    const without = (k: string) => ({ ...good, profile: { ...profile, [k]: undefined } })
    for (const k of ['sectionScores', 'highRisk', 'riskTier', 'obligations', 'asOf', 'sizeBand']) expect(isStoredReport(without(k)), k).toBe(false)
    expect(isStoredReport({ ...good, company: undefined })).toBe(false)
    expect(isStoredReport({ ...good, profile: { ...profile, obligations: [{ id: 'ai-literacy', appliesFrom: null }] } })).toBe(false)
    expect(isStoredReport({ ...good, profile: { ...profile, obligations: 'x' } })).toBe(false)
    expect(isStoredReport(null)).toBe(false)
  })
})
