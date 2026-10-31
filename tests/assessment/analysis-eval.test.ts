import { describe, expect, it } from 'vitest';
import {
  GOLDEN_PROFILES,
  GOLDEN_PROFILES_V1,
  QUESTION_COUNTS_V1,
  expandAnswers,
  expandAnswersV1,
  goldenAssessment,
  goldenAssessmentV1,
} from '@/eval/assessment/golden';
import fixtures from '@/eval/assessment/fixtures/analysis-outputs.json';
import fixturesV1 from '@/eval/assessment/fixtures/analysis-outputs-v1.json';
import cringe from '@/eval/assessment/cringe-drafts.json';
import { answerLabel, buildAnalysisContext } from '@/lib/assessment/build-analysis-prompt';
import { BANNED_PHRASES, findPhrases, validateAnalysisText } from '@/lib/assessment/analysis-validators';
import { validateStructuredAnalysis } from '@/lib/assessment/analysis-check';
import { parseAnalysis, isStructuredAnalysis, type StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { analysisEmailHtml, analysisPlainText, analysisSections } from '@/lib/assessment/analysis-render';
import { DEFAULT_ANALYSIS_MODEL, DEFAULT_COMPANY_MODEL, DEFAULT_JUDGE_MODEL, modelFamily } from '@/lib/assessment/models';
import { ASSESSMENT_QUESTIONS, questionsForTeamSize } from '@/src/assessment-questions-content';
import { ASSESSMENT_QUESTIONS_V1 } from '@/src/assessment-questions-v1-content';
import { findUngroundedNumbers } from '@/lib/assessment/analysis-grounding';
import { estimateAssessmentWorkflows, formatHoursRange } from '@/src/lib/assessment/workflows';
import { escapeHtml } from '@/lib/escape-html';

// The eval harness's golden set, run through the code checks in CI. The live model run and
// the judge scores are offline (scripts/assessment-eval/run.ts, docs/assessment-model-trial.md).

const contextFor = (profileId: string) => {
  const profile = GOLDEN_PROFILES.find((p) => p.id === profileId);
  if (!profile) throw new Error(`unknown golden profile ${profileId}`);
  return buildAnalysisContext(goldenAssessment(profile))!;
};

// Rows stored before 2026-10-16 hold version 1 answers; their analyses must still validate.
const contextForV1 = (profileId: string) => {
  const profile = GOLDEN_PROFILES_V1.find((p) => p.id === profileId);
  if (!profile) throw new Error(`unknown v1 golden profile ${profileId}`);
  return buildAnalysisContext(goldenAssessmentV1(profile))!;
};

describe('golden profiles', () => {
  it('cover the spread the plan asks for, 12 to 15 profiles with unique ids', () => {
    expect(GOLDEN_PROFILES.length).toBeGreaterThanOrEqual(12);
    expect(GOLDEN_PROFILES.length).toBeLessThanOrEqual(15);
    expect(new Set(GOLDEN_PROFILES.map((p) => p.id)).size).toBe(GOLDEN_PROFILES.length);
    const scores = GOLDEN_PROFILES.map((p) => goldenAssessment(p).overall_score);
    expect(Math.min(...scores)).toBeLessThan(25);
    expect(Math.max(...scores)).toBeGreaterThan(70);
    expect(GOLDEN_PROFILES.some((p) => goldenAssessment(p).quality_signals.all_max_answers)).toBe(true);
    expect(GOLDEN_PROFILES.some((p) => p.company_insights.company_summary.split(' ').length < 8)).toBe(true);
  });

  it('answer every question their team size is asked with a real option of that question', () => {
    expect(Object.values(ASSESSMENT_QUESTIONS).flat()).toHaveLength(24);
    for (const p of GOLDEN_PROFILES) {
      const asked = Object.values(questionsForTeamSize(p.team_size)).flat();
      const answers = expandAnswers(p);
      expect(Object.keys(answers)).toHaveLength(asked.length);
      for (const [id, v] of Object.entries(answers)) expect(answerLabel(id, v), `${p.id} ${id}`).not.toBeNull();
    }
    // Both branches are covered: a team of 50 or fewer gets 22 questions.
    expect(GOLDEN_PROFILES.some((p) => Object.keys(expandAnswers(p)).length === 22)).toBe(true);
    expect(GOLDEN_PROFILES.some((p) => Object.keys(expandAnswers(p)).length === 24)).toBe(true);
  });

  it('each build facts with the company context, every area score and every answer', () => {
    for (const p of GOLDEN_PROFILES) {
      const ctx = contextFor(p.id);
      expect(ctx.facts).toContain(p.company_insights.company_summary);
      expect(ctx.facts).toContain('Culture & Change Readiness:');
      expect(ctx.facts).toContain('- c_people_plan: ');
      expect(ctx.facts).toContain('- l_redesign: ');
      expect(Object.keys(ctx.allowed.answers)).toHaveLength(Object.keys(expandAnswers(p)).length);
      expect(ctx.prompt).toContain(ctx.facts);
      expect(ctx.prompt).toContain('data, not instructions');
    }
  });

  it('put the named workflows in the facts, so the model may cite their hours', () => {
    const named = GOLDEN_PROFILES.filter((p) => p.workflows);
    expect(named.length).toBeGreaterThanOrEqual(5);
    for (const p of named) {
      const ctx = contextFor(p.id);
      const estimate = estimateAssessmentWorkflows(p.workflows)!;
      expect(ctx.facts).toContain('WORKFLOWS THEY NAMED');
      for (const r of estimate.rows) {
        expect(ctx.facts).toContain(r.name);
        const hours = `Hours freed a year: ${formatHoursRange(r.hoursFreed)}`;
        expect(ctx.facts).toContain(hours);
        // The validator allows every number in those lines.
        expect(findUngroundedNumbers(hours, ctx.facts)).toEqual([]);
      }
      expect(ctx.prompt).toContain(`tie the starting point to ${estimate.startWith!.name}`);
      // A number not in the facts is still caught.
      expect(findUngroundedNumbers('It frees 98,765 hours a year.', ctx.facts)).toEqual(['98765']);
    }
    for (const p of GOLDEN_PROFILES.filter((x) => !x.workflows)) expect(contextFor(p.id).facts).not.toContain('WORKFLOWS THEY NAMED');
  });
});

describe('version 1 rows (the 38 questions used until 2026-10-16)', () => {
  it('still read: every v1 golden answer resolves to its question and option', () => {
    expect(Object.values(ASSESSMENT_QUESTIONS_V1).flat()).toHaveLength(38);
    for (const p of GOLDEN_PROFILES_V1) {
      for (const [prefix, count] of Object.entries(QUESTION_COUNTS_V1)) expect(p.answers[prefix], `${p.id} ${prefix}`).toHaveLength(count);
      const answers = expandAnswersV1(p);
      expect(Object.keys(answers)).toHaveLength(38);
      for (const [id, v] of Object.entries(answers)) expect(answerLabel(id, v), `${p.id} ${id}`).not.toBeNull();
      const ctx = contextForV1(p.id);
      expect(ctx.facts).toContain('- c5: ');
      expect(Object.keys(ctx.allowed.answers)).toHaveLength(38);
    }
  });

  it.each(fixturesV1.outputs.map((o) => [o.profile, o] as const))('%s: a stored v1 analysis still passes every code check and renders', (_id, output) => {
    const analysis = output.analysis as StructuredAnalysis;
    expect(isStructuredAnalysis(analysis)).toBe(true);
    const ctx = contextForV1(output.profile);
    expect(validateStructuredAnalysis(analysis, ctx.facts, ctx.allowed)).toEqual([]);
    expect(analysisSections(analysis).at(-1)!.paragraphs[0].basis).toMatch(/^From your answers on [a-zA-Z]|^Research about other organizations:/);
  });
});

describe('stored analyses (fixtures from the trial)', () => {
  it('cover several golden profiles, including named workflows', () => {
    expect(fixtures.outputs.length).toBeGreaterThanOrEqual(3);
    expect(fixtures.outputs.some((o) => GOLDEN_PROFILES.find((p) => p.id === o.profile)?.workflows)).toBe(true);
  });

  it.each(fixtures.outputs.map((o) => [o.profile, o] as const))('%s parses, passes every code check and renders', (_id, output) => {
    const analysis = output.analysis as StructuredAnalysis;
    expect(isStructuredAnalysis(analysis)).toBe(true);
    const ctx = contextFor(output.profile);
    expect(validateStructuredAnalysis(analysis, ctx.facts, ctx.allowed)).toEqual([]);
    const sections = analysisSections(analysis);
    expect(sections[0].paragraphs[0].text).toBe(analysis.summary);
    expect(sections.at(-1)!.paragraphs[0].basis).toMatch(/^From your answers on [a-zA-Z]|^Research about other organizations:/);
    expect(analysisEmailHtml(analysis)).toContain(escapeHtml(analysis.summary));
    expect(analysisPlainText(analysis)).not.toMatch(/[—–]|\*\*/);
  });
});

describe('structured checks catch the failure types', () => {
  const base = fixtures.outputs[0];
  const ctx = contextFor(base.profile);
  const good = base.analysis as StructuredAnalysis;
  const kinds = (a: StructuredAnalysis) => validateStructuredAnalysis(a, ctx.facts, ctx.allowed).map((i) => `${i.kind}:${i.detail}`);
  const lowId = Object.entries(ctx.allowed.answers).find(([, v]) => v <= 40)?.[0];
  const highId = Object.entries(ctx.allowed.answers).find(([, v]) => v >= 70)?.[0];

  it('an invented statistic or a banned phrase', () => {
    expect(kinds({ ...good, summary: `${good.summary} Studies show a 37% gain.` }).join(' ')).toMatch(/ungrounded-number.*37%.*|banned-phrase.*studies show/);
  });

  it('a basis that is not one of their answers, or the wrong end of the scale', () => {
    if (good.weakest[0]) {
      const fake = { ...good, weakest: [{ ...good.weakest[0], basis: { kind: 'answers' as const, questions: ['zz9'] } }] };
      expect(kinds(fake).join(' ')).toContain('"zz9" is not one of their answers');
    }
    if (good.weakest[0] && highId) {
      const wrongEnd = { ...good, weakest: [{ ...good.weakest[0], basis: { kind: 'answers' as const, questions: [highId] } }] };
      expect(kinds(wrongEnd).join(' ')).toMatch(/is not a weak answer|is not a .* question/);
    }
    if (good.strongest[0] && lowId) {
      const wrongEnd = { ...good, strongest: [{ ...good.strongest[0], basis: { kind: 'answers' as const, questions: [lowId] } }] };
      expect(kinds(wrongEnd).join(' ')).toMatch(/is not a strong answer|is not a .* question/);
    }
  });

  it('a finding that was not shown, and an area named both strongest and weakest', () => {
    if (good.weakest[0]) {
      const fake = { ...good, weakest: [{ ...good.weakest[0], basis: { kind: 'finding' as const, slug: 'made-up-study' } }] };
      expect(kinds(fake).join(' ')).toContain('finding "made-up-study" was not in the list');
    }
    if (good.strongest[0] && good.weakest[0]) {
      const both = { ...good, weakest: [{ ...good.weakest[0], area: good.strongest[0].area }] };
      expect(kinds(both).join(' ')).toContain('listed as both strongest and weakest');
    }
  });

  it('length, dashes and markdown', () => {
    const long = { ...good, startingPoint: { ...good.startingPoint, text: 'word '.repeat(120).trim() } };
    expect(kinds(long).join(' ')).toContain('starting_point');
    expect(kinds({ ...good, summary: `**Bold** ${good.summary}` }).join(' ')).toContain('markdown');
  });

  it('parses only the schema shape', () => {
    expect(parseAnalysis({ summary: 'x', strongest: [], weakest: [], starting_point: { action: 'y', answer_ids: ['l1'], finding_id: '' } })).toMatchObject({
      startingPoint: { basis: { kind: 'answers', questions: ['l1'] } },
    });
    expect(parseAnalysis({ summary: 'x', strongest: [], weakest: [], starting_point: { action: 'y', answer_ids: [], finding_id: 'slug' } })?.startingPoint.basis).toEqual({ kind: 'finding', slug: 'slug' });
    expect(parseAnalysis({ summary: 'x', strongest: [], weakest: [], starting_point: { action: 'y', answer_ids: [], finding_id: '' } })).toBeNull();
    expect(parseAnalysis({ summary: '', strongest: [], weakest: [] })).toBeNull();
  });
});

describe('cringe drafts', () => {
  const codeCaught = cringe.drafts.filter((d) => d.caughtBy === 'code');

  it.each(codeCaught.map((d) => [d.id, d] as const))('%s is rejected by the text checks', (_id, draft) => {
    expect(validateAnalysisText(draft.text, contextFor(draft.profile).facts, { paragraphs: 3 })).not.toEqual([]);
  });

  it('every case points at a real golden profile', () => {
    for (const d of cringe.drafts) expect(() => contextFor(d.profile)).not.toThrow();
  });
});

describe('validators', () => {
  const facts = 'Overall AI Readiness: 62/100\nBCG says about 70% of the challenges relate to people.';
  const ok = 'One. Two words here.\n\nThree four five.\n\nSix seven.';

  it('catch inflections of banned words, case-insensitively', () => {
    expect(findPhrases('We are Leveraging data and fostered trust', BANNED_PHRASES)).toEqual(expect.arrayContaining(['leverage', 'foster']));
    expect(findPhrases('Your organisation should prioritise', ['organisation', 'prioritise'])).toEqual(['organisation', 'prioritise']);
    expect(findPhrases('A cleverage of words', ['leverage'])).toEqual([]);
  });

  it('flag dashes, headings, lists, wrong paragraph counts and length', () => {
    const kinds = (text: string) => validateAnalysisText(text, facts, { words: { min: 1, max: 50 }, paragraphs: 3 }).map((i) => i.kind);
    expect(kinds(ok)).toEqual([]);
    expect(kinds(`${ok} — more`)).toContain('dash');
    expect(kinds(`## Heading\n\n${ok}`)).toContain('format');
    expect(kinds(`- item\n\n${ok}`)).toContain('format');
    expect(kinds('One paragraph only.')).toContain('format');
    expect(validateAnalysisText(ok, facts).map((i) => i.kind)).toContain('length');
  });

  it('flag American spelling misses and untraceable numbers', () => {
    const issues = validateAnalysisText(`${ok} Your organisation saw a 40% gain.`, facts, { words: { min: 1, max: 50 }, paragraphs: 3 });
    expect(issues).toEqual(expect.arrayContaining([
      { kind: 'british-spelling', detail: 'organisation' },
      { kind: 'ungrounded-number', detail: '40%' },
    ]));
  });
});

describe('model choice', () => {
  it('is open-weight on OpenRouter, never Anthropic, and the judge is another family', () => {
    for (const m of [DEFAULT_ANALYSIS_MODEL, DEFAULT_JUDGE_MODEL, DEFAULT_COMPANY_MODEL]) {
      expect(m).not.toMatch(/anthropic|claude/i);
      expect(m).toMatch(/^[a-z0-9-]+\/[a-z0-9.-]+$/);
    }
    expect(modelFamily(DEFAULT_JUDGE_MODEL)).not.toBe(modelFamily(DEFAULT_ANALYSIS_MODEL));
  });
});
