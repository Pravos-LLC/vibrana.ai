import { describe, expect, it } from 'vitest';
import { simulate, validateInputs, SimulatorInputError } from '@/src/lib/simulator/engine';
import { readinessAnswered, readinessBand, readinessScore, resolveReadiness, trainingHoursFor } from '@/src/lib/simulator/readiness';
import { sanitizeInputs } from '@/src/lib/simulator/server/sanitize';
import type { ReadinessInput, SimulatorInputs } from '@/src/lib/simulator/types';

const BASE: SimulatorInputs = {
  domain: null,
  headcount: 200,
  sector: 'professional-services',
  providers: ['anthropic', 'google'],
  cap: 50,
  dataRule: 'internal',
  pace: 'steady',
  overrides: { hourlyCost: 60 },
};
const ALL = (v: 0 | 40 | 70 | 100): ReadinessInput => ({ leadership: v, data: v, technology: v, talent: v, governance: v, culture: v });

describe('readiness score', () => {
  it('is null with no answers and the weighted sum otherwise', () => {
    expect(readinessScore(undefined)).toBeNull();
    expect(readinessScore({})).toBeNull();
    expect(readinessScore(ALL(100))).toBe(100);
    expect(readinessScore(ALL(0))).toBe(0);
    expect(readinessScore(ALL(70))).toBe(70);
  });

  it('counts a missing answer as not sure (40)', () => {
    expect(readinessAnswered({ leadership: 100 })).toBe(1);
    // 100 x 0.22 + five unsure answers at 40 x 0.78 = 53.2
    expect(readinessScore({ leadership: 100 })).toBe(53);
  });

  it('uses the assessment bands', () => {
    expect([10, 30, 50, 70, 90].map(readinessBand)).toEqual(['limited', 'emerging', 'developing', 'established', 'broad']);
  });
});

describe('readiness in the engine', () => {
  const neutral = simulate(BASE);

  it('leaves the model exactly unchanged when no answers are given', () => {
    const withEmpty = simulate({ ...BASE, readiness: {} });
    expect(withEmpty.scenarios).toEqual(neutral.scenarios);
    expect(withEmpty.resolved.trainingHoursPerPerson).toBe(12);
    expect(withEmpty.resolved.readiness).toMatchObject({ score: null, index: 0, t0Multiplier: 1, trainingMultiplier: 1, governanceMultiplier: 1 });
  });

  it('adopts faster, trains less and costs less setup when more ready', () => {
    const ready = simulate({ ...BASE, readiness: ALL(100) });
    expect(ready.resolved.adoptionCurve.t0).toBeLessThan(neutral.resolved.adoptionCurve.t0);
    expect(ready.resolved.trainingHoursPerPerson).toBeLessThan(12);
    expect(ready.scenarios.central.months[6].adoption).toBeGreaterThan(neutral.scenarios.central.months[6].adoption);
  });

  it('adopts slower and trains more when less ready, and the ceiling (aMax) stays the visitor\'s', () => {
    const low = simulate({ ...BASE, readiness: ALL(0) });
    expect(low.resolved.adoptionCurve.t0).toBeGreaterThan(neutral.resolved.adoptionCurve.t0);
    expect(low.resolved.trainingHoursPerPerson).toBeGreaterThan(12);
    expect(low.resolved.adoptionCurve.aMax).toBe(neutral.resolved.adoptionCurve.aMax);
  });

  it('is monotone: a more ready company reaches value earlier and spends less training time', () => {
    const scores = [0, 40, 70, 100] as const;
    const runs = scores.map((v) => simulate({ ...BASE, readiness: ALL(v) }));
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i].scenarios.central.months[9].hoursFreed).toBeGreaterThan(runs[i - 1].scenarios.central.months[9].hoursFreed);
      expect(runs[i].trainingHours).toBeLessThan(runs[i - 1].trainingHours);
    }
  });

  it('never scales the hours saved per person, only when they arrive', () => {
    const low = simulate({ ...BASE, readiness: ALL(0) });
    const high = simulate({ ...BASE, readiness: ALL(100) });
    expect(low.scenarios.central.shareSaved).toBe(high.scenarios.central.shareSaved);
    // by month 24 the curves converge on the same ceiling
    const m24 = (r: typeof low) => r.scenarios.central.months[24].adoption;
    expect(m24(high) - m24(low)).toBeLessThan(0.05);
  });

  it('keeps training at or above the five-hour floor', () => {
    const r = resolveReadiness(ALL(100));
    expect(trainingHoursFor(6, r)).toBe(5);
    expect(trainingHoursFor(20, r)).toBeCloseTo(13, 5);
  });

  it('scales one-off governance setup time by readiness', () => {
    const low = simulate({ ...BASE, readiness: ALL(0) });
    expect(low.resolved.governanceSetupHours).toBe(40 * 1.5);
    expect(simulate({ ...BASE, readiness: ALL(100) }).resolved.governanceSetupHours).toBe(40);
  });

  it('scales scope, never prices', () => {
    const low = simulate({ ...BASE, readiness: { ...ALL(0), data: 0 } });
    const high = simulate({ ...BASE, readiness: ALL(100) });
    const get = (r: typeof low, id: string) => r.offers.find((o) => o.id === id)!;
    expect(get(low, 'workshop').quantity).toBe(3);
    expect(get(high, 'workshop').quantity).toBe(1);
    expect(get(neutral, 'workshop').quantity).toBeUndefined();
    expect(get(low, 'workflows').quantity).toBe(Math.ceil(get(neutral, 'workflows').quantity! * 0.5));
    expect(get(low, 'readiness-assessment').recommended).toBe(true);
    expect(get(high, 'readiness-assessment').recommended).toBeUndefined();
    expect(get(low, 'governance').recommended).toBe(true);
    expect(get(low, 'program').typical!.weeks).toBe('24 to 36');
    expect(get(high, 'program').typical!.weeks).toBe('6');
    expect(get(low, 'workshop').price).toEqual(get(high, 'workshop').price);
    expect(get(low, 'readiness-assessment').price).toEqual(get(high, 'readiness-assessment').price);
  });

  it('moves a data-poor company up one company-brain band', () => {
    const base = simulate(BASE).offers.find((o) => o.id === 'company-brain')!;
    const poor = simulate({ ...BASE, readiness: { data: 40 } }).offers.find((o) => o.id === 'company-brain')!;
    expect(poor.price).not.toEqual(base.price);
  });
});

describe('readiness input validation', () => {
  it('rejects unknown dimensions and off-scale answers', () => {
    expect(() => validateInputs({ ...BASE, readiness: { leadership: 55 as never } })).toThrow(SimulatorInputError);
    expect(() => validateInputs({ ...BASE, readiness: { vibes: 100 } as never })).toThrow(SimulatorInputError);
    expect(() => validateInputs({ ...BASE, readiness: ALL(70) })).not.toThrow();
  });

  it('survives sanitizing, and bad answers are dropped', () => {
    const clean = sanitizeInputs({ ...BASE, readiness: { leadership: 100, data: 55, vibes: 100 } });
    expect(clean?.readiness).toEqual({ leadership: 100 });
    expect(sanitizeInputs({ ...BASE, readiness: 'nope' })?.readiness).toBeUndefined();
  });

  it('keeps the pace slider value, so a stored run models what the visitor saw', () => {
    expect(sanitizeInputs({ ...BASE, adoptionTarget: 0.7 })?.adoptionTarget).toBe(0.7);
    expect(sanitizeInputs({ ...BASE, adoptionTarget: 0.2 })).toBeNull();
  });
});
