// The staged report pipeline (AI Readiness plan §5.3): draft into a fixed JSON schema, validate
// in code, then a judge from a different model family. Below the bar it regenerates once with
// the problems named; if the second draft also fails, nothing is stored. No database access
// here, so the eval harness (scripts/assessment-eval/run.ts) runs exactly what production runs.
import { chat, stripJsonFence, type ChatMessage } from '@/lib/llm/openrouter';
import { analysisModel, judgeModel, modelFamily } from '@/lib/assessment/models';
import { cleanAnalysisText } from '@/lib/assessment/analysis-grounding';
import { describeIssues, type AnalysisIssue } from '@/lib/assessment/analysis-validators';
import { ANALYSIS_JSON_SCHEMA, parseAnalysis, type StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { validateStructuredAnalysis, WEAK_ANSWER } from '@/lib/assessment/analysis-check';
import { judgeAnalysis, judgePasses, type JudgeVerdict } from '@/lib/assessment/analysis-judge';
import { analysisJudgeText } from '@/lib/assessment/analysis-render';
import type { AnalysisContext } from '@/lib/assessment/build-analysis-prompt';

export const DRAFT_TIMEOUT_MS = 30_000;
export const MAX_ATTEMPTS = 2;

export interface AttemptRecord {
  attempt: number;
  /** Where this attempt stopped: no usable reply, failed the code checks, failed the judge, or passed. */
  stage: 'draft' | 'checks' | 'judge' | 'passed';
  issues?: string;
  judge?: JudgeVerdict | null;
  judgeError?: string;
}

export interface PipelineResult {
  analysis: StructuredAnalysis | null;
  /** The last draft that parsed, even if it failed (for the eval and the admin note). */
  lastDraft: StructuredAnalysis | null;
  verdict: JudgeVerdict | null;
  attempts: AttemptRecord[];
  /** One line for the admin email and the stored metadata. */
  reason: string;
  model: string;
  judgeModel: string;
  costUsd: number;
  latencyMs: number;
}

function clean(a: StructuredAnalysis): StructuredAnalysis {
  return {
    ...a,
    summary: cleanAnalysisText(a.summary),
    strongest: a.strongest.map((p) => ({ ...p, text: cleanAnalysisText(p.text) })),
    weakest: a.weakest.map((p) => ({ ...p, text: cleanAnalysisText(p.text) })),
    startingPoint: { ...a.startingPoint, text: cleanAnalysisText(a.startingPoint.text) },
  };
}

function feedback(issues: AnalysisIssue[] | null, verdict: JudgeVerdict | null): string {
  if (issues?.length) return `Your previous draft failed these checks: ${describeIssues(issues)}. Write a new draft that passes every rule.`;
  if (verdict) {
    const problems = verdict.problems.length ? verdict.problems.map((p) => `- ${p}`).join('\n') : '- It was too generic or not supported by the facts.';
    return `A reviewer rejected your previous draft:\n${problems}\nWrite a new draft that fixes every problem and passes every rule.`;
  }
  return 'Your previous reply was not valid JSON for the schema. Reply only with JSON that matches it.';
}

export async function runAnalysisPipeline(
  ctx: AnalysisContext,
  opts: { model?: string; judge?: string } = {}
): Promise<PipelineResult> {
  const model = opts.model ?? analysisModel();
  const judge = opts.judge ?? judgeModel();
  if (modelFamily(model) === modelFamily(judge)) throw new Error(`judge ${judge} must be a different model family from ${model}`);

  const attempts: AttemptRecord[] = [];
  let costUsd = 0;
  let latencyMs = 0;
  let lastDraft: StructuredAnalysis | null = null;
  let lastVerdict: JudgeVerdict | null = null;
  let lastIssues: AnalysisIssue[] | null = null;
  let lastRaw: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const messages: ChatMessage[] = [{ role: 'user', content: ctx.prompt }];
    if (attempt > 1) {
      if (lastRaw) messages.push({ role: 'assistant', content: lastRaw });
      messages.push({ role: 'user', content: feedback(lastIssues, lastVerdict) });
    }
    const r = await chat({
      model,
      messages,
      maxTokens: 1400,
      temperature: 0.3,
      jsonSchema: { name: 'readiness_analysis', schema: ANALYSIS_JSON_SCHEMA },
      timeoutMs: DRAFT_TIMEOUT_MS,
      title: 'Vibrana AI Readiness analysis',
    });
    costUsd += r.costUsd ?? 0;
    latencyMs += r.latencyMs;

    let draft: StructuredAnalysis | null = null;
    lastRaw = r.text;
    if (r.text) {
      try {
        const parsed = parseAnalysis(JSON.parse(stripJsonFence(r.text)));
        draft = parsed ? clean(parsed) : null;
      } catch {
        draft = null;
      }
    }
    if (!draft) {
      attempts.push({ attempt, stage: 'draft', issues: r.error ?? 'reply did not match the schema' });
      lastIssues = null;
      lastVerdict = null;
      if (r.error === 'timeout') break;
      continue;
    }
    // With every answer at the top of the scale there is no weakness to cite; a model that names
    // one anyway is ignored here rather than failing the whole report.
    if (Object.values(ctx.allowed.answers).every((v) => v > WEAK_ANSWER) && draft.weakest.length > 0) {
      draft = { ...draft, weakest: [] };
    }
    lastDraft = draft;

    const issues = validateStructuredAnalysis(draft, ctx.facts, ctx.allowed);
    if (issues.length) {
      attempts.push({ attempt, stage: 'checks', issues: describeIssues(issues) });
      lastIssues = issues;
      lastVerdict = null;
      continue;
    }

    const j = await judgeAnalysis(ctx.facts, analysisJudgeText(draft), judge);
    costUsd += j.costUsd ?? 0;
    latencyMs += j.latencyMs;
    lastVerdict = j.verdict;
    lastIssues = null;
    if (!j.verdict) {
      // A judge that cannot grade is not a pass: nothing unreviewed is sent.
      attempts.push({ attempt, stage: 'judge', judge: null, judgeError: j.error });
      continue;
    }
    if (!judgePasses(j.verdict)) {
      attempts.push({ attempt, stage: 'judge', judge: j.verdict });
      continue;
    }
    attempts.push({ attempt, stage: 'passed', judge: j.verdict });
    return {
      analysis: draft,
      lastDraft: draft,
      verdict: j.verdict,
      attempts,
      reason: `stored after ${attempt} attempt${attempt > 1 ? 's' : ''}, judge ${j.verdict.overall}/5`,
      model,
      judgeModel: judge,
      costUsd,
      latencyMs,
    };
  }

  return {
    analysis: null,
    lastDraft,
    verdict: lastVerdict,
    attempts,
    reason: describeFailure(attempts),
    model,
    judgeModel: judge,
    costUsd,
    latencyMs,
  };
}

export function describeFailure(attempts: AttemptRecord[]): string {
  const last = attempts[attempts.length - 1];
  if (!last) return 'no attempt ran';
  const n = `${attempts.length} attempt${attempts.length > 1 ? 's' : ''}`;
  switch (last.stage) {
    case 'draft':
      return `no usable draft after ${n} (${last.issues})`;
    case 'checks':
      return `failed the code checks after ${n}: ${last.issues}`;
    case 'judge':
      return last.judge
        ? `below the judge bar after ${n} (${last.judge.overall}/5): ${last.judge.problems.slice(0, 3).join(' | ') || 'no problems listed'}`
        : `the judge could not grade it after ${n} (${last.judgeError})`;
    default:
      return 'passed';
  }
}
