import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SIM_WALKTHROUGH } from '@/src/simulator-landing-walkthrough-content'
import { SIM_LANDING_STEPS } from '@/src/simulator-landing-steps-content'

const ROOT = join(__dirname, '..', '..')
const source = (p: string) => readFileSync(join(ROOT, p), 'utf8')

const BANNED = [
  /\bFTEs?\b/i,
  /\broles?\b/i,
  /\bjobs\b/i,
  /headcount reduction/i,
  /\breplac(e|ement|ing)\b/i,
  /\brestructur/i,
  /\breorg/i,
  /\b10x\b/i,
  /\bharness/i,
  /\breimagin/i,
  /co-create/i,
  /move fast/i,
  /open-ended/i,
  /\blayoffs?\b/i,
  /jobs at risk/i,
  /\b(unlock|seamless|supercharge|leverage|journey|landscape)\b/i,
  /—/,
]
const BRITISH = [/\b(realis|organis|analys|optimis|prioritis|recognis)(e|ed|es|ing)\b/i, /\bcolour/i, /\bcentre/i, /\blicence\b/i, /\bprogramme/i]

const files = ['src/simulator-landing-walkthrough-content.ts', 'src/simulator-landing-steps-content.ts']

describe('landing walkthrough and steps content lint', () => {
  for (const file of files) {
    const text = source(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    for (const re of BANNED) it(`${file} has no ${re}`, () => expect(text).not.toMatch(re))
    for (const re of BRITISH) it(`${file} uses American spelling (${re})`, () => expect(text).not.toMatch(re))
  }

  it('every title is under 7 words', () => {
    const titles = [SIM_WALKTHROUGH.title, SIM_LANDING_STEPS.title, ...SIM_WALKTHROUGH.steps.map((s) => s.title), ...SIM_LANDING_STEPS.steps.map((s) => s.title)]
    for (const t of titles) expect(t.trim().split(/\s+/).length, t).toBeLessThan(7)
  })

  it('has four walkthrough steps and three how-it-works steps, each with a line', () => {
    expect(SIM_WALKTHROUGH.steps).toHaveLength(4)
    expect(SIM_LANDING_STEPS.steps).toHaveLength(3)
    for (const s of [...SIM_WALKTHROUGH.steps, ...SIM_LANDING_STEPS.steps]) expect(s.line.length).toBeGreaterThan(20)
  })

  it('the components keep copy out of JSX', () => {
    for (const f of ['src/components/simulator/landing/WalkthroughSection.tsx', 'src/components/simulator/landing/StepsSection.tsx']) {
      expect(source(f)).toMatch(/simulator-landing-(walkthrough|steps)-content/)
    }
  })
})
