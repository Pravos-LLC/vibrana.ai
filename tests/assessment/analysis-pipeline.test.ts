import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chat, chatRequestBody, stripJsonFence } from '@/lib/llm/openrouter';
import { runAnalysisPipeline } from '@/lib/assessment/analysis-pipeline';
import type { AnalysisBasis, StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { judgeAnalysis, judgePasses, parseJudgeVerdict } from '@/lib/assessment/analysis-judge';
import { parseCompanyInsights } from '@/lib/assessment/company-insights';
import fixtures from '@/eval/assessment/fixtures/analysis-outputs.json';
import { GOLDEN_PROFILES, goldenAssessment } from '@/eval/assessment/golden';
import { buildAnalysisContext } from '@/lib/assessment/build-analysis-prompt';

const fetchMock = vi.fn<typeof fetch>();
const reply = (content: string | null, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { cost: 0.0005, prompt_tokens: 900, completion_tokens: 300 } }), { status });

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test';
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenRouter client', () => {
  it('routes only to zero-retention providers that honor every parameter, with reasoning off', () => {
    const body = chatRequestBody({ model: 'deepseek/x', messages: [{ role: 'user', content: 'hi' }], maxTokens: 10, timeoutMs: 1000, title: 't' });
    expect(body.provider).toEqual({ require_parameters: true, data_collection: 'deny', zdr: true, sort: 'latency', ignore: ['deepseek', 'alibaba', 'z-ai', 'moonshotai'] });
    expect(body.reasoning).toEqual({ enabled: false });
    expect(body).not.toHaveProperty('response_format');
  });

  it('returns text, cost and tokens, and names failures without throwing', async () => {
    fetchMock.mockResolvedValueOnce(reply('Hello.'));
    const ok = await chat({ model: 'deepseek/x', messages: [{ role: 'user', content: 'hi' }], maxTokens: 10, timeoutMs: 1000, title: 't' });
    expect(ok).toMatchObject({ text: 'Hello.', costUsd: 0.0005, promptTokens: 900, completionTokens: 300 });
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://openrouter.ai/api/v1/chat/completions');

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 429 }));
    expect((await chat({ model: 'm/x', messages: [], maxTokens: 1, timeoutMs: 1000, title: 't' })).error).toBe('http-429');

    fetchMock.mockRejectedValueOnce(Object.assign(new Error('t'), { name: 'TimeoutError' }));
    expect((await chat({ model: 'm/x', messages: [], maxTokens: 1, timeoutMs: 1000, title: 't' })).error).toBe('timeout');

    delete process.env.OPENROUTER_API_KEY;
    expect((await chat({ model: 'm/x', messages: [], maxTokens: 1, timeoutMs: 1000, title: 't' })).error).toBe('no-key');
  });

  it('strips a json fence', () => {
    expect(stripJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

describe('runAnalysisPipeline', () => {
  const fixture = fixtures.outputs[0];
  const good = fixture.analysis as StructuredAnalysis;
  const ctx = buildAnalysisContext(goldenAssessment(GOLDEN_PROFILES.find((p) => p.id === fixture.profile)!))!;
  const basis = (b: AnalysisBasis) => (b.kind === 'answers' ? { answer_ids: b.questions, finding_id: '' } : { answer_ids: [], finding_id: b.slug });
  const asModelJson = (a: StructuredAnalysis) =>
    JSON.stringify({
      summary: a.summary,
      strongest: a.strongest.map((p) => ({ area: p.area, point: p.text, ...basis(p.basis) })),
      weakest: a.weakest.map((p) => ({ area: p.area, point: p.text, ...basis(p.basis) })),
      starting_point: { action: a.startingPoint.text, ...basis(a.startingPoint.basis) },
    });
  const verdict = (overall: number) =>
    JSON.stringify({ problems: overall < 4 ? ['"x": unsupported'] : [], true: overall, earned: overall, specific: overall, useful: overall, consistent: overall, voice: overall });
  const bodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init!.body)));

  it('stores a draft that passes the code checks and the judge', async () => {
    fetchMock.mockResolvedValueOnce(reply(asModelJson(good))).mockResolvedValueOnce(reply(verdict(5)));
    const r = await runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'qwen/y' });
    expect(r.analysis).toEqual(good);
    expect(r.attempts).toEqual([expect.objectContaining({ attempt: 1, stage: 'passed' })]);
    expect(bodies().map((b) => b.model)).toEqual(['deepseek/x', 'qwen/y']);
    expect(bodies()[0].response_format.json_schema.name).toBe('readiness_analysis');
    expect(r.costUsd).toBeCloseTo(0.001);
  });

  it('regenerates once with the check failures named, then stores nothing if it still fails', async () => {
    const bad = asModelJson({ ...good, summary: `${good.summary} Studies show a 37% gain.` });
    fetchMock.mockResolvedValueOnce(reply(bad)).mockResolvedValueOnce(reply(bad));
    const r = await runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'qwen/y' });
    expect(r.analysis).toBeNull();
    expect(r.attempts.map((a) => a.stage)).toEqual(['checks', 'checks']);
    expect(r.reason).toMatch(/^failed the code checks after 2 attempts/);
    const retry = bodies()[1].messages;
    expect(retry[1]).toMatchObject({ role: 'assistant' });
    expect(retry[2].content).toContain('ungrounded-number');
    expect(retry[2].content).toContain('studies show');
  });

  it('regenerates once when the judge scores below the bar, feeding back its problems', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(asModelJson(good)))
      .mockResolvedValueOnce(reply(verdict(2)))
      .mockResolvedValueOnce(reply(asModelJson(good)))
      .mockResolvedValueOnce(reply(verdict(5)));
    const r = await runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'qwen/y' });
    expect(r.analysis).toEqual(good);
    expect(r.attempts.map((a) => a.stage)).toEqual(['judge', 'passed']);
    expect(bodies()[2].messages[2].content).toContain('A reviewer rejected your previous draft');
  });

  it('stores nothing when the judge rejects both drafts, or cannot grade', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(asModelJson(good)))
      .mockResolvedValueOnce(reply(verdict(2)))
      .mockResolvedValueOnce(reply(asModelJson(good)))
      .mockResolvedValueOnce(reply(verdict(2)));
    const rejected = await runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'qwen/y' });
    expect(rejected.analysis).toBeNull();
    expect(rejected.reason).toMatch(/^below the judge bar after 2 attempts \(2\/5\)/);

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(reply('not json'));
    const ungraded = await runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'qwen/y' });
    expect(ungraded.analysis).toBeNull();
  });

  it('refuses a judge from the drafter\'s own family', async () => {
    await expect(runAnalysisPipeline(ctx, { model: 'deepseek/x', judge: 'deepseek/y' })).rejects.toThrow(/different model family/);
  });
});

describe('judge', () => {
  const scores = { true: 5, earned: 4, specific: 4, useful: 4, consistent: 4, voice: 5 };

  it('parses a verdict and applies the bar', () => {
    const v = parseJudgeVerdict({ problems: ['x'], ...scores })!;
    expect(v.overall).toBe(4.33);
    expect(judgePasses(v)).toBe(true);
    expect(judgePasses(parseJudgeVerdict({ problems: [], ...scores, earned: 2 })!)).toBe(false);
    expect(judgePasses(parseJudgeVerdict({ problems: [], true: 4, earned: 4, specific: 3, useful: 4, consistent: 3, voice: 4 })!)).toBe(false);
    expect(parseJudgeVerdict({ ...scores, voice: 9 })).toBeNull();
  });

  it('retries once on an unusable reply', async () => {
    fetchMock.mockResolvedValueOnce(reply('nope')).mockResolvedValueOnce(reply(JSON.stringify({ problems: [], ...scores })));
    const r = await judgeAnalysis('context', 'draft', 'z-ai/x');
    expect(r.verdict?.scores.true).toBe(5);
    expect(r.costUsd).toBeCloseTo(0.001);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('company insights', () => {
  const valid = {
    company_summary: ' Acme makes anvils. ',
    ai_maturity: { signals: [], confidence: 'low' },
    tech_insights: { has_roadmap: false, mentions_ai: false, ai_use_cases: [] },
    readiness_clues: { likely_dimensions: [], strengths: [], gaps: [] },
    leadership_team: [{ name: 'Ada Smith', title: 'CEO', linkedin: '' }],
    company_metadata: { employee_range: '50-200', founded_year: 'Not stated', headquarters: 'N/A' },
  };

  it('keeps facts, drops empty or hedged values, and never keeps names of people on the page', () => {
    expect(parseCompanyInsights(valid)).toEqual({
      company_summary: 'Acme makes anvils.',
      ai_maturity: { signals: [], confidence: 'low' },
      tech_insights: { has_roadmap: false, mentions_ai: false, ai_use_cases: [] },
      readiness_clues: { likely_dimensions: [], strengths: [], gaps: [] },
      company_metadata: { employee_range: '50-200' },
    });
  });

  it('rejects the wrong shape', () => {
    expect(parseCompanyInsights({ ...valid, company_summary: '' })).toBeNull();
    expect(parseCompanyInsights({ ...valid, ai_maturity: { signals: 'x', confidence: 'low' } })).toBeNull();
    expect(parseCompanyInsights(null)).toBeNull();
  });
});
