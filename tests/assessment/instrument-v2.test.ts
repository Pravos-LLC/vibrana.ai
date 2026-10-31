import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ASSESSMENT_AREAS,
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_QUESTION_COUNT,
  ASSESSMENT_QUESTION_COUNT_SMALL,
  SMALL_TEAM_SIZES,
  questionsForTeamSize,
} from '@/src/assessment-questions-content';
import { ASSESSMENT_QUESTIONS_V1 } from '@/src/assessment-questions-v1-content';
import {
  QUESTION_ACTIONS,
  areaOfQuestion,
  calculateOrgDimensionScores,
  calculateOverallScore,
  generateRecommendations,
  instrumentVersionOf,
  isOptionScore,
} from '@/src/lib/assessment/scoring';
import { INQUIRY_OPTIONS } from '@/src/enterprise-content';
import { estimateAssessmentWorkflows, parseAssessmentWorkflows } from '@/src/lib/assessment/workflows';
import { calculate, defaultAssumptions, defaultWorkflow } from '@/src/lib/roi/calc';
import { workflowEmailHtml, workflowSection } from '@/lib/assessment/workflow-render';

const v2 = Object.values(ASSESSMENT_QUESTIONS).flat();
const v1 = Object.values(ASSESSMENT_QUESTIONS_V1).flat();

describe('the version 2 questions', () => {
  it('are a short core: 20 to 26 questions across the six areas, at least three per area', () => {
    expect(ASSESSMENT_QUESTION_COUNT).toBeGreaterThanOrEqual(20);
    expect(ASSESSMENT_QUESTION_COUNT).toBeLessThanOrEqual(26);
    for (const { key } of ASSESSMENT_AREAS) expect(ASSESSMENT_QUESTIONS[key].length, key).toBeGreaterThanOrEqual(3);
  });

  it('have unique ids that never collide with version 1, and each maps to its area', () => {
    const ids = v2.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const old = new Set(v1.map((q) => q.id));
    for (const id of ids) {
      expect(old.has(id), id).toBe(false);
      expect(id.length).toBeLessThanOrEqual(20); // the route's id length cap
    }
    for (const { key, dimension } of ASSESSMENT_AREAS) {
      for (const q of ASSESSMENT_QUESTIONS[key]) expect(areaOfQuestion(q.id)).toBe(dimension);
    }
    for (const q of v1) expect(areaOfQuestion(q.id)).not.toBeNull();
  });

  it('offer four options scored 100, 70, 40 and 0, in that order (the form stores the score)', () => {
    for (const q of v2) expect(q.options.map((o) => o.score), q.id).toEqual([100, 70, 40, 0]);
  });

  it('give every question a topic, an action for a low answer, and its evidence or "practitioner judgment"', () => {
    for (const q of v2) {
      expect(q.topic, q.id).toMatch(/^(AI |[a-z])/);
      expect(q.action.length, q.id).toBeGreaterThan(20);
      expect(QUESTION_ACTIONS[q.id]).toEqual({ topic: q.topic, action: q.action });
      if (q.evidence === 'practitioner judgment') continue;
      expect(q.evidence.length, q.id).toBeGreaterThan(0);
      for (const slug of q.evidence) expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('records every question and its evidence in docs/assessment-methodology.md', () => {
    const doc = readFileSync(join(process.cwd(), 'docs/assessment-methodology.md'), 'utf8');
    for (const q of v2) {
      expect(doc, q.id).toContain(`\`${q.id}\``);
      for (const slug of q.evidence === 'practitioner judgment' ? [] : q.evidence) expect(doc, `${q.id} ${slug}`).toContain(slug);
    }
  });

  it('ask about workflow redesign explicitly, the strongest single predictor in the KB', () => {
    const redesign = v2.filter((q) => q.evidence !== 'practitioner judgment' && q.evidence.includes('mckinsey-state-of-ai-2025-workflow-redesign-biggest-ebit-effect'));
    expect(redesign.map((q) => q.id)).toContain('l_redesign');
    expect(v2.map((q) => q.id)).toEqual(expect.arrayContaining(['l_baseline', 'c_codesign']));
  });

  it('skip questions that assume several teams for teams of 50 or fewer, and nothing else', () => {
    for (const size of SMALL_TEAM_SIZES) expect(INQUIRY_OPTIONS.teamSizes as readonly string[]).toContain(size);
    const small = Object.values(questionsForTeamSize('1-50 employees')).flat();
    expect(small.length).toBe(ASSESSMENT_QUESTION_COUNT_SMALL);
    expect(ASSESSMENT_QUESTION_COUNT - ASSESSMENT_QUESTION_COUNT_SMALL).toBe(2);
    for (const { key } of ASSESSMENT_AREAS) expect(questionsForTeamSize('1-50 employees')[key].length, key).toBeGreaterThanOrEqual(3);
    expect(Object.values(questionsForTeamSize('500+ employees')).flat()).toHaveLength(ASSESSMENT_QUESTION_COUNT);
    expect(Object.values(questionsForTeamSize('')).flat()).toHaveLength(ASSESSMENT_QUESTION_COUNT);
  });

  it('keep the house rules: no dashes, American spelling, no fear framing, the enterprise account for data handling', () => {
    const text = JSON.stringify(ASSESSMENT_QUESTIONS);
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/\b(organisation|realise|prioritise|colour|centre|analyse|programme|behaviour)\b/i);
    expect(text).not.toMatch(/\b(fear|afraid|risk of losing|fall behind|left behind|competitors)\b/i);
    for (const q of v2.filter((x) => /\baccount\b/.test(x.action))) {
      expect(q.action, q.id).toContain('the enterprise AI account your company already has');
    }
  });
});

describe('instrument version', () => {
  it('reads version 2, version 1, and rejects a mix or an unknown id', () => {
    expect(instrumentVersionOf({ l_owner: 70, c_weekly: 0 })).toBe(2);
    expect(instrumentVersionOf({ l1: 70, ta7: 40 })).toBe(1);
    expect(instrumentVersionOf({ l1: 70, l_owner: 70 })).toBeNull();
    expect(instrumentVersionOf({ zz: 70 })).toBeNull();
    expect(instrumentVersionOf({})).toBeNull();
  });

  it('accepts only the scores a question offers', () => {
    expect(isOptionScore('l_owner', 70)).toBe(true);
    expect(isOptionScore('l_owner', 60)).toBe(false);
    expect(isOptionScore('l1', 40)).toBe(true);
    expect(isOptionScore('nope', 40)).toBe(false);
  });

  it('scores version 1 rows exactly as before: ta1 is Talent, not Technology', () => {
    const scores = Object.fromEntries(calculateOrgDimensionScores({ t1: 100, ta1: 0 }).map((d) => [d.dimension, d.score]));
    expect(scores['Technology Infrastructure']).toBe(100);
    expect(scores['Talent & Capability']).toBe(0);
  });
});

describe('scoring and next steps on version 2 answers', () => {
  const all = (score: number) => Object.fromEntries(v2.map((q) => [q.id, score]));

  it('weighs the six areas equally', () => {
    const answers = { ...all(100), ...Object.fromEntries(ASSESSMENT_QUESTIONS.data.map((q) => [q.id, 0])) };
    const dims = calculateOrgDimensionScores(answers);
    expect(dims.map((d) => d.weight)).toEqual(Array(6).fill(1 / 6));
    expect(calculateOverallScore(dims)).toBe(83); // five areas at 100, one at 0
  });

  it('turns every low answer into its own action, naming the question it came from', () => {
    for (const { key } of ASSESSMENT_AREAS) {
      for (const q of ASSESSMENT_QUESTIONS[key]) {
        // Only this question is low; its area is then the lowest, so its step carries the action.
        const answers = { ...all(100), [q.id]: 0 };
        const recs = generateRecommendations(0, calculateOrgDimensionScores(answers), answers);
        const actions = recs.flatMap((r) => r.actions).join(' ');
        expect(actions, q.id).toContain(`${q.action} (from your answer on ${q.topic}).`);
      }
    }
  });

  it('starts from the named workflow when there is one, and from picking one when not', () => {
    const answers = all(40);
    const dims = calculateOrgDimensionScores(answers);
    expect(generateRecommendations(0, dims, answers)[0].title).toBe('Pick one workflow to start with');
    const named = generateRecommendations(0, dims, answers, { name: 'Document processing and extraction', borrowedEvidence: true });
    expect(named[0].title).toBe('Start with document processing and extraction');
    expect(named[0].actions.join(' ')).toContain('study of another task');
    expect(named.at(-1)!.title).toBe('Build it, then measure it');
  });
});

describe('the workflow module', () => {
  it('parses what the form sends and rejects what it never would', () => {
    expect(parseAssessmentWorkflows(undefined)).toBeNull();
    expect(parseAssessmentWorkflows({ currency: 'USD', items: [] })).toBeNull();
    expect(parseAssessmentWorkflows({ currency: 'EUR', items: [{ id: 'support', people: 3, hoursPerWeek: 5, hourlyCost: '' }] })).toEqual({
      currency: 'EUR',
      items: [{ id: 'support', people: 3, hoursPerWeek: 5, hourlyCost: null }],
    });
    // A row with no hours names nothing to estimate.
    expect(parseAssessmentWorkflows({ currency: 'USD', items: [{ id: 'support', people: 3, hoursPerWeek: 0 }] })).toBeNull();
    for (const bad of [
      [],
      { currency: 'JPY', items: [] },
      { currency: 'USD', items: [{ id: 'support', people: 1, hoursPerWeek: 1 }, { id: 'support', people: 1, hoursPerWeek: 1 }] },
      { currency: 'USD', items: [{ id: 'support', people: -1, hoursPerWeek: 1 }] },
      { currency: 'USD', items: [{ id: 'support', people: 1, hoursPerWeek: 1, hourlyCost: 1e9 }] },
    ]) {
      expect(parseAssessmentWorkflows(bad)).toBe('invalid');
    }
  });

  it('gives the same hours and time value as the Workflow ROI calculator at its study defaults', () => {
    const named = { currency: 'USD' as const, items: [{ id: 'support' as const, people: 4, hoursPerWeek: 10, hourlyCost: 40 }, { id: 'reports' as const, people: 2, hoursPerWeek: 5, hourlyCost: null }] };
    const estimate = estimateAssessmentWorkflows(named)!;
    const calc = calculate(
      [
        { ...defaultWorkflow('support'), people: 4, hoursPerWeek: 10, hourlyCost: 40 },
        { ...defaultWorkflow('reports'), people: 2, hoursPerWeek: 5, hourlyCost: 0 },
      ],
      defaultAssumptions('USD'),
    );
    expect(estimate.rows.map((r) => r.hoursFreed)).toEqual(calc.workflows.map((w) => w.hoursFreed));
    expect(estimate.rows[0].timeValue).toEqual(calc.workflows[0].timeValue);
    // No cost given: hours only, never a money figure.
    expect(estimate.rows[1].timeValue).toBeNull();
    expect(estimate.startWith!.id).toBe(calc.startWith);
  });

  it('renders one section for web, email and PDF, escaped, labeled time value and not savings', () => {
    const s = workflowSection({ currency: 'GBP', items: [{ id: 'documents', people: 5, hoursPerWeek: 8, hourlyCost: 30 }] })!;
    expect(s.rows[0].note).toContain('another task');
    expect(s.rows[0].value).toMatch(/^£/);
    expect(s.footnotes.join(' ')).toContain('Time freed is not money saved');
    const html = workflowEmailHtml({ currency: 'GBP', items: [{ id: 'documents', people: 5, hoursPerWeek: 8, hourlyCost: 30 }] });
    expect(html).toContain('Time value, not cash savings');
    expect(workflowSection(null)).toBeNull();
    expect(workflowEmailHtml(null)).toBe('');
  });
});
