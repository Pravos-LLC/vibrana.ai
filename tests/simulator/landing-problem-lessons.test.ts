import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SIM_PROBLEM, SIM_PROBLEM_BCG, SIM_PROBLEM_MIT, SIM_PROBLEM_PWC } from '@/src/simulator-landing-problem-content'
import { SIM_LESSONS, SIM_WHY } from '@/src/simulator-landing-lessons-content'

const ROOT = join(__dirname, '..', '..')
const source = (p: string) =>
  readFileSync(join(ROOT, p), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

// Same lint as tests/simulator/content.test.ts, plus the Voice line of research/simulator-copy-brief.md
// and the landing outline's AI-speak list.
const BANNED = [
  /\bFTEs?\b/i, /\broles?\b/i, /\bjobs\b/i, /headcount reduction/i, /\breplacement\b/i, /\brestructur/i, /\breorg/i,
  /\b10x\b/i, /\bharness/i, /\breimagin/i, /co-create/i, /move fast/i, /open-ended/i, /\blayoffs?\b/i, /jobs at risk/i,
  /\bunlock/i, /\bseamless/i, /\bsupercharge/i, /\bleverag/i, /\bjourney\b/i, /\blandscape\b/i, /—/,
]
const BRITISH = [/\b(realis|organis|analys|optimis|prioritis|recognis)(e|ed|es|ing)\b/i, /\bcolour/i, /\bcentre/i, /\blicence\b/i, /\bprogramme/i, /\bbehaviour/i, /\bfavour/i]

describe('landing problem and lessons copy', () => {
  for (const file of ['src/simulator-landing-problem-content.ts', 'src/simulator-landing-lessons-content.ts']) {
    const text = source(file)
    for (const re of BANNED) it(`${file} has no ${re}`, () => expect(text).not.toMatch(re))
    for (const re of BRITISH) it(`${file} uses American spelling (${re})`, () => expect(text).not.toMatch(re))
  }

  it('titles are under 7 words', () => {
    for (const t of [SIM_PROBLEM.title, SIM_LESSONS.title, SIM_WHY.title, ...SIM_LESSONS.items.map((i) => i.title)]) {
      expect(t.split(/\s+/).length, t).toBeLessThan(7)
    }
  })

  it('only ledger figures appear, each with a source line', () => {
    expect(SIM_PROBLEM_PWC.value).toBe('56%')
    expect(SIM_PROBLEM_PWC.both.value).toBe('12%')
    expect(SIM_PROBLEM_PWC.sample).toBe('4,454 CEOs')
    expect(SIM_PROBLEM_PWC.dots.neither + SIM_PROBLEM_PWC.dots.both).toBeLessThanOrEqual(100)
    expect(SIM_PROBLEM_BCG.segments.map((s) => s.value)).toEqual([10, 20, 70])
    for (const s of [SIM_PROBLEM_PWC.source, SIM_PROBLEM_BCG.source, SIM_PROBLEM_MIT.source]) expect(s.length).toBeGreaterThan(10)
    for (const i of SIM_LESSONS.items) expect(i.source.length, i.id).toBeGreaterThan(10)
  })

  it('MIT NANDA 95% is framed as contested, preliminary, 153 respondents', () => {
    expect(SIM_PROBLEM_MIT.tag).toMatch(/contested/i)
    expect(SIM_PROBLEM_MIT.label).toMatch(/zero measurable P&L return/)
    expect(SIM_PROBLEM_MIT.detail).toMatch(/preliminary/i)
    expect(SIM_PROBLEM_MIT.detail).toMatch(/153/)
  })

  it('the components import their copy and hold no inline marketing strings', () => {
    for (const file of ['ProblemSection', 'LessonsSection']) {
      const text = source(`src/components/simulator/landing/${file}.tsx`)
      expect(text).toContain('simulator-landing-')
      expect(text).not.toMatch(/—/)
    }
  })
})
