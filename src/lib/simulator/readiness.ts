/**
 * The AI readiness baseline: six self-reported answers become a 0 to 100 score, and the score
 * moves WHEN value arrives and what it costs to get there (adoption half-time, training hours,
 * governance setup, and which outside help is worth looking at). It never scales the benefit
 * per person: no source ties readiness to that. The assessment says it predicts no timeline,
 * so the effect is shown as a modeling choice. See research/simulator-v3/07-readiness-to-cost.md.
 */
import {
  READINESS_GOVERNANCE_STEPS,
  READINESS_NEUTRAL,
  READINESS_T0_SLOPE,
  READINESS_TRAINING_FLOOR,
  READINESS_TRAINING_SLOPE,
  READINESS_UNSURE,
  READINESS_WEIGHTS,
} from './assumptions';
import { READINESS_ANSWERS, READINESS_DIMENSIONS, type ReadinessInput, type ReadinessResolved } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function readinessAnswered(input: ReadinessInput | undefined): number {
  return input ? READINESS_DIMENSIONS.filter((d) => input[d] !== undefined).length : 0;
}

/** Weighted sum of the six answers, rounded; null when nothing was answered. */
export function readinessScore(input: ReadinessInput | undefined): number | null {
  if (readinessAnswered(input) === 0) return null;
  const sum = READINESS_DIMENSIONS.reduce((acc, d) => acc + READINESS_WEIGHTS[d].value * (input![d] ?? READINESS_UNSURE.value), 0);
  return Math.round(sum);
}

/** The assessment's own score bands. */
export function readinessBand(score: number): 'limited' | 'emerging' | 'developing' | 'established' | 'broad' {
  return score < 20 ? 'limited' : score < 40 ? 'emerging' : score < 60 ? 'developing' : score < 80 ? 'established' : 'broad';
}

export function resolveReadiness(input: ReadinessInput | undefined): ReadinessResolved {
  const score = readinessScore(input);
  const effective = score ?? READINESS_NEUTRAL.value;
  const index = clamp((effective - 50) / 50, -1, 1);
  const step = READINESS_GOVERNANCE_STEPS.value.find((s) => effective >= s.minScore)!;
  return {
    score,
    answered: readinessAnswered(input),
    index,
    t0Multiplier: 1 - READINESS_T0_SLOPE.value * index,
    trainingMultiplier: 1 - READINESS_TRAINING_SLOPE.value * index,
    // Unanswered stays exactly neutral: today's governance setup hours.
    governanceMultiplier: score === null ? 1 : step.multiplier,
  };
}

/** Training hours per person, never below the floor, and unchanged at the neutral baseline. */
export function trainingHoursFor(base: number, r: ReadinessResolved): number {
  return r.index === 0 ? base : Math.max(READINESS_TRAINING_FLOOR.value, base * r.trainingMultiplier);
}

export function validReadinessAnswer(v: unknown): v is (typeof READINESS_ANSWERS)[number] {
  return (READINESS_ANSWERS as readonly unknown[]).includes(v);
}
