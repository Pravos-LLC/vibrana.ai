import {
  AssessmentAnswer,
  DimensionScore,
  ReadinessLevel,
  Blocker,
  Recommendation,
  Archetype,
  AxisScores,
} from '@/src/types/assessment';
import { ASSESSMENT_AREAS, ASSESSMENT_QUESTIONS, ASSESSMENT_INSTRUMENT_VERSION } from '@/src/assessment-questions-content';
import { ASSESSMENT_QUESTIONS_V1, QUESTION_ACTIONS_V1 } from '@/src/assessment-questions-v1-content';
import { ASSESSMENT_RECOMMENDATIONS as R, areaInText } from '@/src/assessment-recommendations-content';

export const ARCHETYPES: Record<string, Archetype> = {
  ApexIntegrator: {
    name: 'Apex Integrator',
    title: 'The Apex Integrator',
    description: 'Your answers put both vision (leadership, culture, governance) and operations (data, technology, talent) at 50 or above. Each is the average of your answers in those areas; 50 is the midpoint of the scale, not a comparison with other companies.',
    hook: 'Strong on vision and operations',
    color: '#7c3aed', // Vibrana emerald (primary)
  },
  VisionaryArchitect: {
    name: 'Visionary Architect',
    title: 'The Visionary Architect',
    description: 'Your answers put vision (leadership, culture, governance) at 50 or above and operations (data, technology, talent) below 50. Each is the average of your answers in those areas; 50 is the midpoint of the scale, not a comparison with other companies.',
    hook: 'Vision ahead of operations',
    color: '#3b82f6', // Vibrana accent purple
  },
  TacticalPowerhouse: {
    name: 'Tactical Powerhouse',
    title: 'The Tactical Powerhouse',
    description: 'Your answers put operations (data, technology, talent) at 50 or above and vision (leadership, culture, governance) below 50. Each is the average of your answers in those areas; 50 is the midpoint of the scale, not a comparison with other companies.',
    hook: 'Operations ahead of vision',
    color: '#2dd4bf', // Vibrana amber
  },
  CalculatedScout: {
    name: 'Calculated Scout',
    title: 'The Calculated Scout',
    description: 'Your answers put both vision (leadership, culture, governance) and operations (data, technology, talent) below 50. Each is the average of your answers in those areas; 50 is the midpoint of the scale, not a comparison with other companies.',
    hook: 'Early on both',
    color: '#4ade80', // Vibrana lime
  }
};

export function calculateDimensionScore(
  answers: Record<string, number>,
  questionIds: string[]
): number {
  const dimensionAnswers = questionIds.map((id) => answers[id]);
  const validAnswers = dimensionAnswers.filter((a): a is number => a !== undefined);
  if (validAnswers.length === 0) return 0;
  const sum = validAnswers.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / validAnswers.length);
}

// The six areas. Every area counts the same in the overall score: no study fits weights to
// outcomes (hub knowledge/questions/what-predicts-ai-readiness.md, "On weights"), so equal
// weights are the honest default, stated as such in docs/assessment-methodology.md.
// `prefix` is the version 1 id prefix (l1..l7, d1..d8, t1..t6, ta1..ta7, g1..g5, c1..c5), kept so
// old rows still score and read; version 2 ids map to their area through the content file.
export const ORG_DIMENSIONS = [
  { dimension: 'Leadership & Strategy', key: 'leadership', prefix: 'l', weight: 1 / 6 },
  { dimension: 'Data Readiness', key: 'data', prefix: 'd', weight: 1 / 6 },
  { dimension: 'Technology Infrastructure', key: 'technology', prefix: 't', weight: 1 / 6 },
  { dimension: 'Talent & Capability', key: 'talent', prefix: 'ta', weight: 1 / 6 },
  { dimension: 'Governance & Responsible AI', key: 'governance', prefix: 'g', weight: 1 / 6 },
  { dimension: 'Culture & Change Readiness', key: 'culture', prefix: 'c', weight: 1 / 6 },
] as const;

/** Question id -> area name, for both instrument versions (their ids never overlap). */
const AREA_OF_QUESTION: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const { key, dimension } of ASSESSMENT_AREAS) {
    for (const q of ASSESSMENT_QUESTIONS[key]) map[q.id] = dimension;
  }
  for (const { key, dimension } of ORG_DIMENSIONS) {
    for (const q of ASSESSMENT_QUESTIONS_V1[key] ?? []) map[q.id] = dimension;
  }
  return map;
})();

/** The area a question belongs to, or null for an id neither instrument asks. */
export function areaOfQuestion(id: string): string | null {
  return AREA_OF_QUESTION[id] ?? null;
}

/** Which instrument a set of answers came from: 2 (current), 1 (before 2026-10-16), or null when mixed or unknown. */
export function instrumentVersionOf(answers: Record<string, unknown>): 1 | 2 | null {
  const ids = Object.keys(answers);
  if (ids.length === 0) return null;
  const v2 = new Set(Object.values(ASSESSMENT_QUESTIONS).flat().map((q) => q.id));
  const v1 = new Set(Object.values(ASSESSMENT_QUESTIONS_V1).flat().map((q) => q.id));
  if (ids.every((id) => v2.has(id))) return ASSESSMENT_INSTRUMENT_VERSION as 2;
  if (ids.every((id) => v1.has(id))) return 1;
  return null;
}

const OPTION_SCORES: Map<string, Set<number>> = new Map(
  [...Object.values(ASSESSMENT_QUESTIONS).flat(), ...Object.values(ASSESSMENT_QUESTIONS_V1).flat()].map((q) => [
    q.id,
    new Set(q.options.map((o) => o.score)),
  ])
);

/** True when the score is one of the options that question offers, in either instrument. */
export function isOptionScore(id: string, score: unknown): boolean {
  return typeof score === 'number' && !!OPTION_SCORES.get(id)?.has(score);
}

/** The answered question ids in one area, in either instrument. */
export function questionIdsForDimension(answers: Record<string, number>, dimension: string): string[] {
  return Object.keys(answers).filter((id) => AREA_OF_QUESTION[id] === dimension);
}

/** Version 1 only: ids matched as prefix + digits (a bare startsWith('t') also caught ta1..). */
export function questionIdsForPrefix(answers: Record<string, number>, prefix: string): string[] {
  const pattern = new RegExp(`^${prefix}\\d+$`);
  return Object.keys(answers).filter((k) => pattern.test(k));
}

export function calculateOrgDimensionScores(answers: Record<string, number>): DimensionScore[] {
  return ORG_DIMENSIONS.map(({ dimension, weight }) => ({
    dimension,
    score: calculateDimensionScore(answers, questionIdsForDimension(answers, dimension)),
    weight,
  }));
}

export function calculateAxisScores(dimensionScores: DimensionScore[]): AxisScores {
  const scores = dimensionScores.reduce((acc, dim) => ({
    ...acc,
    [dim.dimension]: dim.score
  }), {} as Record<string, number>);

  // Y-Axis: Strategic Vision (Leadership, Culture, Governance)
  const visionScore = Math.round(
    ((scores['Leadership & Strategy'] || 0) + 
     (scores['Culture & Change Readiness'] || 0) + 
     (scores['Governance & Responsible AI'] || 0)) / 3
  );

  // X-Axis: Operational Capability (Data, Tech, Talent)
  const opsScore = Math.round(
    ((scores['Data Readiness'] || 0) + 
     (scores['Technology Infrastructure'] || 0) + 
     (scores['Talent & Capability'] || 0)) / 3
  );

  return { vision: visionScore, ops: opsScore };
}

export function determineArchetype(axisScores: AxisScores): Archetype {
  const { vision, ops } = axisScores;
  const THRESHOLD = 50; // Midpoint

  if (vision >= THRESHOLD && ops >= THRESHOLD) return ARCHETYPES.ApexIntegrator;
  if (vision >= THRESHOLD && ops < THRESHOLD) return ARCHETYPES.VisionaryArchitect;
  if (vision < THRESHOLD && ops >= THRESHOLD) return ARCHETYPES.TacticalPowerhouse;
  return ARCHETYPES.CalculatedScout;
}

export function calculateOverallScore(dimensionScores: DimensionScore[]): number {
  const weightedSum = dimensionScores.reduce(
    (acc, dim) => acc + dim.score * dim.weight,
    0
  );
  return Math.round(weightedSum);
}

export function getReadinessLevel(score: number): ReadinessLevel {
  if (score < 20) {
    return {
      level: 'Self-reported foundations are limited',
      color: '#ef4444',
      timeline: 'Not predicted by this assessment',
      successRate: 'Not predicted',
    };
  }
  if (score < 40) {
    return {
      level: 'Self-reported foundations are emerging',
      color: '#f97316',
      timeline: 'Not predicted by this assessment',
      successRate: 'Not predicted',
    };
  }
  if (score < 60) {
    return {
      level: 'Self-reported foundations are developing',
      color: '#eab308',
      timeline: 'Not predicted by this assessment',
      successRate: 'Not predicted',
    };
  }
  if (score < 80) {
    return {
      level: 'Self-reported foundations are established',
      color: '#22c55e',
      timeline: 'Not predicted by this assessment',
      successRate: 'Not predicted',
    };
  }
  return {
    level: 'Self-reported foundations are broad',
    color: '#2dd4bf',
    timeline: 'Not predicted by this assessment',
    successRate: 'Not predicted',
  };
}

// One threshold for every dimension. The old per-dimension cutoffs (<40, <50, <60) had no
// stated rationale.
export const LOW_DIMENSION_THRESHOLD = 50;

export function identifyBlockers(
  dimensionScores: DimensionScore[]
): Blocker[] {
  return dimensionScores
    .filter((dim) => dim.score < LOW_DIMENSION_THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .map((dim) => ({
      dimension: dim.dimension,
      issue: `Your answers put ${areaInText(dim.dimension)} at ${dim.score}/100`,
      impact: 'Below 50 on your answers. Your next steps start from the specific answers behind it.',
      timeline: '',
      priority: dim.score < 35 ? 'high' : 'medium',
    }));
}

// Each question maps to one practical next step, used only when that question was answered
// at 40 or below. Steps are workflow-first and carry no invented numbers. The current questions
// carry their own (src/assessment-questions-content.ts); version 1 ids keep theirs for old rows.
export const QUESTION_ACTIONS: Record<string, { topic: string; action: string }> = {
  ...QUESTION_ACTIONS_V1,
  ...Object.fromEntries(
    Object.values(ASSESSMENT_QUESTIONS)
      .flat()
      .map((q) => [q.id, { topic: q.topic, action: q.action }]),
  ),
};

function actionsForDimension(dimension: string, answers: Record<string, number>): string[] {
  const low = questionIdsForDimension(answers, dimension)
    .filter((id) => answers[id] <= 40 && QUESTION_ACTIONS[id])
    .sort((a, b) => answers[a] - answers[b])
    .slice(0, 3);
  if (low.length === 0) {
    const fallback = R.fallbackActions[dimension as keyof typeof R.fallbackActions];
    return fallback ? [fallback] : [];
  }
  return low.map((id) => R.fromAnswer(QUESTION_ACTIONS[id].action, QUESTION_ACTIONS[id].topic));
}

/** The workflow the report starts from, when the buyer named any (src/lib/assessment/workflows.ts). */
export interface StartingWorkflow {
  name: string;
  /** Its time-saved range comes from a study of a different task. */
  borrowedEvidence: boolean;
}

// The plan starts from one workflow (the one they named that frees the most hours, if they named
// any), works on the two lowest-scoring areas using the specific answers behind them, and ends
// with building and measuring that workflow. It never recommends something the buyer said they
// already have. Copy: src/assessment-recommendations-content.ts.
export function generateRecommendations(
  _overallScore: number,
  dimensionScores: DimensionScore[],
  answers: Record<string, number> = {},
  startWith: StartingWorkflow | null = null
): Recommendation[] {
  const lowest = [...dimensionScores]
    .filter((d) => d.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const first = startWith ? R.startNamed(startWith.name, startWith.borrowedEvidence) : R.startUnnamed;
  const recommendations: Recommendation[] = [{ phase: R.phase(1), ...first, actions: [...first.actions], timeframe: '' }];

  lowest.forEach((dim, index) => {
    recommendations.push({
      phase: R.phase(index + 2),
      title: R.shoreUpTitle(dim.dimension),
      description: R.shoreUpDescription(dim.dimension, dim.score),
      actions: actionsForDimension(dim.dimension, answers),
      timeframe: '',
    });
  });

  recommendations.push({
    phase: R.phase(recommendations.length + 1),
    ...R.build,
    actions: [...R.build.actions],
    timeframe: '',
  });

  return recommendations;
}
