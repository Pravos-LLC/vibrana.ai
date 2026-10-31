// Models for the AI Readiness Assessment, all open-weight through OpenRouter.
// Chosen by the trial in docs/assessment-model-trial.md; re-run it before changing one.
// Never an Anthropic model (John, 2026-10-12). Each can be overridden by env for a trial.

/** Writes the analysis. */
export const DEFAULT_ANALYSIS_MODEL = 'deepseek/deepseek-v4.1-flash';
/** Grades the analysis. Must be a different model family from the drafter. */
export const DEFAULT_JUDGE_MODEL = 'qwen/qwen3.6-27b';
/** Reads the company website into structured context. */
export const DEFAULT_COMPANY_MODEL = 'deepseek/deepseek-v4.1-flash';

export const analysisModel = () => process.env.ASSESSMENT_ANALYSIS_MODEL || DEFAULT_ANALYSIS_MODEL;
export const judgeModel = () => process.env.ASSESSMENT_JUDGE_MODEL || DEFAULT_JUDGE_MODEL;
export const companyModel = () => process.env.ASSESSMENT_COMPANY_MODEL || DEFAULT_COMPANY_MODEL;

/** The family is the OpenRouter vendor prefix, e.g. "deepseek" in "deepseek/deepseek-v4.1-flash". */
export const modelFamily = (model: string) => model.split('/')[0];
