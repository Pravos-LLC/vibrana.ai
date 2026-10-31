import { describe, expect, it } from 'vitest';
import { adoptionAt, compareDelivery, firmShareSaved, simulate, validateInputs } from '@/src/lib/simulator/engine';
import { SECTORS } from '@/src/lib/simulator/sectors';
import type { SimulatorInputs } from '@/src/lib/simulator/types';

// Spec 8.8: 200 people, professional services, Steady, Anthropic + Google, $50 cap, $60/hour.
const WORKED: SimulatorInputs = {
  domain: null,
  headcount: 200,
  sector: 'professional-services',
  providers: ['anthropic', 'google'],
  cap: 50,
  dataRule: 'internal',
  pace: 'steady',
  overrides: { hourlyCost: 60 },
};

describe('worked example (spec 8.8)', () => {
  const r = simulate(WORKED);
  const m12 = (s: 'conservative' | 'central' | 'optimistic') => r.scenarios[s].months[12];

  it('resolves the inputs the way the spec does', () => {
    expect(adoptionAt('steady', 12)).toBeCloseTo(0.779, 3);
    expect(r.resolved.seatPrice).toBe(20);
    expect(r.resolved.blendedTokenPrice).toBeCloseTo(2.475, 6);
    expect(r.resolved.workflowsAt12).toBe(6);
  });

  it('reproduces the firm-wide share of hours saved', () => {
    expect(r.scenarios.conservative.shareSaved).toBeCloseTo(0.012, 3);
    expect(r.scenarios.central.shareSaved).toBeCloseTo(0.061, 3);
    expect(r.scenarios.optimistic.shareSaved).toBeCloseTo(0.106, 3);
  });

  it('reproduces hours freed and capacity value at month 12', () => {
    expect(Math.round(m12('conservative').hoursFreed)).toBe(299);
    expect(Math.round(m12('central').hoursFreed)).toBe(1510);
    expect(Math.round(m12('optimistic').hoursFreed)).toBe(2653);
    // v2 values each department's hours at its own rate (US relative pay, mix-normalized to $60):
    // software and legal hours are worth more than support hours, so this sits a little above 1,510 x $60.
    const m = m12('central');
    const sum = Object.values(m.valueByFunction).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(m.capacityValue, 6);
    expect(Math.round(m.capacityValue)).toBe(92657);
    expect(r.headline.capacityValue.central).toBe(m.capacityValue);
  });

  it('reproduces the run cost lines at month 12', () => {
    for (const s of ['conservative', 'central', 'optimistic'] as const) expect(Math.round(m12(s).costs.seats)).toBe(3115);
    // Workflow runtime carries the gateway fee: 8%, 5.5%, none (BYOK).
    expect(Math.round(m12('conservative').costs.agents)).toBe(160);
    expect(Math.round(m12('central').costs.agents)).toBe(157);
    expect(Math.round(m12('optimistic').costs.agents)).toBe(148);
    expect(Math.round(m12('conservative').costs.usage)).toBe(3855);
    expect(Math.round(m12('central').costs.usage)).toBe(771);
    expect(Math.round(m12('optimistic').costs.usage)).toBe(193);
    expect(m12('conservative').costs.governance).toBe(3080);
    expect(m12('central').costs.governance).toBe(2120);
    expect(m12('optimistic').costs.governance).toBe(1160);
    // Default tool stack (database, hosting, web data, email, tracing), scaled to about 9 builders.
    expect(Math.round(m12('conservative').costs.tooling)).toBe(3985);
    expect(Math.round(m12('central').costs.tooling)).toBe(1166);
    expect(Math.round(m12('optimistic').costs.tooling)).toBe(273);
    expect(Math.round(m12('conservative').runCost)).toBe(26486);
    expect(Math.round(m12('central').runCost)).toBe(11589);
    expect(Math.round(m12('optimistic').runCost)).toBe(6946);
  });

  it('adds every run cost line, and nothing else, into the run cost', () => {
    for (const sc of ['conservative', 'central', 'optimistic'] as const) {
      for (const m of r.scenarios[sc].months) {
        const c = m.costs;
        expect(m.runCost).toBeCloseTo(c.seats + c.builders + c.usage + c.agents + c.tooling + c.addOns + c.reserve + c.governance, 6);
      }
    }
  });

  it('ramps builder, tool and reserve cost up with adoption', () => {
    const at = (t: number) => r.scenarios.central.months[t].costs;
    for (const line of ['builders', 'tooling', 'reserve'] as const) expect(at(12)[line], line).toBeGreaterThan(at(3)[line]);
    expect(at(0).addOns).toBe(0);
  });

  it('prices the AI add-on seat of the work tools a company already uses', () => {
    const base = simulate(WORKED).scenarios.central.months[12];
    const withStack = simulate({ ...WORKED, stack: ['microsoft-365', 'slack', 'linear'] }).scenarios.central.months[12];
    // Copilot $30 and Slack Business+ delta $7.75 per active person; Linear has no published AI seat price.
    expect(withStack.costs.addOns).toBeCloseTo(base.adoption * 200 * (30 + 7.75), 4);
    expect(base.costs.addOns).toBe(0);
  });

  it('turns tool lines off and on', () => {
    const none = simulate({ ...WORKED, tools: [] }).scenarios.central.months[12].costs.tooling;
    const media = simulate({ ...WORKED, tools: ['media'] }).scenarios.central.months[12].costs.tooling;
    expect(none).toBe(0);
    expect(media).toBeGreaterThan(300);
  });

  it('prices the outside-help menu (John, 2026-10-13 and 2026-10-15) and never totals it', () => {
    const offer = (id: string) => r.offers.find((o) => o.id === id)!;
    expect(offer('readiness-free').price).toEqual({ kind: 'free' });
    expect(offer('readiness-assessment').price).toEqual({ kind: 'from', low: 10_000 });
    expect(offer('workshop').price).toEqual({ kind: 'range', low: 3_000, high: 5_000 });
    expect(offer('workflows')).toMatchObject({ quantity: 6, price: { low: 10_000, high: 25_000, per: 'each' } });
    expect(offer('custom-build').quantity).toBe(1);
    expect(offer('company-brain').price).toEqual({ kind: 'range', low: 40_000, high: 125_000 });
    expect(offer('governance').price).toEqual({ kind: 'from', low: 15_000 });
    expect(offer('people-culture').price).toEqual({ kind: 'quote' });
    // Added 2026-10-16: entry prices from John; the training platform's full model is a base, a per-learner fee and live weeks.
    expect(offer('training-platform').price).toEqual({ kind: 'from', low: 25_000 });
    expect(offer('harness').price).toEqual({ kind: 'from', low: 10_000 });
    expect(offer('software-factory').price).toEqual({ kind: 'from', low: 25_000 });
    expect(offer('program').typical).toEqual({ usd: 250_000, weeks: '12' });
    expect(offer('support').price).toEqual({ kind: 'range', low: 3_000, high: 7_000, per: 'month' });
    expect(JSON.stringify(r)).not.toMatch(/"total"/);
  });

  it('values training time and governance setup', () => {
    expect(r.trainingHours).toBe(2400);
    expect(r.headline.trainingValue).toBe(144_000);
    const setup = r.scenarios.central.months.reduce((s, m) => s + m.costs.governanceSetup, 0);
    expect(setup).toBe(2400);
    const training = r.scenarios.central.months.reduce((s, m) => s + m.costs.trainingTime, 0);
    expect(training).toBeCloseTo(144_000, 6);
  });
});

describe('engine invariants', () => {
  it('never lets seats plus usage exceed the ceiling', () => {
    for (const cap of [20, 50, 100, 200, 500] as const) {
      const r = simulate({ ...WORKED, cap, providers: ['openai'] });
      for (const s of ['conservative', 'central', 'optimistic'] as const) {
        for (const m of r.scenarios[s].months) {
          expect(m.costs.seats + m.costs.usage).toBeLessThanOrEqual(m.ceiling + 1e-9);
        }
      }
    }
  });

  it('only shows a cash saving when given a cash number', () => {
    expect(simulate(WORKED).scenarios.central.months[12].cashSaving).toBeNull();
    const r = simulate({ ...WORKED, overrides: { hourlyCost: 60, outsourcedAnnual: 120_000 } });
    expect(r.scenarios.central.months[12].cashSaving).toBeCloseTo(10_000 * 0.2 * adoptionAt('steady', 12), 6);
  });

  it('switching off trial gains falls back to whole-job evidence', () => {
    const r = simulate({ ...WORKED, overrides: { hourlyCost: 60, taskShare: 0 } });
    expect(r.scenarios.central.shareSaved).toBeCloseTo(r.scenarios.conservative.shareSaved, 9);
  });

  it('orders every headline range low <= central <= high', () => {
    for (const sector of SECTORS) {
      for (const pace of ['cautious', 'steady', 'ambitious'] as const) {
        const r = simulate({ ...WORKED, sector: sector.id, pace });
        for (const key of ['hoursFreed', 'capacityValue', 'runCost'] as const) {
          const v = r.headline[key];
          expect(v.low).toBeLessThanOrEqual(v.central);
          expect(v.central).toBeLessThanOrEqual(v.high);
        }
      }
    }
  });

  it('has no headcount output anywhere in the result', () => {
    const json = JSON.stringify(simulate(WORKED)).toLowerCase();
    for (const word of ['fte', 'headcountreduction', 'roles', 'jobs', 'layoff']) {
      expect(json).not.toContain(`"${word}`);
    }
  });

  it('rejects input it cannot model', () => {
    expect(() => simulate({ ...WORKED, headcount: 2 })).toThrow();
    expect(() => simulate({ ...WORKED, providers: [] })).toThrow();
  });
});

describe('calibration (spec 7.2)', () => {
  // National surveys: 1.4% of all hours, 2.8-5.4% for users. Every sector default must stay in band.
  for (const sector of SECTORS) {
    it(`${sector.id} default mix sits inside the calibration band`, () => {
      expect(firmShareSaved(sector.mix, 'conservative')).toBeGreaterThanOrEqual(0.01);
      expect(firmShareSaved(sector.mix, 'conservative')).toBeLessThanOrEqual(0.035);
      expect(firmShareSaved(sector.mix, 'central')).toBeGreaterThanOrEqual(0.04);
      expect(firmShareSaved(sector.mix, 'central')).toBeLessThanOrEqual(0.09);
      const sum = Object.values(sector.mix).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 9);
    });
  }
});

describe('pace slider (adoptionTarget)', () => {
  it('reproduces the calibrated curves at their own targets', () => {
    for (const pace of ['cautious', 'steady', 'ambitious'] as const) {
      const target = { cautious: 0.6, steady: 0.8, ambitious: 0.92 }[pace];
      const viaSlider = simulate({ ...WORKED, adoptionTarget: target });
      const viaPace = simulate({ ...WORKED, pace });
      expect(viaSlider.resolved.pace).toBe(pace);
      expect(viaSlider.headline.hoursFreed.central).toBeCloseTo(viaPace.headline.hoursFreed.central, 6);
    }
  });

  it('moves the result monotonically with the target', () => {
    let last = 0;
    for (let t = 0.4; t <= 0.95 + 1e-9; t += 0.05) {
      const hours = simulate({ ...WORKED, adoptionTarget: Math.round(t * 100) / 100 }).headline.hoursFreed.central;
      expect(hours).toBeGreaterThan(last);
      last = hours;
    }
  });

  it('rejects targets off the slider', () => {
    expect(() => simulate({ ...WORKED, adoptionTarget: 0.2 })).toThrow();
    expect(() => simulate({ ...WORKED, adoptionTarget: 1 })).toThrow();
  });
});

describe('regions and department pay', () => {
  it('values a German company in Eurostat rates with UK-style department pay', () => {
    const r = simulate({ ...WORKED, overrides: { region: 'de' } });
    expect(r.resolved.region).toBe('de');
    const rates = r.resolved.hourlyByFunction;
    expect(rates.software).toBeGreaterThan(rates.support);
    const avg = Object.entries(r.resolved.functionMix).reduce((a, [f, m]) => a + m * rates[f as keyof typeof rates], 0);
    expect(avg).toBeCloseTo(r.resolved.hourlyCost, 6);
  });
});

describe('do it yourself vs outside help', () => {
  const both = compareDelivery(WORKED);

  it('uses outside help as the default, and it reproduces the calibrated model', () => {
    expect(simulate(WORKED).resolved.delivery).toBe('consultant');
    expect(simulate(WORKED).scenarios).toEqual(both.consultant.scenarios);
  });

  it('charges outside fees only with outside help: the program over its months, then monthly support to month 12', () => {
    const fees = (r: typeof both.consultant) => r.scenarios.central.months.map((m) => m.costs.outsideFees);
    expect(fees(both.diy).every((v) => v === 0)).toBe(true);
    const f = fees(both.consultant);
    const { fee, months } = both.consultant.resolved.program!;
    expect(f[0]).toBe(0);
    for (let t = 1; t <= months; t++) expect(f[t]).toBeCloseTo(fee / months, 6);
    expect(f[months + 1]).toBe(5_000);
    expect(f[12]).toBe(5_000);
    expect(f[13]).toBe(0);
    expect(both.diy.resolved.program).toBeNull();
  });

  it('costs less to run yourself but captures less: slower, fewer workflows, smaller gain', () => {
    const at = (r: typeof both.consultant, t: number) => r.scenarios.central.months[t];
    expect(both.diy.resolved.adoptionCurve.t0).toBeGreaterThan(both.consultant.resolved.adoptionCurve.t0);
    expect(at(both.diy, 12).runCost).toBeLessThan(at(both.consultant, 12).runCost);
    expect(at(both.diy, 12).capacityValue).toBeLessThan(at(both.consultant, 12).capacityValue);
    expect(both.diy.resolved.workflowsAt12).toBeLessThan(both.consultant.resolved.workflowsAt12);
  });

  it('keeps outside help out of the running cost, and in the running total', () => {
    const m = both.consultant.scenarios.central.months[2];
    expect(m.runCost).toBeCloseTo(m.costs.seats + m.costs.builders + m.costs.usage + m.costs.agents + m.costs.tooling + m.costs.addOns + m.costs.reserve + m.costs.governance, 6);
    const net = both.consultant.scenarios.central.cumulativeNet;
    let running = 0;
    both.consultant.scenarios.central.months.forEach((mm, t) => {
      running += mm.capacityValue - mm.runCost - mm.costs.trainingTime - mm.costs.governanceSetup - mm.costs.outsideFees - mm.costs.buildTime;
      expect(net[t]).toBeCloseTo(running, 4);
    });
  });

  it('finds the break-even month, which comes later with outside fees up front', () => {
    const c = both.consultant.scenarios.central;
    const d = both.diy.scenarios.central;
    for (const run of [c, d]) {
      if (run.breakEven !== null && run.breakEven > 0) {
        expect(run.cumulativeNet[run.breakEven]).toBeGreaterThanOrEqual(0);
        expect(run.cumulativeNet[run.breakEven - 1]).toBeLessThan(0);
      }
    }
    // Outside help ends ahead after 24 months: the long-run claim the section makes.
    expect(c.cumulativeNet[24]).toBeGreaterThan(d.cumulativeNet[24]);
  });

  it('sizes outside help to the company: the itemized menu for a small one, the program for a large one', () => {
    const small = simulate({ ...WORKED, headcount: 40 }).resolved.program!;
    const large = simulate({ ...WORKED, headcount: 1500 }).resolved.program!;
    expect(small.kind).toBe('plan');
    expect(small.fee).toBeLessThan(120_000);
    expect(large.kind).toBe('program');
    expect(large.fee).toBe(250_000);
  });

  it('charges your own build hours, far more when you build it yourself', () => {
    const sum = (r: typeof both.diy) => r.scenarios.central.months.reduce((a, m) => a + m.costs.buildTime, 0);
    // 4x the hours per workflow, on fewer workflows.
    expect(sum(both.diy) / sum(both.consultant)).toBeCloseTo((160 * both.diy.resolved.workflowsAt12) / (40 * both.consultant.resolved.workflowsAt12), 6);
    expect(both.diy.scenarios.central.months[0].costs.buildTime).toBe(0);
  });

  it('rejects an unknown delivery', () => {
    expect(() => validateInputs({ ...WORKED, delivery: 'magic' as never })).toThrow();
  });
});
