'use client'

/**
 * A t-drivable twin of the EU AI Act Readiness question screen, for the studio reel.
 *
 * The live screen (src/components/eu-ai-act/EUAssessmentForm.tsx around FlowAssessment) keeps the
 * current question in internal state and advances on timers, so a reel cannot seek it frame by
 * frame. This mock renders the same markup, classes and copy (the same content modules: the EU
 * questions, EU_RESULTS labels, ASSESSMENT_COPY and the dimension colors) from props alone, and
 * the sidebar reads the real engine (`evaluate`), so it updates exactly as the live one does.
 * Keep it in step with FlowAssessment's question view and EUAssessmentForm's desktop layout.
 */
import React from 'react'
import { ASSESSMENT_COPY as c } from '@/src/components/assessment/assessment-copy'
import { EU_QUESTIONS, EU_SECTIONS } from '@/src/eu-ai-act-questions-content'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { DIMENSION_COLOR_OBJECTS } from '@/src/lib/assessment/dimension-colors'
import { evaluate, type Answers } from '@/src/lib/eu-ai-act/engine'

const SECTIONS = EU_SECTIONS.map((s) => ({ id: s.key, title: s.title, questions: EU_QUESTIONS[s.key] }))
const TOTAL = SECTIONS.reduce((n, s) => n + s.questions.length, 0)

export interface EUAssessmentQuestionMockProps {
  /** Answers given so far (question id to option score). */
  answers: Answers
  /** The question on screen. */
  questionId: string
  /** 0..1 opacity of the question body (the live screen fades it between questions). */
  questionOpacity?: number
  company: { teamSize: string; revenueBand: string }
  /** The engine's date, fixed for a reel so a frame never depends on the clock. */
  asOf: Date
}

export function EUAssessmentQuestionMock({ answers, questionId, questionOpacity = 1, company, asOf }: EUAssessmentQuestionMockProps) {
  const dimIdx = SECTIONS.findIndex((s) => s.questions.some((q) => q.id === questionId))
  const dim = SECTIONS[dimIdx]!
  const qIdx = dim.questions.findIndex((q) => q.id === questionId)
  const question = dim.questions[qIdx]!
  const color = DIMENSION_COLOR_OBJECTS[dimIdx] ?? DIMENSION_COLOR_OBJECTS[0]
  const answered = SECTIONS.reduce((n, s) => n + s.questions.filter((q) => answers[q.id] !== undefined).length, 0)
  const live = evaluate(answers, company, asOf)

  return (
    <div className="grid grid-cols-[320px_1fr] gap-8">
      <aside>
        <div className="rounded-xl border border-line-subtle bg-surface-card p-5">
          <div className="type-xs font-medium uppercase tracking-wider text-ink-tertiary">{R.eyebrow}</div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-ink-tertiary">{R.labels.scope}</dt>
              <dd className="font-medium text-ink">{answers.eu_scope === undefined ? '…' : R.scopeLabels[live.scope]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.role}</dt>
              <dd className="font-medium text-ink">{answers.eu_build === undefined ? '…' : R.roleLabels[live.role]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.tier}</dt>
              <dd className="font-medium text-ink">{answers.eu_gen === undefined ? '…' : R.tierLabels[live.riskTier]}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">{R.labels.obligations}</dt>
              <dd className="font-medium tabular-nums text-ink">{answers.eu_gen === undefined ? '…' : live.obligations.length}</dd>
            </div>
          </dl>
        </div>
      </aside>
      <div className="rounded-xl border border-line-subtle bg-surface-card p-8">
        <div className="flow-assessment flex min-h-[400px] flex-col">
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="type-xs font-medium uppercase tracking-wider" style={{ color: color.color }}>
                {dim.title}
              </span>
              <span className="type-xs text-ink-secondary">{c.shared.progressOf(answered, TOTAL)}</span>
            </div>
            <div className="flex gap-1">
              {SECTIONS.map((d, i) => {
                const done = d.questions.filter((q) => answers[q.id] !== undefined).length
                const active = i === dimIdx
                const col = DIMENSION_COLOR_OBJECTS[i]!.color
                return (
                  <div
                    key={d.id}
                    className={`h-1.5 flex-1 overflow-hidden rounded-full ${active ? 'ring-1 ring-offset-1 ring-offset-transparent' : ''}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', ['--tw-ring-color' as string]: active ? col : 'transparent' }}
                  >
                    <div className="h-full" style={{ width: `${(done / d.questions.length) * 100}%`, backgroundColor: col }} />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <div style={{ opacity: questionOpacity }}>
              <div className="py-4">
                <div className="mb-6">
                  <span className="type-xs uppercase tracking-wider text-ink-tertiary">{c.shared.questionOf(qIdx + 1, dim.questions.length)}</span>
                </div>
                <h2 className="type-lg mb-5 font-medium leading-relaxed text-ink">{question.question}</h2>
                <div className="space-y-3">
                  {question.options.map((option, idx) => {
                    const selected = answers[question.id] === option.score
                    return (
                      <div
                        key={option.label}
                        className={`group flex min-h-[56px] w-full items-center gap-3 rounded-lg border px-4 py-4 text-left ${
                          selected ? 'ring-1' : 'border-line-subtle bg-white/2'
                        }`}
                        style={selected ? { backgroundColor: `${color.color}20`, borderColor: `${color.color}80`, boxShadow: `0 0 0 1px ${color.color}30` } : {}}
                      >
                        <span
                          className="type-sm flex h-7 w-7 shrink-0 items-center justify-center rounded font-medium"
                          style={selected ? { backgroundColor: color.color, color: 'white' } : { backgroundColor: 'rgba(124,58,237,0.10)', color: 'var(--text-tertiary)' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="type-sm flex-1 text-ink">{option.label}</span>
                        {selected ? (
                          <svg className="h-5 w-5 shrink-0" style={{ color: color.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
                <p className="type-xs mt-6 text-center text-ink-tertiary">
                  <kbd className="rounded bg-surface-card-hover px-1.5 py-0.5 text-ink-secondary">1</kbd>-<kbd className="rounded bg-surface-card-hover px-1.5 py-0.5 text-ink-secondary">4</kbd> {c.shared.selectHint}
                  <span className="mx-2">·</span>
                  <kbd className="rounded bg-surface-card-hover px-1.5 py-0.5 text-ink-secondary">9</kbd> {c.shared.skipHint}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-line-subtle pt-6">
            <span className="type-sm -ml-3 flex items-center gap-2 rounded-lg px-3 py-2 text-ink-secondary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {c.shared.back}
            </span>
            {answers[question.id] !== undefined ? (
              <span className="type-sm -mr-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ color: color.color }}>
                {c.shared.next}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
