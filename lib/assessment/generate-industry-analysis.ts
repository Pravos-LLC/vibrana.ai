import { getAssessment, updateAssessmentAnalysis } from '@/src/lib/assessment/db';
import { buildAnalysisContext } from '@/lib/assessment/build-analysis-prompt';
import { runAnalysisPipeline, type PipelineResult } from '@/lib/assessment/analysis-pipeline';
import { isStructuredAnalysis, type StructuredAnalysis } from '@/lib/assessment/analysis-schema';
import { openRouterConfigured } from '@/lib/llm/openrouter';

export interface AnalysisOutcome {
  success: boolean;
  /** The stored analysis: structured, or a legacy markdown string on rows from before it. */
  analysis?: StructuredAnalysis | string;
  cached?: boolean;
  error?: string;
  /** Present when the pipeline ran on this call. */
  pipeline?: PipelineResult;
}

/** What is kept about a run, for the admin list. No buyer data, only how it went. */
export function analysisMeta(r: PipelineResult) {
  return {
    status: r.analysis ? 'stored' : 'failed',
    reason: r.reason,
    model: r.model,
    judgeModel: r.judgeModel,
    attempts: r.attempts.map((a) => ({
      attempt: a.attempt,
      stage: a.stage,
      ...(a.issues ? { issues: a.issues.slice(0, 600) } : {}),
      ...(a.judge ? { judge: { overall: a.judge.overall, scores: a.judge.scores, problems: a.judge.problems.slice(0, 5) } } : {}),
      ...(a.judgeError ? { judgeError: a.judgeError } : {}),
    })),
    costUsd: Math.round(r.costUsd * 1e6) / 1e6,
    latencyMs: r.latencyMs,
    at: new Date().toISOString(),
  };
}

/**
 * Runs the staged pipeline for one stored assessment and saves the result. Without `force` it
 * only fills a missing analysis, and it does not try again after a recorded failure, so the
 * public route cannot be used to spend model credit over and over.
 */
export async function generateIndustryAnalysisForAssessment(id: string, opts: { force?: boolean } = {}): Promise<AnalysisOutcome> {
  const assessment = await getAssessment(id);
  if (!assessment) return { success: false, error: 'Assessment not found' };

  if (!opts.force) {
    if (isStructuredAnalysis(assessment.analysis)) return { success: true, analysis: assessment.analysis, cached: true };
    if (assessment.industry_analysis) return { success: true, analysis: assessment.industry_analysis, cached: true };
    if (assessment.analysis_meta?.status === 'failed') return { success: false, error: 'No analysis passed the checks', cached: true };
  }

  if (!openRouterConfigured()) return { success: false, error: 'Missing API key' };

  const ctx = buildAnalysisContext(assessment);
  if (!ctx) return { success: false, error: 'Missing answers' };

  const pipeline = await runAnalysisPipeline(ctx);
  // A forced run that fails clears the old analysis too: what is shown must have passed today's checks.
  await updateAssessmentAnalysis(id, {
    analysis: pipeline.analysis,
    analysis_meta: analysisMeta(pipeline),
    ...(opts.force ? { industry_analysis: null } : {}),
  });

  if (!pipeline.analysis) {
    console.warn(`[assessment] analysis not stored for ${id}: ${pipeline.reason}`);
    return { success: false, error: 'No analysis passed the checks', pipeline };
  }
  return { success: true, analysis: pipeline.analysis, cached: false, pipeline };
}
