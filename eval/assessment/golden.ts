// Turns a golden profile into the assessment row production would store, through the real
// scoring code, so the eval and the CI test see exactly what the analysis model would see.
// GOLDEN_PROFILES use the current questions (instrument version 2); GOLDEN_PROFILES_V1 keep the
// 38-question set, so CI proves rows and analyses stored before the rewrite still read.
import golden from './golden-profiles.json';
import goldenV1 from './golden-profiles-v1.json';
import {
  calculateAxisScores,
  calculateOrgDimensionScores,
  calculateOverallScore,
  determineArchetype,
  getReadinessLevel,
  identifyBlockers,
  ORG_DIMENSIONS,
} from '@/src/lib/assessment/scoring';
import { computeQualitySignals } from '@/lib/assessment/quality-signals';
import { ASSESSMENT_AREAS, questionsForTeamSize } from '@/src/assessment-questions-content';
import type { AssessmentWorkflows } from '@/src/lib/assessment/workflows';

interface ProfileBase {
  id: string;
  covers: string;
  company_name: string;
  website: string;
  company_insights: { company_summary: string; ai_maturity: { signals: string[]; confidence: string } };
  durationSeconds: number;
}

export interface GoldenProfile extends ProfileBase {
  team_size: string;
  /** Option scores by area key, in the order that team size is asked. */
  answers: Record<string, number[]>;
  workflows?: AssessmentWorkflows;
}

export interface GoldenProfileV1 extends ProfileBase {
  /** Option scores by version 1 prefix (l, d, t, ta, g, c), in question order. */
  answers: Record<string, number[]>;
}

export const GOLDEN_PROFILES = golden.profiles as GoldenProfile[];
export const GOLDEN_PROFILES_V1 = goldenV1.profiles as GoldenProfileV1[];

/** Version 1 question counts per prefix (l1..l7, d1..d8, t1..t6, ta1..ta7, g1..g5, c1..c5). */
export const QUESTION_COUNTS_V1: Record<string, number> = { l: 7, d: 8, t: 6, ta: 7, g: 5, c: 5 };

export function expandAnswers(p: GoldenProfile): Record<string, number> {
  const questions = questionsForTeamSize(p.team_size);
  const answers: Record<string, number> = {};
  for (const { key } of ASSESSMENT_AREAS) {
    const values = p.answers[key] ?? [];
    if (values.length !== questions[key].length) throw new Error(`${p.id}: ${key} has ${values.length} answers, the form asks ${questions[key].length}`);
    questions[key].forEach((q, i) => {
      answers[q.id] = values[i];
    });
  }
  return answers;
}

export function expandAnswersV1(p: GoldenProfileV1): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const { prefix } of ORG_DIMENSIONS) {
    (p.answers[prefix] ?? []).forEach((v, i) => {
      answers[`${prefix}${i + 1}`] = v;
    });
  }
  return answers;
}

/** The judgment weights version 1 rows were scored with (stored in their overall_score). */
const V1_WEIGHTS: Record<string, number> = {
  'Leadership & Strategy': 0.2,
  'Data Readiness': 0.25,
  'Technology Infrastructure': 0.15,
  'Talent & Capability': 0.15,
  'Governance & Responsible AI': 0.1,
  'Culture & Change Readiness': 0.15,
};

function row(p: ProfileBase, answers: Record<string, number>, workflows: AssessmentWorkflows | null, version: 1 | 2 = 2) {
  const dimensionScores = calculateOrgDimensionScores(answers).map((d) => (version === 1 ? { ...d, weight: V1_WEIGHTS[d.dimension] } : d));
  const overall_score = calculateOverallScore(dimensionScores);
  const axis_scores = calculateAxisScores(dimensionScores);
  return {
    company_name: p.company_name,
    website: p.website,
    company_insights: p.company_insights,
    dimension_scores: Object.fromEntries(dimensionScores.map((d) => [d.dimension, d.score])),
    overall_score,
    readiness_level: getReadinessLevel(overall_score).level,
    blockers: identifyBlockers(dimensionScores),
    archetype: determineArchetype(axis_scores),
    axis_scores,
    duration_seconds: p.durationSeconds,
    quality_signals: computeQualitySignals({ answers, durationSeconds: p.durationSeconds }),
    answers,
    workflows,
  };
}

export function goldenAssessment(p: GoldenProfile) {
  return row(p, expandAnswers(p), p.workflows ?? null);
}

export function goldenAssessmentV1(p: GoldenProfileV1) {
  return row(p, expandAnswersV1(p), null, 1);
}
