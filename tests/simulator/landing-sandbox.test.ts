import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { simulate } from '@/src/lib/simulator/engine'
import { SIM_HERO, SIM_MINI } from '@/src/simulator-landing-hero-content'
import { SAMPLE_INPUTS } from '@/src/components/simulator/SamplePreview'
import {
  PACE_TARGET,
  PEOPLE_STOPS,
  SANDBOX_DEFAULT,
  SANDBOX_FIXED,
  runSandbox,
  sandboxInputs,
  sandboxOutputs,
} from '@/src/components/simulator/landing/sandbox'
import { ADOPTION } from '@/src/lib/simulator/assumptions'
import { BRAIN_FULL, BRAIN_START, buildLayout, frameState } from '@/src/components/simulator/org-layout'
import { BRAIN_STEP_MONTH, STEP_STATE } from '@/src/components/simulator/landing/ScrollyRun'
import { SIM_WALKTHROUGH } from '@/src/simulator-landing-walkthrough-content'
import { sandboxSeed, type Sandbox } from '@/src/components/simulator/landing/sandbox'

const ROOT = join(__dirname, '..', '..')
const source = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('hero sandbox (MiniSimulator)', () => {
  it('starts on the sample insurer the page has always shown', () => {
    expect(sandboxInputs(SANDBOX_DEFAULT)).toMatchObject({ ...SAMPLE_INPUTS, adoptionTarget: 0.8 })
    expect(PEOPLE_STOPS).toContain(SANDBOX_DEFAULT.people)
  })

  it('runs the real engine, not a copy of the math', () => {
    expect(runSandbox(SANDBOX_DEFAULT)).toEqual(simulate(sandboxInputs(SANDBOX_DEFAULT)))
    const src = source('src/components/simulator/landing/sandbox.ts')
    expect(src).toContain("from '@/src/lib/simulator/engine'")
    expect(src).not.toMatch(/Math\.exp|hoursSavedShare|seatPrice/)
  })

  it('each pace chip sits on the calibrated curve the deck describes', () => {
    for (const p of ['cautious', 'steady', 'ambitious'] as const) expect(PACE_TARGET[p]).toBe(ADOPTION[p].value.aMax)
    expect(SIM_MINI.paceHint.cautious).toMatch(/60%.*month 9/)
    expect(ADOPTION.cautious.value.t0).toBe(9)
    expect(SIM_MINI.paceHint.steady).toMatch(/80%.*month 6/)
    expect(ADOPTION.steady.value.t0).toBe(6)
    expect(SIM_MINI.paceHint.ambitious).toMatch(/92%.*month 3/)
    expect(ADOPTION.ambitious.value.t0).toBe(3)
  })

  it('"How we calculated this" matches the inputs the preview holds fixed', () => {
    expect(SANDBOX_FIXED.providers).toHaveLength(2)
    expect(SIM_MINI.howBody).toContain('two model providers')
    expect(SANDBOX_FIXED.cap).toBe(50)
    expect(SIM_MINI.howBody).toContain('$50 per-person monthly spend ceiling')
    expect(SANDBOX_FIXED.dataRule).toBe('internal')
    expect(SIM_MINI.howBody).toContain('internal data')
    expect(SANDBOX_FIXED.region).toBe('us')
    expect(SIM_MINI.howBody).toContain('US pay levels')
  })

  it('every output is a range that moves with the inputs', () => {
    const base = sandboxOutputs(runSandbox(SANDBOX_DEFAULT))
    for (const o of [base.capacity, base.runCost, base.timeFreed]) {
      expect(o.text).toMatch(/ to /)
      expect(o.low).toBeLessThan(o.high)
    }
    const bigger = sandboxOutputs(runSandbox({ ...SANDBOX_DEFAULT, people: 1000 }))
    expect(bigger.capacity.high).toBeGreaterThan(base.capacity.high)
    const cautious = sandboxOutputs(runSandbox({ ...SANDBOX_DEFAULT, pace: 'cautious' }))
    expect(cautious.timeFreed.high).toBeLessThan(base.timeFreed.high)
  })

  it('reads each output straight off the engine headline (capacity x 12, run cost as is, hours over all working hours)', () => {
    const cases: Sandbox[] = [
      SANDBOX_DEFAULT,
      { sector: 'software', people: 1200, pace: 'ambitious' },
      { sector: 'healthcare', people: 40, pace: 'cautious' },
    ]
    for (const c of cases) {
      const r = runSandbox(c)
      const o = sandboxOutputs(r)
      expect(o.capacity.low).toBe(r.headline.capacityValue.low * 12)
      expect(o.capacity.high).toBe(r.headline.capacityValue.high * 12)
      expect(o.runCost.low).toBe(r.headline.runCost.low)
      expect(o.runCost.high).toBe(r.headline.runCost.high)
      const hours = c.people * r.resolved.workingHoursPerMonth
      expect(o.timeFreed.low).toBe(r.headline.hoursFreed.low / hours)
      expect(o.timeFreed.high).toBe(r.headline.hoursFreed.high / hours)
    }
  })

  it('seeds the lead form only after the visitor played, never with the untouched sample', () => {
    expect(sandboxSeed(SANDBOX_DEFAULT, false)).toBeUndefined()
    expect(sandboxSeed(SANDBOX_DEFAULT, true)).toBeUndefined()
    expect(sandboxSeed({ ...SANDBOX_DEFAULT, people: 20 }, false)).toBeUndefined()
    expect(sandboxSeed({ sector: 'software', people: 20, pace: 'cautious' }, true)).toEqual({ sector: 'software', headcount: 20, adoptionTarget: 0.6 })
  })

  it('carries headline B and no email gate', () => {
    expect(`${SIM_HERO.title.before}${SIM_HERO.title.accent}${SIM_HERO.title.after}`).toBe('No venture launches without a P&L. Try yours for AI.')
    expect(SIM_HERO.subtitle).toMatch(/No email to play\.$/)
    const mini = source('src/components/simulator/landing/MiniSimulator.tsx')
    expect(mini).not.toMatch(/<form|type="email"|fetch\(/)
  })
})

describe('scroll run captions match the model', () => {
  const steady = runSandbox(SANDBOX_DEFAULT)
  const layout = buildLayout(steady)
  const caption = (id: string) => SIM_WALKTHROUGH.steps.find((s) => s.id === id)!.caption

  it('the brain step sits where the network shows the brain live, and says when it started', () => {
    const m = STEP_STATE['brain-live'].month!
    expect(m).toBe(BRAIN_STEP_MONTH)
    expect(m).toBeGreaterThan(BRAIN_START)
    expect(m).toBeLessThanOrEqual(BRAIN_FULL)
    expect(frameState(steady, layout, m).brain).toBeGreaterThan(0)
    expect(frameState(steady, layout, BRAIN_START).brain).toBe(0)
    expect(caption('brain-live')).toMatch(new RegExp(`^Month ${m}\\.`))
    expect(caption('brain-live')).toContain(`going live at month ${BRAIN_START}`)
  })

  it('step 1 is month 0 and does not claim nobody has started', () => {
    expect(STEP_STATE['month-0'].month).toBe(0)
    expect(caption('month-0')).toMatch(/^Month 0\./)
    expect(caption('month-0')).not.toMatch(/before anyone/)
    expect(steady.scenarios.central.months[0].hoursFreed).toBeGreaterThan(0)
  })

  it('the cautious step matches the engine (half of eventual users by month 9, not 6)', () => {
    const cautious = runSandbox({ ...SANDBOX_DEFAULT, pace: 'cautious' })
    expect(cautious.resolved.adoptionCurve.t0).toBe(9)
    expect(steady.resolved.adoptionCurve.t0).toBe(6)
    expect(caption('cautious')).toContain('by month 9, not month 6')
  })

  it('training time is the same in every scenario, so it may print without a range', () => {
    const cost = (s: 'conservative' | 'central' | 'optimistic') => steady.scenarios[s].months.reduce((a, m) => a + m.costs.trainingTime, 0)
    expect(cost('conservative')).toBeCloseTo(cost('central'), 6)
    expect(cost('optimistic')).toBeCloseTo(cost('central'), 6)
    expect(SIM_WALKTHROUGH.readiness.half('7')).toBe('Half of eventual users on AI by month 7')
  })
})
