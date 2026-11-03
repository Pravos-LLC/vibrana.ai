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

  it('carries headline B and no email gate', () => {
    expect(`${SIM_HERO.title.before}${SIM_HERO.title.accent}${SIM_HERO.title.after}`).toBe('No venture launches without a P&L. Try yours for AI.')
    expect(SIM_HERO.subtitle).toMatch(/No email to play\.$/)
    const mini = source('src/components/simulator/landing/MiniSimulator.tsx')
    expect(mini).not.toMatch(/<form|type="email"|fetch\(/)
  })
})
