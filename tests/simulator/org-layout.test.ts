import { describe, expect, it } from 'vitest'
import { simulate } from '@/src/lib/simulator/engine'
import { buildLayout, frameState, peoplePerDot, sceneSvg } from '@/src/components/simulator/org-layout'
import type { SimulatorInputs } from '@/src/lib/simulator/types'

const base: SimulatorInputs = {
  domain: null,
  headcount: 200,
  sector: 'insurance',
  providers: ['openai'],
  cap: 100,
  dataRule: 'client',
  pace: 'ambitious',
}

describe('org visual: nobody leaves the picture (spec 9)', () => {
  for (const headcount of [5, 200, 300, 450, 2_000, 100_000]) {
    it(`keeps every dot at every month for ${headcount} people`, () => {
      const r = simulate({ ...base, headcount })
      const layout = buildLayout(r)
      const dots = layout.clusters.filter((c) => c.id !== 'aiops').reduce((s, c) => s + c.dots.length, 0)
      expect(dots).toBe(Math.max(1, Math.round(headcount / peoplePerDot(headcount))))
      for (const m of [0, 3, 6, 12, 18, 24]) {
        const s = frameState(r, layout, m)
        const lit = Object.entries(s.lit).filter(([id]) => id !== 'aiops').reduce((a, [, b]) => a + b, 0)
        expect(lit).toBeLessThanOrEqual(dots)
        // Lit share tracks adoption.
        if (m > 0) expect(Math.abs(lit / dots - r.scenarios.central.months[m].adoption)).toBeLessThan(0.08 + 2 / dots)
      }
    })
  }

  it('uses one dot per person up to 300, then one per 5 or more', () => {
    expect(peoplePerDot(300)).toBe(1)
    expect(peoplePerDot(301)).toBe(5)
    expect(peoplePerDot(100_000)).toBeGreaterThan(5)
  })

  it('has an AI Ops team and one line from every team to the brain', () => {
    const r = simulate(base)
    const layout = buildLayout(r)
    expect(layout.clusters.some((c) => c.id === 'aiops')).toBe(true)
    expect(layout.spokes).toHaveLength(layout.clusters.length)
    const s = frameState(r, layout, 12)
    expect(s.spokes.every((sp) => sp.opacity > 0)).toBe(true)
    expect(s.spokes.every((sp) => sp.flow === 1)).toBe(true)
    expect(frameState(r, layout, 0).spokes.every((sp) => sp.flow === 0)).toBe(true)
  })

  it('shows more agents as workflows go live, never more than six a team', () => {
    const r = simulate(base)
    const layout = buildLayout(r)
    const total = (m: number) => frameState(r, layout, m).agents.reduce((a, b) => a + b, 0)
    expect(total(0)).toBe(0)
    expect(total(12)).toBeGreaterThan(0)
    expect(total(24)).toBeGreaterThanOrEqual(total(12))
    expect(frameState(r, layout, 24).agents.every((n) => n <= 6)).toBe(true)
  })

  it('nobody is lit at month 0 and new work only appears after month 12', () => {
    const r = simulate(base)
    const layout = buildLayout(r)
    expect(Object.values(frameState(r, layout, 0).lit).every((n) => n === 0)).toBe(true)
    expect(frameState(r, layout, 12).drift).toBe(0)
    expect(frameState(r, layout, 24).drift).toBe(1)
  })

  it('renders a standalone SVG still', () => {
    const svg = sceneSvg(simulate(base), 24)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).not.toContain('NaN')
    expect(sceneSvg(simulate(base), 24, { mark: 'data:image/svg+xml;base64,AAA' })).toContain('<image')
  })
})
