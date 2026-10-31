/**
 * Client-safe contract for the Company Brain Lab application.
 *
 * The form (src/components/company-brain-lab/CompanyBrainLabApplication.tsx) and the
 * route (app/api/enterprise-inquiry/route.ts) share these limits, so the browser stops
 * an answer at exactly the length the server accepts.
 */
export const COMPANY_BRAIN_LAB_INTENT = 'Company Brain Lab founding cohort'

export const COMPANY_BRAIN_LAB_LIMITS = {
  implementationOwner: { min: 1, max: 300 },
  workflow: { min: 20, max: 1500 },
  importance: { min: 20, max: 1500 },
  access: { min: 20, max: 1500 },
  commitment: { min: 1, max: 300 },
  constraints: { min: 0, max: 1500 },
} as const

export type CompanyBrainLabAnswers = { [K in keyof typeof COMPANY_BRAIN_LAB_LIMITS]: string }

export interface CompanyBrainLabApplicationInput extends CompanyBrainLabAnswers {
  intent: typeof COMPANY_BRAIN_LAB_INTENT
  contactName: string
  email: string
  companyName: string
  teamSize: string
}
