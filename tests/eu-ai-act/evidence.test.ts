import { describe, expect, it } from 'vitest'
import selection from '@/src/lib/eu-ai-act/evidence-selection.json'
import { EU_FINDINGS, legalCite } from '@/src/lib/eu-ai-act/evidence'
import { EU_ALL_QUESTIONS } from '@/src/eu-ai-act-questions-content'
import { EU_OBLIGATIONS } from '@/src/eu-ai-act-obligations-content'
import * as content from '@/src/eu-ai-act-readiness-content'

// Every object in the page copy that carries `findings`, with its text.
function cited(node: unknown, out: { text: string; findings: string[] }[] = []) {
  if (Array.isArray(node)) node.forEach((n) => cited(n, out))
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>
    for (const [k, v] of Object.entries(o)) {
      if (/[fF]indings$/.test(k) && Array.isArray(v)) {
        const text = Object.entries(o)
          .filter(([key, val]) => typeof val === 'string' && !/findings/i.test(key))
          .map(([, val]) => val)
          .join(' ')
        out.push({ text, findings: v as string[] })
      } else cited(v, out)
    }
  }
  return out
}

const all = cited(content)
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December'

/** "EUR 7.5 million" -> "7 500 000", the way the Official Journal writes amounts. */
function ojAmount(s: string) {
  const m = s.match(/EUR ([\d.]+) million/)
  if (!m) return s
  return Math.round(parseFloat(m[1]) * 1_000_000).toLocaleString('en-US').replace(/,/g, ' ')
}

describe('EU AI Act evidence', () => {
  it('snapshot holds exactly the selected findings, each pointing at the corpus', () => {
    expect(Object.keys(EU_FINDINGS).sort()).toEqual([...selection.findings].sort())
    for (const f of Object.values(EU_FINDINGS)) expect(f.corpus).toMatch(/^corpus\/eu-ai-act\//)
  })

  it('every slug cited by the instrument, obligations and page is in the snapshot and renders', () => {
    const slugs = [
      ...EU_ALL_QUESTIONS.flatMap((q) => (Array.isArray(q.evidence) ? q.evidence : [])),
      ...EU_OBLIGATIONS.flatMap((o) => o.findings),
      ...all.flatMap((c) => c.findings),
    ]
    for (const s of slugs) expect(() => legalCite(s), s).not.toThrow()
  })

  it('every selected finding is used somewhere', () => {
    const used = new Set([
      ...EU_ALL_QUESTIONS.flatMap((q) => (Array.isArray(q.evidence) ? q.evidence : [])),
      ...EU_OBLIGATIONS.flatMap((o) => o.findings),
      ...all.flatMap((c) => c.findings),
    ])
    const unused = selection.findings.filter((s) => !used.has(s))
    // Kept for the video's fact ledger, not shown on the page.
    const videoOnly = ['eu-ai-act-art-3-1-ai-system-definition', 'eu-ai-act-art-5-1-ba-non-consensual-intimate-imagery-prohibited', 'eu-ai-act-art-111-2-legacy-high-risk-systems', 'eu-ai-act-art-113-b-gpai-2025-08-02']
    expect(unused.filter((s) => !videoOnly.includes(s))).toEqual([])
  })

  it('every date on the page appears in the quote of a finding next to it', () => {
    for (const c of all) {
      for (const d of c.text.match(new RegExp(`\\b\\d{1,2} (${MONTHS}) \\d{4}\\b`, 'g')) ?? []) {
        const quotes = c.findings.map((s) => EU_FINDINGS[s].quote).join(' ')
        // Publication dates come from the source record; the rest must be in the quoted text.
        const ok = quotes.includes(d) || c.findings.some((s) => s.startsWith('ec-2026-draft') || s === 'eu-2026-omnibus-entry-into-force')
        expect(ok, `${d} in "${c.text.slice(0, 60)}"`).toBe(true)
      }
    }
  })

  it('every euro amount and percentage on the page appears in a quote next to it', () => {
    for (const c of all) {
      const quotes = c.findings.map((s) => EU_FINDINGS[s].quote).join(' ')
      for (const a of c.text.match(/EUR [\d.]+ million/g) ?? []) expect(quotes.includes(a) || quotes.includes(`EUR ${ojAmount(a)}`), a).toBe(true)
      for (const pct of c.text.match(/\b\d+%/g) ?? []) expect(quotes, pct).toContain(pct.replace('%', ' %'))
    }
  })

  it('calls the draft a draft wherever it is cited', () => {
    for (const c of all.filter((c) => c.findings.some((s) => s.startsWith('ec-2026-draft')))) {
      expect(c.text.toLowerCase()).toMatch(/draft/)
    }
  })
})
