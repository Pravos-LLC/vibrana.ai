import { z } from 'zod'
import { FIT } from '@/src/sprint-fit-content'

export const FIT_VERSION = 'sprint-fit-v2'
export const FIT_METRICS = ['time', 'capacity', 'quality', 'spend', 'customer', 'other'] as const
export type FitMetric = typeof FIT_METRICS[number]
const text = z.string().trim().max(1200)
export const fitAnswersSchema = z.object({
  startingPoint: z.enum(['idea', 'experiment', 'prototype', 'workflow', '']),
  user: text, outcome: text, shapeFirst: z.boolean(), current: text, tools: text,
  // Legacy single-choice field remains readable for saved drafts and old inquiry clients.
  metric: z.enum(['time', 'capacity', 'quality', 'spend', 'customer', 'unknown', '']),
  metrics: z.array(z.enum(FIT_METRICS)).max(6).optional(), metricOther: text.optional(), baseline: text, target: text,
  access: z.enum(['ready', 'arrange', 'unknown', 'blocked', '']), owner: z.enum(['yes', 'identify', 'unknown', '']),
  participation: z.enum(['yes', 'arrange', 'no', '']), review: z.enum(['standard', 'required', 'unknown', '']),
  timing: z.enum(['soon', 'month', 'later', 'exploring', '']), funding: z.enum(['funded', 'proposal', 'case', 'exploring', 'private', '']),
})
export type FitAnswers = z.infer<typeof fitAnswersSchema>
export const EMPTY_FIT: FitAnswers = { startingPoint: '', user: '', outcome: '', shapeFirst: false, current: '', tools: '', metric: '', baseline: '', target: '', access: '', owner: '', participation: '', review: '', timing: '', funding: '' }
export const FIT_SAMPLE: FitAnswers = { startingPoint: 'idea', user: 'Account managers', outcome: 'A proposal assistant with a human review step', shapeFirst: false, current: 'Meeting notes become a proposal drafted by hand.', tools: 'Google Drive and our CRM', metric: 'time', baseline: '', target: 'A useful draft the account manager can check and approve', access: 'arrange', owner: 'yes', participation: 'yes', review: 'standard', timing: 'month', funding: 'proposal' }
export type FitRoute = keyof typeof FIT.routes

/** An explicit new empty selection is unanswered, even when a stale legacy field exists. */
export function selectedFitMetrics(a: FitAnswers): FitMetric[] {
  if (a.metrics !== undefined) return [...new Set(a.metrics)]
  return a.metric && a.metric !== 'unknown' ? [a.metric] : []
}
export function fitMetricText(a: FitAnswers): string {
  const selected = selectedFitMetrics(a)
  return selected.map(value => value === 'other'
    ? (a.metricOther?.trim() || FIT.empty)
    : FIT.metrics.find(option => option.value === value)?.label || FIT.empty).join(', ')
}


export function fitStepError(a: FitAnswers, step: number): string {
  if (step === 0 && !a.startingPoint) return FIT.errors.answer
  if (step === 1 && !a.shapeFirst && (!a.user.trim() || !a.outcome.trim())) return FIT.errors.outcome
  if (step === 2 && !a.current.trim()) return FIT.errors.current
  if (step === 3 && !selectedFitMetrics(a).length && a.metric !== 'unknown') return FIT.errors.answer
  if (step === 3 && a.metrics !== undefined && !a.metrics.length) return FIT.errors.answer
  if (step === 3 && selectedFitMetrics(a).includes('other') && !a.metricOther?.trim()) return FIT.errors.metricOther
  if (step === 4 && (!a.access || !a.owner || !a.participation || !a.review)) return FIT.errors.answer
  if (step === 5 && !a.timing) return FIT.errors.answer
  if (step === 6 && !a.funding) return FIT.errors.answer
  return ''
}
export function isCompleteFit(a: FitAnswers) { return FIT.steps.every((_, i) => !fitStepError(a, i)) }

export function evaluateFit(a: FitAnswers): { route: FitRoute; actions: string[] } {
  const actions: string[] = []
  if (a.access === 'blocked') actions.push(FIT.actions.blocked)
  if (a.participation === 'no') actions.push(FIT.actions.unavailable)
  if (a.review === 'required') actions.push(FIT.actions.specialist)
  if (actions.length) return { route: 'dependency', actions }
  if (a.shapeFirst || !a.user.trim() || !a.outcome.trim()) return { route: 'shape', actions: [FIT.actions.scope, FIT.actions.success] }
  if (a.access !== 'ready') actions.push(FIT.actions.access)
  if (a.owner !== 'yes') actions.push(FIT.actions.owner)
  if (a.participation !== 'yes') actions.push(FIT.actions.participation)
  if (a.review !== 'standard') actions.push(FIT.actions.review)
  if (!selectedFitMetrics(a).length || (selectedFitMetrics(a).includes('other') && !a.metricOther?.trim())) actions.push(FIT.actions.success)
  return actions.length ? { route: 'confirm', actions } : { route: 'ready', actions: [FIT.actions.ready] }
}
const label = (options: readonly { value: string; label: string }[], value: string) => options.find(o => o.value === value)?.label || FIT.empty
export function fitRows(a: FitAnswers): [string, string][] {
  return [
    [FIT.rows.startingPoint, label(FIT.starting, a.startingPoint)], [FIT.rows.user, a.user || FIT.empty], [FIT.rows.outcome, a.outcome || FIT.empty],
    [FIT.rows.current, a.current || FIT.empty], [FIT.rows.tools, a.tools || FIT.empty], [FIT.rows.metric, fitMetricText(a) || FIT.empty],
    [FIT.rows.baseline, a.baseline || FIT.empty], [FIT.rows.target, a.target || FIT.empty], [FIT.rows.access, label(FIT.access, a.access)],
    [FIT.rows.owner, label(FIT.owner, a.owner)], [FIT.rows.participation, label(FIT.participation, a.participation)],
    [FIT.rows.review, label(FIT.review, a.review)], [FIT.rows.timing, label(FIT.timing, a.timing)], [FIT.rows.funding, label(FIT.funding, a.funding)],
  ]
}
export function fitBriefText(a: FitAnswers) {
  const result = evaluateFit(a)
  return [FIT.result.title, '', ...fitRows(a).map(([k, v]) => `${k}: ${v}`), '', FIT.routes[result.route], ...result.actions.map(x => `• ${x}`), '', FIT.result.footer].join('\n')
}
