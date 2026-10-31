import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ASSESSMENT_AREAS, ASSESSMENT_QUESTIONS, ASSESSMENT_QUESTION_COUNT, ASSESSMENT_QUESTION_COUNT_SMALL } from '@/src/assessment-questions-content';
import { describe, expect, it } from 'vitest';
import selection from '@/src/lib/readiness-page/evidence-selection.json';
import { READINESS_ENGAGEMENTS, READINESS_FINDINGS, cite } from '@/src/lib/readiness-page/evidence';
import * as content from '@/src/ai-readiness-content';
import {
  READINESS_CASES,
  READINESS_FACTORS,
  READINESS_METHOD,
  READINESS_OWN_CASES,
  READINESS_PROBLEM,
  READINESS_QUOTES,
} from '@/src/ai-readiness-content';
import { ORG_DIMENSIONS } from '@/src/lib/assessment/scoring';

// Every number on /ai-readiness must trace to the knowledge-base snapshot. A number is a run
// of digits (with , or .), so "4,454", "0.20" and "11,556" are checked whole.
const numbers = (text: string) => (text.match(/\d[\d,.]*\d|\d/g) ?? []).map((n) => n.replace(/[.,]$/, ''));
const norm = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

function findingText(slugs: readonly string[]) {
  return slugs
    .map((s) => {
      const f = READINESS_FINDINGS[s];
      expect(f, `finding ${s} is in the ledger snapshot`).toBeDefined();
      return `${f.claim} ${f.quote}`;
    })
    .join(' ');
}

function expectNumbersIn(text: string, corpus: string, where: string) {
  for (const n of numbers(text)) expect(corpus, `${where}: "${n}" from "${text}"`).toContain(n);
}

/** Numbers in a sample line must come from the source's method line or a finding from it. */
function expectSample(sample: string, slugs: readonly string[], where: string) {
  const ids = new Set(slugs.map((s) => READINESS_FINDINGS[s].source.id));
  const corpus = Object.values(READINESS_FINDINGS)
    .filter((f) => ids.has(f.source.id))
    .map((f) => `${f.source.method} ${f.source.published} ${f.claim}`)
    .join(' ');
  expectNumbersIn(sample, corpus, `${where} sample`);
}

// Walk the content module for every `finding` / `findings` reference.
function referencedFindings(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => referencedFindings(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'finding' || k === 'sampleFrom') && typeof v === 'string') out.push(v);
      else if (k === 'findings' && Array.isArray(v)) out.push(...(v as string[]));
      else referencedFindings(v, out);
    }
  }
  return out;
}

// "100+ people" for Orion is John's standing decision (hub gtm/programs/ai-readiness/plan.md,
// Decisions 2026-10-12, item 5), not a row in the engagement page.
const DECIDED_PROFILE_NUMBERS: Record<string, string[]> = { 'orion-tech': ['100'] };

describe('/ai-readiness evidence', () => {
  const cited = [...new Set(referencedFindings(content))];

  it('cites only selected findings that the hub ledger let through', () => {
    expect(cited.length).toBeGreaterThan(20);
    for (const slug of cited) {
      expect(selection.findings, `${slug} is in evidence-selection.json`).toContain(slug);
      const f = READINESS_FINDINGS[slug];
      expect(f, slug).toBeDefined();
      expect(['public', 'anonymized']).toContain(f.publishable);
      expect(f.url).toMatch(/^https:\/\//);
      expect(f.source.publisher && f.source.published && f.source.method, slug).toBeTruthy();
      expect(cite(slug).year).toMatch(/^20\d\d$/);
    }
  });

  it('every selected finding is used on the page', () => {
    for (const slug of selection.findings) expect(cited, slug).toContain(slug);
  });

  it('every headline stat and its sample trace to the cited finding', () => {
    for (const s of READINESS_PROBLEM.stats) {
      expectNumbersIn(`${s.value} ${s.label}`, findingText([s.finding]), s.finding);
      expectSample(s.sample, [s.finding], s.finding);
      if ('sampleFrom' in s && s.sampleFrom) {
        expect(READINESS_FINDINGS[s.sampleFrom].source.id).toBe(READINESS_FINDINGS[s.finding].source.id);
      }
    }
    const split = READINESS_PROBLEM.split;
    expectNumbersIn(split.segments.map((x) => x.value).join(' '), findingText([split.finding]), 'split');
    expect(split.segments.reduce((a, x) => a + x.value, 0)).toBe(100);
    expectSample(split.sample, [split.finding], 'split');
  });

  it('every chart value traces to its finding', () => {
    for (const g of READINESS_FACTORS.chart.groups) {
      for (const r of g.rows) {
        expectNumbersIn(`${r.leaders} ${r.rest} ${r.label}`, findingText([r.finding]), r.finding);
        expect(r.leaders).toBeGreaterThan(r.rest);
        expect(READINESS_FINDINGS[r.finding].source.id).toBe(READINESS_FINDINGS[g.finding].source.id);
      }
      expectNumbersIn(g.definition, findingText(g.rows.map((r) => r.finding)) + READINESS_FINDINGS[g.finding].source.method, `${g.source} definition`);
      expectSample(g.sample, [g.finding], g.source);
    }
    const b = READINESS_METHOD.benchmark;
    expectNumbersIn(b.bars.map((x) => x.value).join(' '), findingText([b.finding]), 'benchmark');
    expectSample(b.sample, [b.finding], 'benchmark');
  });

  it('every number in the research prose traces to the findings it cites', () => {
    const blocks = [
      { text: READINESS_FACTORS.lead.text, findings: READINESS_FACTORS.lead.findings },
      { text: READINESS_FACTORS.caveat.body, findings: READINESS_FACTORS.caveat.findings },
      ...READINESS_FACTORS.practices.map((p) => ({ text: p.body, findings: [p.finding] })),
      ...READINESS_CASES.cases.map((c) => ({ text: `${c.reported} ${c.evidence} ${c.caveat} ${c.lesson}`, findings: c.findings })),
    ];
    for (const { text, findings } of blocks) {
      const years = findings.map((s) => READINESS_FINDINGS[s].source.published).join(' ');
      expectNumbersIn(text, `${findingText(findings)} ${years}`, findings[0]);
    }
  });

  it('every number in our own cases is an approved fact', () => {
    for (const c of READINESS_OWN_CASES.cases) {
      const e = READINESS_ENGAGEMENTS[c.engagement];
      expect(e, c.engagement).toBeDefined();
      const corpus = `${e.facts.join(' ')} ${e.client} ${(DECIDED_PROFILE_NUMBERS[c.engagement] ?? []).join(' ')}`;
      for (const s of c.stats) expectNumbersIn(`${s.value} ${s.label}`, corpus, c.name);
      expectNumbersIn(`${c.profile} ${c.summary}`, corpus, c.name);
    }
    // Meridian's hours are always shown as the client's estimate, with the arithmetic.
    const meridian = READINESS_OWN_CASES.cases.find((c) => c.engagement === 'meridian-estates')!;
    const hours = meridian.stats.find((s) => s.value.includes('528'))!;
    expect(hours.label).toMatch(/estimate/i);
    expect(hours.label).toContain('7 to 11 hrs a week x 48 weeks');
  });

  it('quotes are verbatim from a finding or an engagement’s approved quotes', () => {
    for (const q of READINESS_QUOTES.research) expect(norm(READINESS_FINDINGS[q.finding].quote)).toContain(norm(q.text));
    for (const q of READINESS_QUOTES.clients) {
      expect(READINESS_ENGAGEMENTS[q.engagement].quotes.map(norm)).toContain(norm(q.text));
      // Attributed by role, never by name.
      expect(q.attribution).toMatch(/^(An? |Leader of)/);
    }
  });

  it('describes the six areas the assessment actually scores, with the right question counts', () => {
    expect(READINESS_METHOD.areas.map((a) => a.name)).toEqual(ORG_DIMENSIONS.map((d) => d.dimension));
    // The questions the form actually asks (src/assessment-questions-content.ts), full set.
    let total = 0;
    for (const a of READINESS_METHOD.areas) {
      const key = ASSESSMENT_AREAS.find((x) => x.dimension === a.name)!.key;
      expect(a.questions, a.name).toBe(ASSESSMENT_QUESTIONS[key].length);
      total += a.questions;
    }
    expect(total).toBe(ASSESSMENT_QUESTION_COUNT);
    // Every count the page states matches the form: the full set and the shorter set for small teams.
    const text = JSON.stringify(content);
    for (const n of text.match(/\b(\d+) (?:multiple-choice )?questions\b/g) ?? []) {
      expect([ASSESSMENT_QUESTION_COUNT, ASSESSMENT_QUESTION_COUNT_SMALL], n).toContain(Number(n.split(' ')[0]));
    }
    expect(text).toContain(`${ASSESSMENT_QUESTION_COUNT} multiple-choice questions`);
    expect(text).toContain(`${ASSESSMENT_QUESTION_COUNT_SMALL} for teams of 50 or fewer`);
  });

  it('keeps the house rules: no dashes, no banned claims, no time estimate', () => {
    const text = JSON.stringify(content);
    expect(text).not.toMatch(/[–—]/);
    // The contested MIT NANDA figure and IBM's integration-software ROI are never cited.
    expect(text).not.toMatch(/95%|176|IBM/);
    // No completion time: it has never been measured.
    expect(text).not.toMatch(/\bminutes? to (complete|finish)|\d+\s*min\b/i);
    expect(text).not.toMatch(/\b(leverage|unlock|empower|seamless|transformative|landscape|change management|upskill|replace|headcount savings)\b/i);
    expect(text).not.toMatch(/\b(organisation|realise|colour|centre|analyse|programme)\b/i);
  });
});
