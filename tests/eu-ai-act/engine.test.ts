import { describe, expect, it } from 'vitest'
import { evaluate, sizeBandOf, validAnswers } from '@/src/lib/eu-ai-act/engine'
import { EU_ALL_QUESTIONS, EU_QUESTIONS, NOT_APPLICABLE } from '@/src/eu-ai-act-questions-content'
import { EU_OBLIGATIONS } from '@/src/eu-ai-act-obligations-content'

const company = { teamSize: '151-250 employees', revenueBand: '$10M-$25M' }
const AS_OF = new Date('2026-10-17T12:00:00Z')

// A 200-person EU company using a vendor CV-screening tool, a vendor chatbot, partial controls.
const hrDeployer = {
  eu_scope: 100, eu_build: 100, eu_hr: 100, eu_credit: 0, eu_edu: 0, eu_sensitive: 0, eu_chat: 70, eu_gen: 0,
  eu_prohibited_review: 60, eu_emotion: 60,
  eu_inventory: 60, eu_classification: 25, eu_role: 25, eu_modify: NOT_APPLICABLE,
  eu_literacy: 60, eu_oversight: 25, eu_inform_workers: 25,
  eu_instructions: 60, eu_logs: 60, eu_monitor: 25, eu_inform_people: 25, eu_vendor: 25,
  eu_disclose_chat: 100, eu_label_content: NOT_APPLICABLE, eu_owner: 25,
}

describe('evaluate', () => {
  it('flags a 200-person HR-tool deployer as high-risk with the Article 26 duties from 2 December 2027', () => {
    const p = evaluate(hrDeployer, company, AS_OF)
    expect(p.scope).toBe('in-scope')
    expect(p.role).toBe('deployer')
    expect(p.riskTier).toBe('high-risk')
    expect(p.highRisk).toEqual([{ area: 'employment', level: 'yes' }])
    expect(p.sizeBand).toBe('sme')
    const ids = p.obligations.map((o) => o.id)
    expect(ids).toEqual(expect.arrayContaining(['high-risk-deployer', 'inform-workers', 'inform-affected-people']))
    // Art. 50(1) is the provider's duty: a vendor chatbot is not graded against the deployer.
    expect(ids).not.toContain('transparency-interaction')
    expect(ids).not.toContain('fria')
    expect(ids).not.toContain('transparency-content')
    expect(ids).not.toContain('provider-obligations')
    const hr = p.obligations.find((o) => o.id === 'high-risk-deployer')!
    expect(hr.appliesFrom).toBe('2027-12-02')
    expect(hr.inForce).toBe(false)
    expect(hr.status).toBe('partial') // (60 + 25 + 25 + 60) / 4 = 43
    const literacy = p.obligations.find((o) => o.id === 'ai-literacy')!
    expect(literacy.inForce).toBe(true)
    const own = evaluate({ ...hrDeployer, eu_chat: 100 }, company, AS_OF)
    expect(own.obligations.find((o) => o.id === 'transparency-interaction')!.status).toBe('met')
  })

  it('treats not-applicable answers as out of the score, not as zero', () => {
    const p = evaluate(hrDeployer, company, AS_OF)
    const inventory = p.sectionScores.find((s) => s.key === 'inventory')!
    expect(inventory.score).toBe(37) // (60 + 25 + 25) / 3, eu_modify left out
  })

  it('adds the fundamental rights impact assessment and provider duties for a credit-scoring provider', () => {
    const p = evaluate({ ...hrDeployer, eu_hr: 0, eu_credit: 100, eu_build: 40 }, company, AS_OF)
    const ids = p.obligations.map((o) => o.id)
    expect(ids).toContain('fria')
    expect(ids).toContain('provider-obligations')
    expect(ids).not.toContain('inform-workers')
    expect(p.obligations.find((o) => o.id === 'fria')!.status).toBe('gap')
  })

  it('gives a minimal-risk company only the baseline obligations', () => {
    const p = evaluate({ eu_scope: 70, eu_build: 100, eu_hr: 0, eu_credit: 0, eu_edu: 0, eu_sensitive: 0, eu_chat: 0, eu_gen: 0 }, company, AS_OF)
    expect(p.riskTier).toBe('minimal')
    expect(p.obligations.map((o) => o.id).sort()).toEqual(['accountable-owner', 'ai-literacy', 'inventory-classification', 'prohibited-practices', 'role-clarity', 'vendor-contracts'])
    expect(p.obligations.every((o) => o.status === 'unanswered')).toBe(true)
  })

  it('raises the prohibited-practice flag on "yes" or "possibly" to emotion inference', () => {
    expect(evaluate({ ...hrDeployer, eu_emotion: 0 }, company, AS_OF).prohibitedFlag).toBe(true)
    expect(evaluate({ ...hrDeployer, eu_emotion: 25 }, company, AS_OF).prohibitedFlag).toBe(true)
    expect(evaluate(hrDeployer, company, AS_OF).prohibitedFlag).toBe(false)
  })

  it('reads scope from the first question', () => {
    expect(evaluate({ ...hrDeployer, eu_scope: 0 }, company, AS_OF).scope).toBe('out-of-scope')
    expect(evaluate({ ...hrDeployer, eu_scope: 40 }, company, AS_OF).scope).toBe('likely')
  })
})

describe('sizeBandOf', () => {
  it('gives a first read of SME and SMC from headcount and revenue band', () => {
    expect(sizeBandOf('151-250 employees', '$25M-$50M')).toBe('sme')
    expect(sizeBandOf('151-250 employees', '$50M+')).toBe('smc')
    expect(sizeBandOf('351-500 employees', '$10M-$25M')).toBe('smc')
    expect(sizeBandOf('500+ employees', '$50M+')).toBe('check')
  })
})

describe('instrument', () => {
  it('has unique ids and unique option scores per question', () => {
    const ids = EU_ALL_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of EU_ALL_QUESTIONS) expect(new Set(q.options.map((o) => o.score)).size).toBe(q.options.length)
  })

  it('gives every exposure option a value the engine reads', () => {
    for (const q of EU_QUESTIONS.footprint) for (const o of q.options) expect(o.value).toBeTruthy()
  })

  it('links every obligation question to a real question', () => {
    for (const o of EU_OBLIGATIONS) for (const id of o.questions) expect(ids()).toContain(id)
  })

  it('validates answers: known ids and offered scores only', () => {
    expect(validAnswers(hrDeployer)).toBe(true)
    expect(validAnswers({ eu_scope: 55 })).toBe(false)
    expect(validAnswers({ l_owner: 100 })).toBe(false)
    expect(validAnswers({})).toBe(false)
    expect(validAnswers([])).toBe(false)
  })
})

function ids() {
  return EU_ALL_QUESTIONS.map((q) => q.id)
}
