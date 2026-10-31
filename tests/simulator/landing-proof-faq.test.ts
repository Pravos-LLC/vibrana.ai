import { expectOmittedMedia } from '@/tests/public-demo-media-assertions'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SECTOR_EXAMPLES } from '@/src/lib/simulator/sector-examples'
import { PROOF_CONTENT, PROOF_WALL } from '@/src/simulator-landing-proof-content'
import { FAQ_CONTENT, TEAM_CONTENT } from '@/src/simulator-landing-faq-content'
import { BOOK_CALL_URL, FINAL_CTA_CONTENT, STICKY_CTA_CONTENT } from '@/src/simulator-landing-cta-content'

const ROOT = join(__dirname, '..', '..')
const FILES = ['src/simulator-landing-proof-content.ts', 'src/simulator-landing-faq-content.ts', 'src/simulator-landing-cta-content.ts']
const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const BANNED = [
  /\bFTEs?\b/i, /\broles?\b/i, /\bjobs\b/i, /headcount reduction/i, /\breplacement\b/i, /\brestructur/i, /\breorg/i,
  /\b10x\b/i, /\bharness/i, /\breimagin/i, /co-create/i, /move fast/i, /open-ended/i, /\blayoffs?\b/i, /jobs at risk/i,
  /\bunlock/i, /seamless/i, /supercharge/i, /leverage/i, /journey/i, /landscape/i, /—/,
]
const BRITISH = [/\b(realis|organis|analys|optimis|prioritis|recognis)(e|ed|es|ing)\b/i, /\bcolour/i, /\bcentre/i, /\blicence\b/i, /\bprogramme/i]

describe('simulator landing proof, FAQ and CTA content lint', () => {
  for (const file of FILES) {
    const text = strip(readFileSync(join(ROOT, file), 'utf8'))
    for (const re of BANNED) it(`${file} has no ${re}`, () => expect(text).not.toMatch(re))
    for (const re of BRITISH) it(`${file} uses American spelling (${re})`, () => expect(text).not.toMatch(re))
  }
})

describe('titles stay under 7 words', () => {
  const titles = [PROOF_CONTENT.title, PROOF_CONTENT.delivered.title, TEAM_CONTENT.title, FAQ_CONTENT.title, FINAL_CTA_CONTENT.title, STICKY_CTA_CONTENT.text]
  for (const t of titles) it(t, () => expect(t.split(/\s+/).length).toBeLessThan(7))
})

describe('proof wall', () => {
  it('every logo belongs to a sector example with a source', () => {
    for (const w of PROOF_WALL) {
      const ex = SECTOR_EXAMPLES[w.sector]
      expect(ex, w.sector).toBeTruthy()
      expect(ex!.url).toMatch(/^https:\/\//)
      expect(ex!.reportedBy).toMatch(/^(company|vendor)$/)
    }
  })
  it('leaves off the marks that cannot render (BCE, Worten, Axel Springer, Reach)', () => {
    const names = PROOF_WALL.map((w) => SECTOR_EXAMPLES[w.sector]!.company)
    for (const n of ['Brisbane Catholic Education', 'Worten', 'Axel Springer', 'Reach plc']) expect(names).not.toContain(n)
  })
  it('keeps ENEOS in its own colors', () => {
    expect(PROOF_WALL.find((w) => w.sector === 'manufacturing-logistics')?.mono).toBe(false)
  })
  it('both reporter labels exist', () => {
    expect(Object.keys(PROOF_CONTENT.reported).sort()).toEqual(['company', 'vendor'])
  })
})

describe('team and FAQ', () => {
  it('team photos exist on disk', () => {
    for (const m of TEAM_CONTENT.members) expectOmittedMedia(m.photo, m.alt, 'portrait')
  })
  it('answers every Gatekeeper objection once', () => {
    expect(FAQ_CONTENT.items.map((i) => i.id)).toEqual(['made-up', 'spend', 'people', 'fees', 'data', 'accuracy'])
  })
  it('holds headcount flat and keeps the dropped promise line out', () => {
    const all = FAQ_CONTENT.items.map((i) => i.answer).join(' ')
    expect(all).toMatch(/Headcount stays flat/)
    expect(all).not.toMatch(/not a promise/i)
  })
})

describe('cta', () => {
  it('books through the calendar link', () => {
    expect(BOOK_CALL_URL).toBe('https://calendar.app.google/2DswLVndhkpMVx7K7')
  })
})
