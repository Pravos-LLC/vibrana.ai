import { describe, expect, it } from 'vitest';
import {
  calculateAxisScores,
  calculateDimensionScore,
  calculateOverallScore,
  determineArchetype,
  generateRecommendations,
  getReadinessLevel,
  identifyBlockers,
} from '@/src/lib/assessment/scoring';
import type { DimensionScore } from '@/src/types/assessment';

const ORG_DIMENSIONS = [
  'Leadership & Strategy',
  'Culture & Change Readiness',
  'Governance & Responsible AI',
  'Data Readiness',
  'Technology Infrastructure',
  'Talent & Capability',
] as const;

function dims(scores: Partial<Record<(typeof ORG_DIMENSIONS)[number], number>>): DimensionScore[] {
  return ORG_DIMENSIONS.map((dimension) => ({
    dimension,
    score: scores[dimension] ?? 0,
    weight: 1 / 6,
  }));
}

describe('calculateDimensionScore', () => {
  it('averages the answers for the given question ids', () => {
    const answers = { q1: 40, q2: 60, q3: 80 };
    expect(calculateDimensionScore(answers, ['q1', 'q2', 'q3'])).toBe(60);
  });

  it('rounds the average to the nearest integer', () => {
    const answers = { q1: 50, q2: 51 }; // 50.5 -> 51 (Math.round)
    expect(calculateDimensionScore(answers, ['q1', 'q2'])).toBe(51);
    expect(calculateDimensionScore({ q1: 33, q2: 34, q3: 34 }, ['q1', 'q2', 'q3'])).toBe(34); // 33.67
  });

  it('ignores unanswered question ids', () => {
    const answers = { q1: 100 };
    expect(calculateDimensionScore(answers, ['q1', 'missing'])).toBe(100);
  });

  it('returns 0 when no questions are answered', () => {
    expect(calculateDimensionScore({}, ['q1', 'q2'])).toBe(0);
    expect(calculateDimensionScore({ other: 50 }, [])).toBe(0);
  });

  it('includes explicit 0 answers in the average', () => {
    expect(calculateDimensionScore({ q1: 0, q2: 100 }, ['q1', 'q2'])).toBe(50);
  });
});

describe('calculateAxisScores', () => {
  it('averages vision dimensions (Leadership, Culture, Governance) on the Y axis', () => {
    const axis = calculateAxisScores(
      dims({
        'Leadership & Strategy': 90,
        'Culture & Change Readiness': 60,
        'Governance & Responsible AI': 30,
      })
    );
    expect(axis.vision).toBe(60);
    expect(axis.ops).toBe(0);
  });

  it('averages ops dimensions (Data, Tech, Talent) on the X axis', () => {
    const axis = calculateAxisScores(
      dims({
        'Data Readiness': 80,
        'Technology Infrastructure': 70,
        'Talent & Capability': 60,
      })
    );
    expect(axis.ops).toBe(70);
    expect(axis.vision).toBe(0);
  });

  it('rounds each axis average', () => {
    const axis = calculateAxisScores(
      dims({
        'Leadership & Strategy': 50,
        'Culture & Change Readiness': 50,
        'Governance & Responsible AI': 51, // 50.33 -> 50
        'Data Readiness': 50,
        'Technology Infrastructure': 51,
        'Talent & Capability': 51, // 50.67 -> 51
      })
    );
    expect(axis.vision).toBe(50);
    expect(axis.ops).toBe(51);
  });

  it('treats missing dimensions as 0', () => {
    const axis = calculateAxisScores([
      { dimension: 'Leadership & Strategy', score: 90, weight: 1 },
    ]);
    expect(axis.vision).toBe(30); // 90 / 3
    expect(axis.ops).toBe(0);
  });
});

describe('determineArchetype', () => {
  it('returns Apex Integrator when both axes are at or above 50', () => {
    expect(determineArchetype({ vision: 50, ops: 50 }).name).toBe('Apex Integrator');
    expect(determineArchetype({ vision: 100, ops: 100 }).name).toBe('Apex Integrator');
  });

  it('returns Visionary Architect for high vision, low ops', () => {
    expect(determineArchetype({ vision: 50, ops: 49 }).name).toBe('Visionary Architect');
  });

  it('returns Tactical Powerhouse for low vision, high ops', () => {
    expect(determineArchetype({ vision: 49, ops: 50 }).name).toBe('Tactical Powerhouse');
  });

  it('returns Calculated Scout when both axes are below 50', () => {
    expect(determineArchetype({ vision: 49, ops: 49 }).name).toBe('Calculated Scout');
    expect(determineArchetype({ vision: 0, ops: 0 }).name).toBe('Calculated Scout');
  });
});

describe('calculateOverallScore', () => {
  it('computes the weighted sum of dimension scores', () => {
    const score = calculateOverallScore([
      { dimension: 'A', score: 80, weight: 0.5 },
      { dimension: 'B', score: 40, weight: 0.5 },
    ]);
    expect(score).toBe(60);
  });

  it('rounds the weighted sum', () => {
    const score = calculateOverallScore([
      { dimension: 'A', score: 33, weight: 0.5 },
      { dimension: 'B', score: 34, weight: 0.5 },
    ]);
    expect(score).toBe(34); // 33.5 -> 34
  });

  it('returns 0 for an empty list', () => {
    expect(calculateOverallScore([])).toBe(0);
  });
});

describe('getReadinessLevel', () => {
  it('maps each band boundary to the expected level', () => {
    expect(getReadinessLevel(0).level).toBe('Self-reported foundations are limited');
    expect(getReadinessLevel(19).level).toBe('Self-reported foundations are limited');
    expect(getReadinessLevel(20).level).toBe('Self-reported foundations are emerging');
    expect(getReadinessLevel(39).level).toBe('Self-reported foundations are emerging');
    expect(getReadinessLevel(40).level).toBe('Self-reported foundations are developing');
    expect(getReadinessLevel(59).level).toBe('Self-reported foundations are developing');
    expect(getReadinessLevel(60).level).toBe('Self-reported foundations are established');
    expect(getReadinessLevel(79).level).toBe('Self-reported foundations are established');
    expect(getReadinessLevel(80).level).toBe('Self-reported foundations are broad');
    expect(getReadinessLevel(100).level).toBe('Self-reported foundations are broad');
  });

  it('returns the full readiness-level shape', () => {
    const level = getReadinessLevel(70);
    expect(level).toMatchObject({
      level: 'Self-reported foundations are established',
      color: expect.any(String),
      timeline: 'Not predicted by this assessment',
      successRate: 'Not predicted',
    });
  });
});

// Like dims(), but unspecified dimensions score 100, so only the named ones are low.
function low(scores: Partial<Record<(typeof ORG_DIMENSIONS)[number], number>>): DimensionScore[] {
  return dims({ ...Object.fromEntries(ORG_DIMENSIONS.map((d) => [d, 100])), ...scores });
}

describe('identifyBlockers', () => {
  it('returns no blockers when every dimension is at or above 50', () => {
    expect(
      identifyBlockers(
        dims({
          'Leadership & Strategy': 50,
          'Culture & Change Readiness': 60,
          'Governance & Responsible AI': 50,
          'Data Readiness': 70,
          'Technology Infrastructure': 50,
          'Talent & Capability': 100,
        })
      )
    ).toEqual([]);
  });

  it('uses one threshold for every dimension', () => {
    const blockers = identifyBlockers(
      dims({
        'Leadership & Strategy': 49,
        'Culture & Change Readiness': 49,
        'Governance & Responsible AI': 49,
        'Data Readiness': 49,
        'Technology Infrastructure': 49,
        'Talent & Capability': 49,
      })
    );
    expect(blockers).toHaveLength(6);
  });

  it('states what the answers show, lowest first, with no timeline', () => {
    const blockers = identifyBlockers(low({ 'Data Readiness': 20, 'Leadership & Strategy': 40 }));
    expect(blockers[0].dimension).toBe('Data Readiness');
    expect(blockers[0].issue).toBe('Your answers put data readiness at 20/100');
    expect(blockers[0].priority).toBe('high');
    expect(blockers[1].priority).toBe('medium');
    expect(blockers.every((b) => b.timeline === '')).toBe(true);
  });
});

describe('generateRecommendations', () => {
  const allAt = (score: number) => {
    const answers: Record<string, number> = {};
    const counts: Record<string, number> = { l: 7, d: 8, t: 6, ta: 7, g: 5, c: 5 };
    for (const [prefix, n] of Object.entries(counts)) {
      for (let i = 1; i <= n; i++) answers[`${prefix}${i}`] = score;
    }
    return answers;
  };

  it('starts from one workflow and ends with building and measuring it', () => {
    const recs = generateRecommendations(50, low({ 'Data Readiness': 20, 'Culture & Change Readiness': 30 }));
    expect(recs[0].title).toBe('Pick one workflow to start with');
    expect(recs[recs.length - 1].title).toBe('Build it, then measure it');
    expect(recs.map((r) => r.phase)).toEqual(recs.map((_, i) => `Step ${i + 1}`));
  });

  it('works on the two lowest-scoring dimensions', () => {
    const recs = generateRecommendations(
      50,
      dims({
        'Leadership & Strategy': 90,
        'Culture & Change Readiness': 80,
        'Governance & Responsible AI': 70,
        'Data Readiness': 20,
        'Technology Infrastructure': 60,
        'Talent & Capability': 30,
      })
    );
    expect(recs.map((r) => r.title)).toEqual([
      'Pick one workflow to start with',
      'Shore up data readiness',
      'Shore up talent & capability',
      'Build it, then measure it',
    ]);
  });

  it('never tells a buyer with a named executive sponsor to appoint one', () => {
    const answers = { ...allAt(0), l1: 100 };
    const recs = generateRecommendations(10, low({ 'Leadership & Strategy': 14 }), answers);
    const text = recs.flatMap((r) => r.actions).join(' ');
    expect(text).not.toMatch(/executive who owns/);
    expect(text).toMatch(/one-page AI plan/);
  });

  it('cites the answer behind each specific action', () => {
    const answers = { ...allAt(100), d6: 0 };
    const recs = generateRecommendations(90, low({ 'Data Readiness': 88 }), answers);
    const dataStep = recs.find((r) => r.title === 'Shore up data readiness');
    expect(dataStep?.actions).toEqual([
      'Add a simple alert on the one data feed your first workflow depends on (from your answer on data quality monitoring).',
    ]);
  });

  it('carries no invented counts, enterprise platform steps or timeframes', () => {
    const recs = generateRecommendations(30, dims({ 'Data Readiness': 0, 'Technology Infrastructure': 0 }), allAt(0));
    const text = recs.flatMap((r) => [r.title, r.description, ...r.actions]).join(' ');
    expect(text).not.toMatch(/CoE|Center of Excellence|lakehouse|MLOps|Kubernetes|2-3|5-10|10\+/);
    expect(recs.every((r) => r.timeframe === '')).toBe(true);
  });
});

describe('calculateOrgDimensionScores', () => {
  it('keeps Talent (ta*) answers out of the Technology (t*) score', async () => {
    const { calculateOrgDimensionScores } = await import('@/src/lib/assessment/scoring');
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 7; i++) answers[`l${i}`] = 70;
    for (let i = 1; i <= 8; i++) answers[`d${i}`] = 40;
    for (let i = 1; i <= 6; i++) answers[`t${i}`] = 100;
    for (let i = 1; i <= 7; i++) answers[`ta${i}`] = 0;
    for (let i = 1; i <= 5; i++) answers[`g${i}`] = 70;
    for (let i = 1; i <= 5; i++) answers[`c${i}`] = 40;

    const scores = Object.fromEntries(
      calculateOrgDimensionScores(answers).map((d) => [d.dimension, d.score]),
    );
    expect(scores).toEqual({
      'Leadership & Strategy': 70,
      'Data Readiness': 40,
      'Technology Infrastructure': 100,
      'Talent & Capability': 0,
      'Governance & Responsible AI': 70,
      'Culture & Change Readiness': 40,
    });
  });
});
