import { z } from 'zod'
import { type FitAnswers, type FitRoute, evaluateFit, fitRows, fitMetricText } from './sprint-fit'
import { BRIEF_CONTENT } from '@/src/sprint-brief-content'
import { FIT } from '@/src/sprint-fit-content'
import { SECTOR_IDS } from './simulator/types'
import type { CompanyProfile } from './simulator/api'
import { SECTOR_EXAMPLES, type SectorExample } from './simulator/sector-examples'

export const BRIEF_VERSION = 'sprint-brief-v2'
const quantity = z.number().finite().min(0).max(1_000_000).nullable()
export const businessCaseSchema = z.object({
  tasksPerWeek: quantity, minutesPerTask: quantity, peoplePerTask: z.number().finite().min(1).max(10_000).nullable(),
  targetMinutesPerTask: quantity, hourlyCost: quantity, currency: z.enum(['GBP', 'EUR', 'USD']), softwareCostMonthly: quantity,
})
export type BusinessCaseInputs = z.infer<typeof businessCaseSchema>
export const EMPTY_BUSINESS_CASE: BusinessCaseInputs = { tasksPerWeek: null, minutesPerTask: null, peoplePerTask: null, targetMinutesPerTask: null, hourlyCost: null, currency: 'GBP', softwareCostMonthly: null }
export const companyContextSchema = z.object({
  name: z.string().trim().max(160), website: z.string().trim().max(500), description: z.string().trim().max(1200),
  sector: z.enum(SECTOR_IDS), confirmed: z.boolean().optional().default(false), projectName: z.string().trim().max(160).optional(), profileDomain: z.string().max(253).optional(), researchedAt: z.string().max(40).optional(),
})
export type CompanyContext = z.infer<typeof companyContextSchema>
export const briefRequestSchema = z.object({ company: companyContextSchema, businessCase: businessCaseSchema, submissionId: z.uuid() })
export type BriefRequest = z.infer<typeof briefRequestSchema>
export type BusinessCaseResult = { inputs: BusinessCaseInputs; currentHours: number | null; targetHours: number | null; releasedHours: number | null; currentCost: number | null; targetCost: number | null; capacityValue: number | null; formulaVersion: string }
export type SprintBrief = {
  version: string; createdAt: string;
  company: Omit<CompanyContext, 'researchedAt'> & { logoUrl: string | null; sourceUrl: string | null; researchedAt: string | null; websiteSummary: string | null };
  answers: FitAnswers; narrative: { summary: string; proposal: string; assumptions: string[] };
  scope: { user: string; task: string; firstRelease: string; successMeasure: string };
  calculation: BusinessCaseResult; benchmark: Pick<SectorExample, 'company' | 'descriptor' | 'result' | 'url' | 'publisher' | 'date' | 'reportedBy'> | null;
  preparation: string[]; route: FitRoute; rows: [string, string][];
}

/** Minutes are per person per task. Task volume is team-total, never per person. */
export function calculateBusinessCase(input: BusinessCaseInputs): BusinessCaseResult {
  const parsed = businessCaseSchema.safeParse(input)
  const v = parsed.success ? parsed.data : EMPTY_BUSINESS_CASE
  const ready = v.tasksPerWeek !== null && v.minutesPerTask !== null && v.peoplePerTask !== null
  const currentHours = ready ? v.tasksPerWeek! * v.minutesPerTask! * v.peoplePerTask! / 60 : null
  const targetHours = ready && v.targetMinutesPerTask !== null ? v.tasksPerWeek! * v.targetMinutesPerTask * v.peoplePerTask! / 60 : null
  const releasedHours = currentHours !== null && targetHours !== null ? currentHours - targetHours : null
  return { inputs: v, currentHours, targetHours, releasedHours,
    currentCost: currentHours !== null && v.hourlyCost !== null ? currentHours * v.hourlyCost : null,
    targetCost: targetHours !== null && v.hourlyCost !== null ? targetHours * v.hourlyCost : null,
    capacityValue: releasedHours !== null && v.hourlyCost !== null ? releasedHours * v.hourlyCost : null,
    formulaVersion: 'weekly-person-hours-v1' }
}

const PERSONAL_EMAIL_DOMAINS = new Set(['gmail.com','googlemail.com','hotmail.com','hotmail.co.uk','outlook.com','outlook.co.uk','live.com','live.co.uk','msn.com','yahoo.com','yahoo.co.uk','ymail.com','icloud.com','me.com','mac.com','aol.com','proton.me','protonmail.com','pm.me','hey.com','fastmail.com','mail.com','gmx.com','gmx.de','zoho.com','yandex.com','qq.com','163.com'])
/** A suggestion only. The visitor must confirm/edit it before a website is read. */
export function inferWebsiteFromEmail(email: string): string {
  const domain = email.trim().toLowerCase().split('@')[1]
  return domain && /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/.test(domain) && !PERSONAL_EMAIL_DOMAINS.has(domain) ? `https://${domain}` : ''
}

// A sector example is industry context, not a claim that the visitor's task is comparable.
// "other" is intentionally excluded: its simulator example is a retailer, not a
// representative example for an unknown industry.
export function selectSprintExample(company: CompanyContext, _answers: FitAnswers): SprintBrief['benchmark'] {
  const example = company.sector === 'other' ? null : SECTOR_EXAMPLES[company.sector]
  if (!example || !example.url.startsWith('https://')) return null
  const { company: name, descriptor, result, url, publisher, date, reportedBy } = example
  return { company: name, descriptor, result, url, publisher, date, reportedBy }
}

/** Pure fallback and presentation model. Website facts must come from the server's cached profile. */
export function buildSprintBrief(answers: FitAnswers, request: BriefRequest, profile: CompanyProfile | null = null, createdAt = new Date().toISOString()): SprintBrief {
  const result = evaluateFit(answers)
  const metric = fitMetricText(answers)
  const company = { name: request.company.name, website: request.company.website, description: request.company.description, sector: request.company.sector, confirmed: request.company.confirmed, projectName: request.company.projectName }
  const website = company.website.trim()
  const successMeasure = [metric, answers.target.trim()].filter(Boolean).join(' · ')
  return {
    version: BRIEF_VERSION, createdAt,
    company: { ...company, website, researchedAt: profile?.researchedAt ?? null, logoUrl: profile?.logoUrl ?? null, sourceUrl: profile ? `https://${profile.domain}` : null, websiteSummary: profile?.summary ?? null },
    answers,
    narrative: { summary: company.description, proposal: answers.outcome.trim() || BRIEF_CONTENT.shapeProposal, assumptions: [] },
    scope: { user: answers.user.trim() || BRIEF_CONTENT.shapeUser, task: answers.current.trim() || BRIEF_CONTENT.shapeCurrent, firstRelease: answers.outcome.trim() || BRIEF_CONTENT.shapeRelease, successMeasure: successMeasure || BRIEF_CONTENT.shapeSuccess },
    calculation: calculateBusinessCase(request.businessCase), benchmark: selectSprintExample(company, answers), preparation: result.actions, route: result.route,
    rows: fitRows(answers).filter(([, value]) => value && value !== FIT.empty),
  }
}
