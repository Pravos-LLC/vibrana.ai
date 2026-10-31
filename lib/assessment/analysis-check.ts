// Code checks on a structured analysis, before any model judges it. Each statement must rest
// on something real: answers the buyer gave (from the right area, at the right end of the
// scale) or a finding we showed the model. Every text field gets the text checks.
import { type AnalysisAllowed } from '@/lib/assessment/build-analysis-prompt';
import { validateAnalysisText, wordCount, type AnalysisIssue } from '@/lib/assessment/analysis-validators';
import { AREAS, type AnalysisBasis, type AnalysisPoint, type StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { areaOfQuestion } from '@/src/lib/assessment/scoring';

export const FIELD_WORDS = {
  summary: { min: 40, max: 130 },
  point: { min: 12, max: 70 },
  startingPoint: { min: 12, max: 90 },
} as const;
export const TOTAL_WORDS = { min: 80, max: 400 } as const;

/** Answers at or above this support a strength; at or below the low mark, a weakness. */
export const STRONG_ANSWER = 70;
export const WEAK_ANSWER = 40;

function areaOf(questionId: string): string | null {
  // Either question set: version 2 ids map through the content file, version 1 ids by prefix.
  return areaOfQuestion(questionId);
}

function checkBasis(
  where: string,
  basis: AnalysisBasis,
  allowed: AnalysisAllowed,
  opts: { area?: string; end?: 'strong' | 'weak' }
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  if (basis.kind === 'finding') {
    const shownFor = allowed.findings[basis.slug];
    if (!shownFor) issues.push({ kind: 'basis', detail: `${where}: finding "${basis.slug}" was not in the list` });
    else if (opts.end === 'strong') issues.push({ kind: 'basis', detail: `${where}: a strength must rest on their answers, not research` });
    else if (opts.area && shownFor !== opts.area) issues.push({ kind: 'basis', detail: `${where}: finding "${basis.slug}" is about ${shownFor}, not ${opts.area}` });
    return issues;
  }
  for (const id of basis.questions) {
    const value = allowed.answers[id];
    if (value === undefined) {
      issues.push({ kind: 'basis', detail: `${where}: "${id}" is not one of their answers` });
      continue;
    }
    if (opts.area && areaOf(id) !== opts.area) issues.push({ kind: 'basis', detail: `${where}: ${id} is not a ${opts.area} question` });
    if (opts.end === 'strong' && value < STRONG_ANSWER) issues.push({ kind: 'basis', detail: `${where}: ${id} is not a strong answer` });
    if (opts.end === 'weak' && value > WEAK_ANSWER) issues.push({ kind: 'basis', detail: `${where}: ${id} is not a weak answer` });
  }
  return issues;
}

function rank(scores: Record<string, number>, area: string, dir: 'top' | 'bottom', n = 3): boolean {
  const s = scores[area];
  if (s === undefined) return false;
  const sorted = Object.values(scores).sort((a, b) => (dir === 'top' ? b - a : a - b));
  const cutoff = sorted[Math.min(n, sorted.length) - 1];
  return dir === 'top' ? s >= cutoff : s <= cutoff;
}

function checkPoints(kind: 'strongest' | 'weakest', points: AnalysisPoint[], allowed: AnalysisAllowed): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  if (points.length > 2) issues.push({ kind: 'format', detail: `${kind}: ${points.length} items (at most 2)` });
  const seen = new Set<string>();
  points.forEach((p, i) => {
    const where = `${kind}[${i}]`;
    if (!AREAS.includes(p.area)) {
      issues.push({ kind: 'consistency', detail: `${where}: unknown area "${p.area}"` });
      return;
    }
    if (seen.has(p.area)) issues.push({ kind: 'consistency', detail: `${where}: ${p.area} listed twice` });
    seen.add(p.area);
    if (!rank(allowed.scores, p.area, kind === 'strongest' ? 'top' : 'bottom')) {
      issues.push({ kind: 'consistency', detail: `${where}: ${p.area} (${allowed.scores[p.area]}) is not one of their ${kind === 'strongest' ? 'highest' : 'lowest'}-scoring areas` });
    }
    issues.push(...checkBasis(where, p.basis, allowed, { area: p.area, end: kind === 'strongest' ? 'strong' : 'weak' }));
  });
  return issues;
}

/** The text of every field, in reading order. */
export function analysisTexts(a: StructuredAnalysis): { where: string; text: string; words: { min: number; max: number } }[] {
  return [
    { where: 'summary', text: a.summary, words: FIELD_WORDS.summary },
    ...a.strongest.map((p, i) => ({ where: `strongest[${i}]`, text: p.text, words: FIELD_WORDS.point })),
    ...a.weakest.map((p, i) => ({ where: `weakest[${i}]`, text: p.text, words: FIELD_WORDS.point })),
    { where: 'starting_point', text: a.startingPoint.text, words: FIELD_WORDS.startingPoint },
  ];
}

export function validateStructuredAnalysis(a: StructuredAnalysis, facts: string, allowed: AnalysisAllowed): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  issues.push(...checkPoints('strongest', a.strongest, allowed));
  issues.push(...checkPoints('weakest', a.weakest, allowed));
  if (a.weakest.length === 0 && Object.values(allowed.answers).some((v) => v <= WEAK_ANSWER)) {
    issues.push({ kind: 'format', detail: 'weakest: empty, but some answers are at the bottom of the scale' });
  }
  if (a.strongest.length === 0 && a.weakest.length === 0) issues.push({ kind: 'format', detail: 'no strongest or weakest area' });
  for (const s of a.strongest) {
    if (a.weakest.some((w) => w.area === s.area)) issues.push({ kind: 'consistency', detail: `${s.area} is listed as both strongest and weakest` });
  }
  issues.push(...checkBasis('starting_point', a.startingPoint.basis, allowed, {}));

  for (const f of analysisTexts(a)) {
    for (const i of validateAnalysisText(f.text, facts, { words: f.words })) issues.push({ ...i, detail: `${f.where}: ${i.detail}` });
  }
  const total = analysisTexts(a).reduce((n, f) => n + wordCount(f.text), 0);
  if (total < TOTAL_WORDS.min || total > TOTAL_WORDS.max) {
    issues.push({ kind: 'length', detail: `total ${total} words (allowed ${TOTAL_WORDS.min} to ${TOTAL_WORDS.max})` });
  }
  return issues;
}
