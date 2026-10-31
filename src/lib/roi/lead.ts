import { z } from 'zod'
import { WORKFLOW_IDS } from './evidence'
import { CURRENCIES, LIMITS } from './calc'

/** Where this lead came from. Stored in assessment_leads.source (first source wins). */
export const ROI_ENTRY_POINT = 'roi-calculator'

const n = (max: number) => z.number().finite().min(0).max(max)
const honeypot = z.string().max(0, 'Leave the hidden field empty').optional().default('')

/** "Email me this": the visitor's inputs. The server recomputes the result from these. */
export const roiLeadSchema = z.object({
  email: z.string().trim().email('Enter a valid work email').max(255),
  companyName: z.string().trim().max(160).optional().default(''),
  currency: z.enum(CURRENCIES),
  weeksPerYear: n(LIMITS.weeksPerYear),
  workWeekHours: n(LIMITS.hoursPerWeek),
  sprintCost: n(LIMITS.sprintCost),
  runCostPerMonth: n(LIMITS.runCostPerMonth).optional().default(0),
  workflows: z
    .array(
      z.object({
        id: z.enum(WORKFLOW_IDS),
        people: n(LIMITS.people),
        hoursPerWeek: n(LIMITS.hoursPerWeek),
        hourlyCost: n(LIMITS.hourlyCost),
        conservativePct: n(100),
        expectedPct: n(100),
      }),
    )
    .min(1)
    .max(WORKFLOW_IDS.length),
  botField: honeypot,
  utm_source: z.string().max(200).optional().default(''),
  utm_campaign: z.string().max(200).optional().default(''),
})

export type RoiLead = z.infer<typeof roiLeadSchema>
