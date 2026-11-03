'use client'

import React, { useLayoutEffect, useRef } from 'react'
import { animate, motion } from 'framer-motion'
import { DeliverablePreview } from '@/src/components/landing'
import { EASE_OUT } from '@/src/components/landing/tokens'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import { READINESS_REPORT as R, READINESS_SOURCE_LABELS as SRC } from '@/src/ai-readiness-content'
import type { SampleReport } from './report-fixture'

/* Beat content is laid out at DESIGN_WIDTH and scaled into the sheet. The hero gives the sheet
   about 450px at 1280 and 520px from 1440 (scale 0.8 to 0.93), so no text on the sheet is set
   below 14px: it renders at 11px or more. Under 560px the beats stack at reading size, unscaled;
   `[[data-dp-mode=stacked]_&]:` styles that mode (kit README). */

export const SHEET_DESIGN_WIDTH = 560
/** A little longer than A4 (1.414), so the findings page keeps its bottom margin at reading size. */
const SHEET_ASPECT = 1.48
/** Smallest design size on the sheet. e2e/landing-readiness.spec.ts checks the rendered result. */
const MIN = 14
const mono = 'label-mono text-ink-tertiary'
const MONO = { fontSize: MIN, lineHeight: 1.35 } as const

/**
 * ReportSheet: the AI readiness report as a paper object in three beats (cover, score, findings),
 * built from the real report pieces fed a synthetic company (report-fixture.ts): the plain-average
 * overall score, the six area scores, the two lowest areas with the research (linked to its source)
 * and case the real report attaches to them, and the hours from the real workflow estimate.
 *
 * Every callout sits on the left, between the headline and the sheet.
 */
export function ReportSheet({ sample }: { sample: SampleReport }) {
  return (
    <DeliverablePreview
      variant="paper"
      designWidth={SHEET_DESIGN_WIDTH}
      aspect={SHEET_ASPECT}
      label={R.ariaSummary}
      title={R.runningHead}
      beats={[
        { id: 'cover', label: R.pager.cover, callouts: [{ label: R.cover.beatCaption, target: 'assessed', side: 'left' }] },
        {
          id: 'score',
          label: R.pager.score,
          hold: 5200,
          callouts: [
            { label: R.score.callout, target: 'overall', side: 'left', x: 0, y: 45 },
            { label: R.score.beatCaption, target: 'areas', side: 'left', x: 0, y: 12 },
          ],
        },
        { id: 'findings', label: R.pager.findings, hold: 6400, callouts: [{ label: R.findings.beatCaption, target: 'lowest', side: 'left', x: 0, y: 50 }] },
      ]}
    >
      <Cover sample={sample} />
      <Score sample={sample} />
      <Findings sample={sample} />
    </DeliverablePreview>
  )
}

function Cover({ sample }: { sample: SampleReport }) {
  return (
    <article className="flex min-h-[733px] flex-col [[data-dp-mode=stacked]_&]:min-h-0">
      <div className={mono} style={{ fontSize: 15 }}>{R.cover.kicker}</div>
      <span aria-hidden className="mt-5 block h-px w-16 bg-ink" />
      <ProfileGlyph sample={sample} className="mx-auto mt-8 w-[300px] max-w-full [[data-dp-mode=stacked]_&]:w-[220px]" />
      <div
        className="mt-auto font-display font-semibold text-ink [[data-dp-mode=stacked]_&]:mt-8"
        style={{ fontSize: 'clamp(2.25rem, 9vw, 3.5rem)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
      >
        {R.cover.title}
      </div>
      {/* Padded out to the left so the callout dot lands beside the text, not on it. */}
      <div data-callout="assessed" className="label-mono tabular -ml-6 mt-4 self-start pl-6 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.4 }}>
        {R.cover.meta(sample.date)}
      </div>
      <ol className="mt-8 grid grid-cols-2 gap-x-6 border-t border-line pt-4 [[data-dp-mode=stacked]_&]:grid-cols-1">
        {sample.dimensions.map((d, i) => (
          <li key={d.dimension} className="flex items-baseline gap-2.5 py-1 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.35 }}>
            <span className="label-mono tabular text-ink-tertiary" style={MONO}>{String(i + 1).padStart(2, '0')}</span>
            {d.dimension}
          </li>
        ))}
      </ol>
    </article>
  )
}

/**
 * The cover's figure: this company's six scores as a profile shape on a hexagonal grid, the same
 * geometry as the report's radar, drawn as a printed mark (hairlines, one accent).
 */
function ProfileGlyph({ sample, className }: { sample: SampleReport; className?: string }) {
  const c = 100
  const r = 86
  const xy = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v] as const
  }
  const pts = (vs: number[]) => vs.map((v, i) => xy(i, v).map((n) => n.toFixed(1)).join(',')).join(' ')
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <polygon key={v} points={pts(Array(6).fill(v))} fill="none" stroke="var(--border-default)" strokeWidth={0.6} />
      ))}
      {Array.from({ length: 6 }, (_, i) => {
        const [x, y] = xy(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--border-subtle)" strokeWidth={0.6} />
      })}
      <polygon points={pts(sample.dimensions.map((d) => d.score / 100))} fill="rgba(124, 58, 237, 0.10)" stroke="var(--color-brand-violet)" strokeWidth={1.4} strokeLinejoin="round" />
      {sample.dimensions.map((d, i) => {
        const [x, y] = xy(i, d.score / 100)
        return <circle key={d.dimension} cx={x} cy={y} r={d.lowest ? 3 : 2} fill={d.lowest ? 'var(--color-brand-violet)' : 'var(--text-tertiary)'} />
      })}
    </svg>
  )
}

function Score({ sample }: { sample: SampleReport }) {
  const reduce = useHydratedReducedMotion()
  return (
    <article className="flex flex-col gap-8">
      <div data-callout="overall" className="-ml-6 self-start pl-6">
        <div className={mono} style={MONO}>{R.score.overallLabel}</div>
        <div className="mt-2 flex items-baseline gap-2 font-display font-semibold text-ink">
          <CountUp value={sample.overall} reduce={reduce} />
          <span className="text-ink-tertiary" style={{ fontSize: 26, letterSpacing: '-0.01em' }}>/100</span>
        </div>
        <div className="mt-3 max-w-[34ch] text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.45 }}>{R.score.overallNote}</div>
      </div>
      <ol data-callout="areas" className="-ml-6 border-t border-line pl-6">
        {sample.dimensions.map((d, i) => (
          <li key={d.dimension} className="grid grid-cols-[minmax(0,1fr)_2.75rem] items-baseline gap-x-3 gap-y-2 border-b border-line-subtle py-3">
            <span className={cn(d.lowest ? 'text-ink' : 'text-ink-secondary')} style={{ fontSize: 15.5, lineHeight: 1.3 }}>
              {d.dimension}
            </span>
            <span className={cn('tabular text-right font-display font-semibold', d.lowest ? 'text-brand-violet-strong' : 'text-ink')} style={{ fontSize: 18 }}>
              {d.score}
            </span>
            {/* A bar on a hairline, no filled track: the two lowest in the accent, the rest neutral. */}
            <span className="relative col-span-2 flex h-2.5 items-center">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line-subtle" />
              <motion.span
                aria-hidden
                className={cn('relative h-2 origin-left rounded-r-[3px]', d.lowest ? 'bg-brand-violet' : 'bg-line-strong')}
                style={{ width: `${d.score}%` }}
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: EASE_OUT }}
              />
            </span>
          </li>
        ))}
      </ol>
    </article>
  )
}

/** The overall score counts up once when its page arrives; reduced motion shows the value. */
function CountUp({ value, reduce }: { value: number; reduce: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    el.textContent = '0'
    const controls = animate(0, value, { duration: 0.9, ease: EASE_OUT, onUpdate: (v) => (el.textContent = String(Math.round(v))) })
    return () => controls.stop()
  }, [value, reduce])
  return (
    <span ref={ref} className="tabular" style={{ fontSize: 88, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
      {value}
    </span>
  )
}

function Findings({ sample }: { sample: SampleReport }) {
  return (
    <article className="flex flex-col gap-4">
      <div data-callout="lowest" className="-ml-6 pl-6 font-display font-semibold text-ink" style={{ fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
        {R.findings.heading}
      </div>
      {sample.lowest.map((a) => (
        <section key={a.dimension} className="border-t border-line pt-3.5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-display font-semibold text-ink" style={{ fontSize: 17, lineHeight: 1.25 }}>{a.dimension}</span>
            <span className="label-mono tabular shrink-0 text-brand-violet-strong" style={MONO}>{a.score}/100</span>
          </div>
          {a.finding ? (
            <div className="mt-2.5">
              <div className={mono} style={MONO}>{R.findings.findingLabel}</div>
              <div className="mt-1 text-ink" style={{ fontSize: 15, lineHeight: 1.42 }}>{a.finding.claim}</div>
              {/* The source travels with the figure: every figure on the page links to its source. */}
              <div className="mt-1 text-ink-tertiary" style={{ fontSize: MIN, lineHeight: 1.4 }}>
                <a href={a.finding.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
                  {a.finding.sourceLabel}
                </a>
                . {SRC.studied}: {a.finding.method}.
              </div>
            </div>
          ) : null}
          {a.caseFact ? (
            <div className="mt-2.5">
              <div className={mono} style={MONO}>{R.findings.caseLabel}</div>
              <div className="mt-1 text-ink-secondary" style={{ fontSize: MIN, lineHeight: 1.42 }}>
                {a.caseFact.label}: {a.caseFact.fact}.
              </div>
            </div>
          ) : null}
        </section>
      ))}
      {sample.workflow ? (
        <section className="flex items-baseline justify-between gap-4 border-t border-line pt-3.5 [[data-dp-mode=stacked]_&]:flex-col [[data-dp-mode=stacked]_&]:gap-1">
          <div>
            <div className={mono} style={MONO}>{R.findings.workflowsLabel}</div>
            <div className="mt-1 text-ink-secondary" style={{ fontSize: 15 }}>{sample.workflow.name}</div>
          </div>
          <div className="tabular shrink-0 font-display font-semibold text-ink" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
            {sample.workflow.hours}
          </div>
        </section>
      ) : null}
    </article>
  )
}
