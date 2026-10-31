/**
 * Track values the sprint fit-call API accepts.
 *
 * `product` and `workflow` are the original values and keep their meaning (existing
 * `engagement_inquiries` rows stay valid): `product` is the AI Product Sprint and
 * `workflow` is the AI Workflow Automation Sprint. `triage` is the paid Workflow Triage
 * first step; `not-sure` lets a buyer book a fit call before choosing.
 */
export const SPRINT_TRACK_IDS = ['product', 'workflow', 'governance', 'people', 'triage', 'not-sure'] as const
export type SprintTrackId = (typeof SPRINT_TRACK_IDS)[number]

export function isSprintTrackId(value: string | null | undefined): value is SprintTrackId {
  return !!value && (SPRINT_TRACK_IDS as readonly string[]).includes(value)
}
