// The written analysis as data: a fixed shape the model drafts into, the code validates, the
// judge grades, the database stores and every surface (web, email, PDF) renders.
import { ORG_DIMENSIONS } from '@/src/lib/assessment/scoring';

export const AREAS = ORG_DIMENSIONS.map((d) => d.dimension) as string[];

/** What a statement rests on: the buyer's own answers (question ids) or one published finding. */
export type AnalysisBasis = { kind: 'answers'; questions: string[] } | { kind: 'finding'; slug: string };

export interface AnalysisPoint {
  area: string;
  text: string;
  basis: AnalysisBasis;
}

export interface StructuredAnalysis {
  version: 1;
  summary: string;
  strongest: AnalysisPoint[];
  weakest: AnalysisPoint[];
  startingPoint: { text: string; basis: AnalysisBasis };
}

const point = (what: string) => ({
  type: 'object',
  properties: {
    area: { type: 'string', enum: AREAS },
    point: { type: 'string', description: `${what} One or two plain sentences, 15 to 55 words, about this company only.` },
    answer_ids: {
      type: 'array',
      items: { type: 'string' },
      description: 'The ids of the questions (from this area) whose answers the point rests on, e.g. ["l_owner", "l_measure"].',
    },
    finding_id: { type: 'string', description: 'Only for a weakest point that rests on research instead: one research id from the list. Otherwise empty.' },
  },
  required: ['area', 'point', 'answer_ids', 'finding_id'],
  additionalProperties: false,
});

/** Sent to the model as a strict JSON schema. Counts and cross-checks are enforced in code. */
export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One paragraph, 40 to 110 words: what their answers and website say about where they stand.' },
    strongest: { type: 'array', items: point('Why this area is one of their strongest.'), description: 'Zero to two of their highest-scoring areas.' },
    weakest: { type: 'array', items: point('What holds this area back.'), description: 'One or two of their lowest-scoring areas.' },
    starting_point: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'One concrete thing they can start this month without outside help, 15 to 70 words.' },
        answer_ids: { type: 'array', items: { type: 'string' }, description: 'The question ids it follows from.' },
        finding_id: { type: 'string', description: 'Empty unless it rests on one research id instead.' },
      },
      required: ['action', 'answer_ids', 'finding_id'],
      additionalProperties: false,
    },
  },
  required: ['summary', 'strongest', 'weakest', 'starting_point'],
  additionalProperties: false,
} as const;

/** Answers win when both are given: a statement about this company should rest on what they said. */
function toBasis(answerIds: unknown, findingId: unknown): AnalysisBasis | null {
  const ids = Array.isArray(answerIds) ? [...new Set(answerIds.filter((r): r is string => typeof r === 'string').map((r) => r.trim()).filter(Boolean))] : [];
  if (ids.length > 0) return { kind: 'answers', questions: ids };
  if (typeof findingId === 'string' && findingId.trim()) return { kind: 'finding', slug: findingId.trim() };
  return null;
}

function toPoint(v: unknown): AnalysisPoint | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  if (typeof p.area !== 'string' || typeof p.point !== 'string' || !p.point.trim()) return null;
  const basis = toBasis(p.answer_ids, p.finding_id);
  return basis ? { area: p.area, text: p.point.trim(), basis } : null;
}

/** Shape only. Returns null when the reply does not match the schema. */
export function parseAnalysis(value: unknown): StructuredAnalysis | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.summary !== 'string' || !v.summary.trim()) return null;
  if (!Array.isArray(v.strongest) || !Array.isArray(v.weakest)) return null;
  const strongest = v.strongest.map(toPoint);
  const weakest = v.weakest.map(toPoint);
  if (strongest.includes(null) || weakest.includes(null)) return null;
  const sp = v.starting_point as Record<string, unknown> | undefined;
  if (!sp || typeof sp.action !== 'string' || !sp.action.trim()) return null;
  const spBasis = toBasis(sp.answer_ids, sp.finding_id);
  if (!spBasis) return null;
  return {
    version: 1,
    summary: v.summary.trim(),
    strongest: strongest as AnalysisPoint[],
    weakest: weakest as AnalysisPoint[],
    startingPoint: { text: sp.action.trim(), basis: spBasis },
  };
}

/** True for a stored analysis in this shape (rows from before it hold a markdown string instead). */
export function isStructuredAnalysis(v: unknown): v is StructuredAnalysis {
  return !!v && typeof v === 'object' && (v as StructuredAnalysis).version === 1 && typeof (v as StructuredAnalysis).summary === 'string';
}
