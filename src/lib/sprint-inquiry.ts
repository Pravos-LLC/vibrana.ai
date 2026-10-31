import { z } from 'zod'
import { fitAnswersSchema, isCompleteFit } from './sprint-fit'
import { briefRequestSchema } from './sprint-brief'
import { SPRINT_TRACK_IDS } from './sprint-tracks'

export { SPRINT_TRACK_IDS, isSprintTrackId, type SprintTrackId } from './sprint-tracks'

const optionalText = (max: number) => z.string().trim().max(max).optional().default('')
/** A honeypot: real visitors never see or fill it, so any value means a bot. */
const honeypot = z.string().max(0, 'Leave the hidden field empty').optional().default('')

export const sprintInquirySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid work email').max(255),
  companyName: z.string().trim().max(160),
  track: z.enum(SPRINT_TRACK_IDS, { message: 'Choose a track, or "Not sure yet"' }),
  desiredOutcome: z.string().trim().min(10, 'Tell us in a line what should work differently').max(4000),
  // Fields from the retired two-step application. Optional so older clients and
  // integrations still validate; the fit-call form no longer collects them.
  companyWebsite: optionalText(500),
  role: optionalText(160),
  internalOwner: optionalText(500),
  startWindow: z.enum(['within-30-days', '30-60-days', '60-90-days', 'exploring', '']).optional().default(''),
  budgetBand: z.enum(['15-25k', '25-50k', '50k-plus', '']).optional().default(''),
  fitCheck: fitAnswersSchema.refine(isCompleteFit, 'Complete the fit check before sharing the brief').optional(),
  briefRequest: briefRequestSchema.optional(),
  resendEmail: z.boolean().optional().default(false),
  botField: honeypot,
  /** Legacy honeypot name, still rejected if a cached old form posts it filled. */
  faxNumber: honeypot,
  utm_source: z.string().max(200).optional().default(''),
  utm_medium: z.string().max(200).optional().default(''),
  utm_campaign: z.string().max(200).optional().default(''),
  utm_content: z.string().max(200).optional().default(''),
  referrer: z.string().max(1000).optional().default(''),
}).superRefine((input, context) => {
  if (!input.briefRequest && !input.companyName) context.addIssue({ code: 'custom', path: ['companyName'], message: 'Company is required' })
  if (input.briefRequest && !input.fitCheck) context.addIssue({ code: 'custom', path: ['fitCheck'], message: 'Complete the fit check before creating your brief' })
  if (input.briefRequest && !input.role.trim()) context.addIssue({ code: 'custom', path: ['role'], message: 'Role is required' })
})

export type SprintInquiry = z.infer<typeof sprintInquirySchema>
