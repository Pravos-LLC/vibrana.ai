// Code checks on the written analysis. A model never grades these: a number either traces
// to the context or it does not, a banned phrase is either there or not.
//
// Banned words and phrases: the Content Guide's voice list (vibrana-gtm
// content/guide/voice.json, banned_words + banned_phrases) plus the generic report
// failures from the AI Readiness plan (hub gtm/programs/ai-readiness/plan.md, Workstream B):
// unsourced benchmarks, peer comparisons and consultant filler.
import { findUngroundedNumbers } from '@/lib/assessment/analysis-grounding';

/** Matched case-insensitively on word boundaries. */
export const BANNED_PHRASES: readonly string[] = [
  // Content Guide voice list.
  'leverage', 'unlock', 'unleash', 'empower', 'elevate', 'transformative', 'cutting-edge',
  'groundbreaking', 'revolutionize', 'seamless', 'robust', 'holistic', 'synergy', 'curate',
  'foster', 'delve', 'tapestry', 'landscape', 'realm', 'testament', 'symphony', 'spearhead',
  'game-changer', 'game changer', 'embark', 'multifaceted', 'paradigm shift', 'disrupt',
  'digital transformation', 'change management', 'harness the power', '10x', 'supercharge',
  'in the world of', 'it is important to note', "it's important to note", 'at the end of the day',
  'moving forward', 'going forward', 'it goes without saying', 'fully autonomous',
  // Report failures: claims about other companies or the market with no source.
  'studies show', 'research shows', 'industry average', 'industry benchmark', 'most companies',
  'most organizations', 'companies like yours', 'organizations like yours', 'your peers',
  'ahead of the curve', 'ahead of the competition', 'competitors are', 'fall behind',
  'falling behind', 'left behind', 'in today\'s', 'rapidly evolving', 'ever-evolving',
  'journey', 'navigate the complexities', 'not just about', 'stands out', 'well-positioned',
  'well positioned', 'poised to', 'perfectly positioned', 'exciting', 'impressive',
  'cheapest', 'most likely to cause', 'real harm',
];

/** British spellings that slip in. John is American: realize, color, center. */
export const BRITISH_SPELLINGS: readonly string[] = [
  'organisation', 'prioritise', 'optimise', 'optimisation', 'analyse', 'realise', 'recognise',
  'standardise', 'centralise', 'utilise', 'colour', 'centre', 'behaviour', 'programme',
  'licence', 'favour', 'labour', 'modelling', 'judgement', 'catalogue',
];

export const ANALYSIS_WORDS = { min: 90, max: 330 } as const;

export type AnalysisIssue =
  | { kind: 'ungrounded-number'; detail: string }
  | { kind: 'banned-phrase'; detail: string }
  | { kind: 'british-spelling'; detail: string }
  | { kind: 'dash'; detail: string }
  | { kind: 'length'; detail: string }
  | { kind: 'format'; detail: string }
  | { kind: 'basis'; detail: string }
  | { kind: 'consistency'; detail: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A single word also matches its inflections (leveraged, leveraging, fostered, analysed). */
function phrasePattern(phrase: string): RegExp {
  const p = phrase.toLowerCase();
  if (/\s/.test(p) || !/^[a-z-]+$/.test(p)) return new RegExp(`(^|[^a-z0-9])${escapeRe(p)}([^a-z0-9]|$)`);
  const stems = p.endsWith('e') ? `(?:${escapeRe(p)}|${escapeRe(p.slice(0, -1))}ing)` : escapeRe(p);
  return new RegExp(`(^|[^a-z0-9])${stems}[a-z]*([^a-z0-9]|$)`);
}

export function findPhrases(text: string, phrases: readonly string[]): string[] {
  const lower = text.toLowerCase().replace(/[\u2018\u2019]/g, "'");
  return phrases.filter((p) => phrasePattern(p).test(lower));
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Every check on a finished analysis. `context` is everything the model was shown: a number
 * is grounded only when it appears there.
 */
export function validateAnalysisText(
  text: string,
  context: string,
  opts: { words?: { min: number; max: number }; paragraphs?: number } = {}
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  for (const n of findUngroundedNumbers(text, context)) issues.push({ kind: 'ungrounded-number', detail: n });
  for (const p of findPhrases(text, BANNED_PHRASES)) issues.push({ kind: 'banned-phrase', detail: p });
  for (const p of findPhrases(text, BRITISH_SPELLINGS)) issues.push({ kind: 'british-spelling', detail: p });
  if (/[\u2014\u2013]/.test(text)) issues.push({ kind: 'dash', detail: 'em or en dash' });

  const words = wordCount(text);
  const limits = opts.words ?? ANALYSIS_WORDS;
  if (words < limits.min || words > limits.max) {
    issues.push({ kind: 'length', detail: `${words} words (allowed ${limits.min} to ${limits.max})` });
  }
  if (/^\s*#/m.test(text)) issues.push({ kind: 'format', detail: 'heading' });
  if (/\*\*|__/.test(text)) issues.push({ kind: 'format', detail: 'markdown emphasis' });
  if (/^\s*([-*+]|\d+\.)\s/m.test(text)) issues.push({ kind: 'format', detail: 'list item' });
  if (opts.paragraphs) {
    const count = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    if (count !== opts.paragraphs) issues.push({ kind: 'format', detail: `${count} paragraphs (expected ${opts.paragraphs})` });
  }
  return issues;
}

export function describeIssues(issues: AnalysisIssue[]): string {
  return issues.map((i) => `${i.kind}: ${i.detail}`).join('; ');
}
