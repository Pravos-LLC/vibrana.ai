// EU AI Act Readiness engine: answers in, a cited compliance profile out. Pure and
// deterministic (no model call), so every line of the report traces to an answer and a
// provision. Method and limits: docs/eu-ai-act-assessment-methodology.md.

import { EU_QUESTIONS, EU_SECTIONS, NOT_APPLICABLE, euQuestionById, type EUSectionKey } from '@/src/eu-ai-act-questions-content';
import { EU_OBLIGATIONS, type ObligationId } from '@/src/eu-ai-act-obligations-content';

export type Answers = Record<string, number>;

export type Scope = 'in-scope' | 'likely' | 'out-of-scope';
export type Role = 'deployer' | 'builder' | 'provider' | 'model-provider' | 'unknown';
export type SizeBand = 'sme' | 'smc' | 'check';
export type ObligationStatus = 'met' | 'partial' | 'gap' | 'unanswered';
export type UseLevel = 'yes' | 'pilot' | 'planned' | 'no';
export type HighRiskArea = 'employment' | 'credit-insurance' | 'education' | 'sensitive';

export interface ObligationResult {
  id: ObligationId;
  status: ObligationStatus;
  /** 0-100 average of the scored answers, or null when none were answered. */
  score: number | null;
  appliesFrom: string | null;
  /** True when the date has passed on `asOf`. */
  inForce: boolean;
}

export interface EUProfile {
  instrumentVersion: number;
  asOf: string;
  scope: Scope;
  role: Role;
  sizeBand: SizeBand;
  /** Annex III areas with AI in use or piloted (`planned` shows as upcoming). */
  highRisk: { area: HighRiskArea; level: UseLevel }[];
  riskTier: 'high-risk' | 'transparency' | 'minimal';
  /** Sections 2-6, 0-100 each, null when every answer was not applicable or skipped. */
  sectionScores: { key: EUSectionKey; title: string; score: number | null }[];
  readinessScore: number;
  readinessLevel: 'early' | 'developing' | 'advanced';
  obligations: ObligationResult[];
  /** Answer that suggests a prohibited practice may already be in use. */
  prohibitedFlag: boolean;
}

const HIGH_RISK_QUESTIONS: Record<HighRiskArea, string> = {
  employment: 'eu_hr',
  'credit-insurance': 'eu_credit',
  education: 'eu_edu',
  sensitive: 'eu_sensitive',
};

function valueOf(answers: Answers, id: string): string | undefined {
  const score = answers[id];
  if (score === undefined) return undefined;
  return euQuestionById(id)?.options.find((o) => o.score === score)?.value;
}

const average = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** Scored answers for these questions, without skipped and not-applicable ones. */
function scored(answers: Answers, ids: readonly string[]): number[] {
  return ids.map((id) => answers[id]).filter((s): s is number => s !== undefined && s !== NOT_APPLICABLE);
}

function statusOf(score: number | null): ObligationStatus {
  if (score === null) return 'unanswered';
  if (score >= 80) return 'met';
  if (score >= 40) return 'partial';
  return 'gap';
}

/**
 * SME and SMC are defined in euros and count linked enterprises, which a form cannot see, so
 * this is a first read from headcount and the revenue band (USD), never a determination.
 *   SME (Rec. 2003/361/EC): fewer than 250 staff, turnover up to EUR 50M and/or balance sheet up to EUR 43M.
 *   SMC (Rec. (EU) 2025/1099): not an SME, fewer than 750 staff, turnover up to EUR 150M or balance sheet up to EUR 129M.
 */
export function sizeBandOf(teamSize: string, revenueBand: string): SizeBand {
  const under250 = ['1-50 employees', '50-150 employees', '151-250 employees'].includes(teamSize);
  const under750 = ['251-350 employees', '351-500 employees'].includes(teamSize);
  if (under250 && revenueBand && revenueBand !== '$50M+') return 'sme';
  if (under750 || (under250 && revenueBand === '$50M+')) return 'smc';
  return 'check';
}

export function evaluate(answers: Answers, company: { teamSize: string; revenueBand: string }, asOf = new Date()): EUProfile {
  const today = asOf.toISOString().slice(0, 10);

  const scopeValue = valueOf(answers, 'eu_scope');
  const scope: Scope = scopeValue === 'eu' || scopeValue === 'output' ? 'in-scope' : scopeValue === 'none' ? 'out-of-scope' : 'likely';
  const role = (valueOf(answers, 'eu_build') as Role | undefined) ?? 'unknown';

  const highRisk = (Object.keys(HIGH_RISK_QUESTIONS) as HighRiskArea[])
    .map((area) => ({ area, level: (valueOf(answers, HIGH_RISK_QUESTIONS[area]) as UseLevel | undefined) ?? 'no' }))
    .filter((h) => h.level !== 'no');
  const anyHighRisk = highRisk.length > 0;

  const chat = valueOf(answers, 'eu_chat');
  const gen = valueOf(answers, 'eu_gen');
  const interacts = chat !== undefined && chat !== 'no';
  const publishes = gen !== undefined && gen !== 'no';
  const riskTier = anyHighRisk ? 'high-risk' : interacts || publishes ? 'transparency' : 'minimal';

  const applies: Record<ObligationId, boolean> = {
    'prohibited-practices': true,
    'ai-literacy': true,
    'inventory-classification': true,
    'role-clarity': true,
    // Art. 50(1) binds the provider: graded only for a system the company built or configured (or plans to).
    'transparency-interaction': chat === 'own' || chat === 'planned',
    'transparency-content': publishes,
    'high-risk-deployer': anyHighRisk,
    'inform-workers': highRisk.some((h) => h.area === 'employment'),
    'inform-affected-people': anyHighRisk,
    fria: highRisk.some((h) => h.area === 'credit-insurance'),
    'provider-obligations': anyHighRisk && (role === 'provider' || role === 'model-provider'),
    'vendor-contracts': true,
    'accountable-owner': true,
  };

  const obligations: ObligationResult[] = EU_OBLIGATIONS.filter((o) => applies[o.id]).map((o) => {
    const score = average(scored(answers, o.questions));
    return {
      id: o.id,
      // Applicability-only items (no questions) are open work until someone does them.
      status: o.questions.length ? statusOf(score) : 'gap',
      score,
      appliesFrom: o.appliesFrom,
      inForce: o.appliesFrom !== null && o.appliesFrom <= today,
    };
  });

  const sectionScores = EU_SECTIONS.filter((s) => s.scored).map((s) => ({
    key: s.key,
    title: s.title,
    score: average(scored(answers, EU_QUESTIONS[s.key].map((q) => q.id))),
  }));
  const readinessScore = average(sectionScores.map((s) => s.score).filter((s): s is number => s !== null)) ?? 0;
  const readinessLevel = readinessScore >= 75 ? 'advanced' : readinessScore >= 45 ? 'developing' : 'early';

  // "Yes" or "possibly" to a tool inferring how staff or candidates feel (Art. 5(1)(f)).
  const emotion = answers.eu_emotion;
  const prohibitedFlag = emotion === 0 || emotion === 25;

  return {
    instrumentVersion: 1,
    asOf: today,
    scope,
    role,
    sizeBand: sizeBandOf(company.teamSize, company.revenueBand),
    highRisk,
    riskTier,
    sectionScores,
    readinessScore,
    readinessLevel,
    obligations,
    prohibitedFlag,
  };
}

/** Every key a valid submission may carry, and only scores that question offers. */
export function validAnswers(answers: unknown): answers is Answers {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false;
  const entries = Object.entries(answers as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 40) return false;
  return entries.every(([id, score]) => {
    const q = euQuestionById(id);
    return !!q && typeof score === 'number' && q.options.some((o) => o.score === score);
  });
}
