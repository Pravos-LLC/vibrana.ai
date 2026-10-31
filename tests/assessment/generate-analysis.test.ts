import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, ok, type Query } from '../helpers/fake-supabase';
import fixtures from '@/eval/assessment/fixtures/analysis-outputs.json';
import { GOLDEN_PROFILES, goldenAssessment } from '@/eval/assessment/golden';
import type { AnalysisBasis, StructuredAnalysis } from '@/lib/assessment/analysis-schema';

// Storing the pipeline's result: the analysis plus how it was produced, never a retry loop on
// the public route, and a forced regeneration that clears what no longer passes.
vi.mock('@/lib/supabase', async () => ({ supabase: (await import('../helpers/fake-supabase')).db.client }));
const { generateIndustryAnalysisForAssessment } = await import('@/lib/assessment/generate-industry-analysis');

const fixture = fixtures.outputs[0];
const good = fixture.analysis as StructuredAnalysis;
const row = { id: 'a1', ...goldenAssessment(GOLDEN_PROFILES.find((p) => p.id === fixture.profile)!) };
const basis = (b: AnalysisBasis) => (b.kind === 'answers' ? { answer_ids: b.questions, finding_id: '' } : { answer_ids: [], finding_id: b.slug });
const draft = JSON.stringify({
  summary: good.summary,
  strongest: good.strongest.map((p) => ({ area: p.area, point: p.text, ...basis(p.basis) })),
  weakest: good.weakest.map((p) => ({ area: p.area, point: p.text, ...basis(p.basis) })),
  starting_point: { action: good.startingPoint.text, ...basis(good.startingPoint.basis) },
});
const verdict = (n: number) => JSON.stringify({ problems: [], true: n, earned: n, specific: n, useful: n, consistent: n, voice: n });
const reply = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { cost: 0.001 } }));

const fetchMock = vi.fn<typeof fetch>();
let stored: Record<string, unknown>;

function serve(extra: Record<string, unknown> = {}) {
  db.respond = (q: Query) => (q.table === 'assessments' && q.op === 'select' ? ok({ ...row, ...stored, ...extra }) : ok());
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test';
  db.reset();
  stored = {};
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('generateIndustryAnalysisForAssessment', () => {
  it('stores the analysis with how it was produced', async () => {
    serve();
    fetchMock.mockResolvedValueOnce(reply(draft)).mockResolvedValueOnce(reply(verdict(5)));
    const r = await generateIndustryAnalysisForAssessment('a1');
    expect(r.success).toBe(true);
    const [update] = db.find('assessments', 'update');
    const payload = update.payload as { analysis: unknown; analysis_meta: Record<string, unknown> };
    expect(payload.analysis).toEqual(good);
    expect(payload.analysis_meta).toMatchObject({ status: 'stored', attempts: [{ attempt: 1, stage: 'passed' }] });
    expect(JSON.stringify(payload.analysis_meta)).not.toContain(row.company_name);
  });

  it('returns a stored analysis, or a recorded failure, without calling a model', async () => {
    serve({ analysis: good });
    expect(await generateIndustryAnalysisForAssessment('a1')).toMatchObject({ success: true, cached: true, analysis: good });
    serve({ analysis: null, analysis_meta: { status: 'failed' } });
    expect(await generateIndustryAnalysisForAssessment('a1')).toMatchObject({ success: false, cached: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('a forced run that fails clears the old analysis and records why', async () => {
    serve({ analysis: good, industry_analysis: 'old markdown' });
    fetchMock.mockResolvedValue(reply('not json'));
    const r = await generateIndustryAnalysisForAssessment('a1', { force: true });
    expect(r.success).toBe(false);
    const [update] = db.find('assessments', 'update');
    expect(update.payload).toMatchObject({ analysis: null, industry_analysis: null, analysis_meta: { status: 'failed' } });
  });

  it('needs the raw answers', async () => {
    serve({ answers: null });
    expect(await generateIndustryAnalysisForAssessment('a1')).toMatchObject({ success: false, error: 'Missing answers' });
  });
});
