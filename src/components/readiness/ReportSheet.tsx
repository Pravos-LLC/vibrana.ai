'use client'

import React, { useLayoutEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { animate, motion } from 'framer-motion'
import { DeliverablePreview } from '@/src/components/landing'
import { EASE_OUT } from '@/src/components/landing/tokens'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'
import { READINESS_REPORT as R } from '@/src/ai-readiness-content'
import type { SampleReport } from './report-fixture'

// The real assessment radar. Loaded on demand: the score page is never the first thing on screen.
const LiveRadarChart = dynamic(() => import('@/src/components/assessment/LiveRadarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-xl border border-line-subtle" />,
})

/* Beat content is laid out at 720px and scaled into the sheet; under 560px the beats stack at
   reading size. `[[data-dp-mode=stacked]_&]:` styles that stacked mode (see the kit README). */

const mono = 'label-mono text-ink-tertiary'
/** Mono labels on the sheet are set larger: the sheet is scaled down to about two thirds. */
const MONO = { fontSize: 14 } as const

/**
 * ReportSheet: the AI readiness report as a paper object in three beats (cover, score, findings),
 * built from the real report pieces fed a synthetic company (report-fixture.ts): the live radar,
 * the plain-average overall score, the two lowest areas with the research and case the real report
 * attaches to them, and the hours from the real workflow estimate.
 */
export function ReportSheet({ sample }: { sample: SampleReport }) {
  return (
    <DeliverablePreview
      variant="paper"
      designWidth={620}
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
            { label: R.score.beatCaption, target: 'areas', side: 'right', x: 100, y: 22 },
          ],
        },
        { id: 'findings', label: R.pager.findings, hold: 5600, callouts: [{ label: R.findings.beatCaption, target: 'lowest', side: 'left', x: 0, y: 50 }] },
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
    <article className="flex min-h-[781px] flex-col [[data-dp-mode=stacked]_&]:min-h-0">
      <div className="label-mono text-ink-tertiary" style={{ fontSize: 15 }}>{R.cover.kicker}</div>
      {/* The one gradient on the sheet: a short rule, like a printed report's color band. */}
      <span aria-hidden className="mt-5 block h-[3px] w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #2dd4bf)' }} />
      <ProfileGlyph sample={sample} className="mx-auto mt-10 w-[340px] max-w-full [[data-dp-mode=stacked]_&]:mt-8 [[data-dp-mode=stacked]_&]:w-[220px]" />
      <div
        className="mt-auto font-display font-semibold text-ink [[data-dp-mode=stacked]_&]:mt-8"
        style={{ fontSize: 'clamp(2.25rem, 9vw, 3.75rem)', lineHeight: 1.02, letterSpacing: '-0.035em' }}
      >
        {R.cover.title}
      </div>
      {/* Padded out to the left so the callout dot lands beside the text, not on it. */}
      <div data-callout="assessed" className="label-mono tabular -ml-6 mt-5 self-start pl-6 text-ink-secondary" style={{ fontSize: 15 }}>
        {R.cover.meta(sample.date)}
      </div>
      <ol className="mt-12 grid grid-cols-2 gap-x-8 border-t border-line pt-5 [[data-dp-mode=stacked]_&]:mt-8 [[data-dp-mode=stacked]_&]:grid-cols-1">
        {sample.dimensions.map((d, i) => (
          <li key={d.dimension} className="flex items-baseline gap-3 py-1.5 text-ink-secondary" style={{ fontSize: 16, lineHeight: 1.4 }}>
            <span className="label-mono tabular text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
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
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
    return `${(c + Math.cos(a) * r * v).toFixed(1)},${(c + Math.sin(a) * r * v).toFixed(1)}`
  }
  const ring = (v: number) => Array.from({ length: 6 }, (_, i) => pt(i, v)).join(' ')
  const shape = sample.dimensions.map((d, i) => pt(i, d.score / 100)).join(' ')
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <polygon key={v} points={ring(v)} fill="none" stroke="var(--border-default)" strokeWidth={0.6} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={c} y1={c} x2={pt(i, 1).split(',')[0]} y2={pt(i, 1).split(',')[1]} stroke="var(--border-subtle)" strokeWidth={0.6} />
      ))}
      <polygon points={shape} fill="rgba(124, 58, 237, 0.10)" stroke="var(--color-brand-violet)" strokeWidth={1.4} strokeLinejoin="round" />
      {sample.dimensions.map((d, i) => {
        const [x, y] = pt(i, d.score / 100).split(',')
        return <circle key={d.dimension} cx={x} cy={y} r={d.lowest ? 3 : 2} fill={d.lowest ? 'var(--color-brand-violet)' : 'var(--text-tertiary)'} />
      })}
    </svg>
  )
}

function Score({ sample }: { sample: SampleReport }) {
  const reduce = useHydratedReducedMotion()
  return (
    <article className="flex flex-col gap-10 [[data-dp-mode=stacked]_&]:gap-8">
      <div className="grid grid-cols-[1fr_290px] items-center gap-5 [[data-dp-mode=stacked]_&]:grid-cols-1">
        <div data-callout="overall" className="-ml-6 self-start pl-6">
          <div className={mono} style={MONO}>{R.score.overallLabel}</div>
          <div className="mt-3 flex items-baseline gap-2 font-display font-semibold text-ink">
            <CountUp value={sample.overall} reduce={reduce} />
            <span className="text-ink-tertiary" style={{ fontSize: 28, letterSpacing: '-0.01em' }}>/100</span>
          </div>
          <div className="mt-4 max-w-[30ch] text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.5 }}>{R.score.overallNote}</div>
        </div>
        <div className="min-h-[300px] dark:[&_.recharts-polar-grid_line]:[stroke:var(--border-default)] dark:[&_.recharts-polar-grid_path]:[stroke:var(--border-default)]">
          <LiveRadarChart dimensionScores={sample.dimensions} predictedArchetype={null} totalAnswered={24} />
        </div>
      </div>
      <ol data-callout="areas" className="-mr-6 border-t border-line pr-6">
        {sample.dimensions.map((d, i) => (
          <li key={d.dimension} className="grid grid-cols-[minmax(0,13.5rem)_1fr_2.5rem] items-center gap-5 border-b border-line-subtle py-3 [[data-dp-mode=stacked]_&]:grid-cols-[minmax(0,1fr)_2.5rem] [[data-dp-mode=stacked]_&]:gap-x-3 [[data-dp-mode=stacked]_&]:gap-y-2">
            <span className={cn(d.lowest ? 'text-ink' : 'text-ink-secondary')} style={{ fontSize: 15, lineHeight: 1.35 }}>
              {d.dimension}
            </span>
            {/* A bar on a hairline, no filled track: the two lowest in the accent, the rest neutral. */}
            <span className="relative flex h-3 items-center [[data-dp-mode=stacked]_&]:col-span-2 [[data-dp-mode=stacked]_&]:row-start-2">
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
            <span className={cn('tabular text-right font-display font-semibold', d.lowest ? 'text-brand-violet-strong' : 'text-ink')} style={{ fontSize: 18 }}>
              {d.score}
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
    <span ref={ref} className="tabular" style={{ fontSize: 96, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
      {value}
    </span>
  )
}

function Findings({ sample }: { sample: SampleReport }) {
  return (
    <article className="flex flex-col gap-8">
      <div
        data-callout="lowest"
        className="-ml-6 pl-6 font-display font-semibold text-ink"
        style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: '-0.025em' }}
      >
        {R.findings.heading}
      </div>
      {sample.lowest.map((a) => (
        <section key={a.dimension} className="border-t border-line pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-display font-semibold text-ink" style={{ fontSize: 19, lineHeight: 1.25 }}>{a.dimension}</span>
            <span className="label-mono tabular shrink-0 text-brand-violet-strong">{a.score}/100</span>
          </div>
          {a.finding ? (
            <div className="mt-4">
              <div className={mono} style={MONO}>{R.findings.findingLabel}</div>
              <div className="mt-1.5 text-ink" style={{ fontSize: 15, lineHeight: 1.5 }}>{a.finding.claim}</div>
              <div className="mt-1 text-ink-tertiary" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{a.finding.method}.</div>
            </div>
          ) : null}
          {a.caseFact ? (
            <div className="mt-4">
              <div className={mono} style={MONO}>{R.findings.caseLabel}</div>
              <div className="mt-1.5 text-ink-secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
                {a.caseFact.label}: {a.caseFact.fact}.
              </div>
            </div>
          ) : null}
        </section>
      ))}
      {sample.workflow ? (
        <section className="flex items-baseline justify-between gap-6 border-t border-line pt-5 [[data-dp-mode=stacked]_&]:flex-col [[data-dp-mode=stacked]_&]:gap-2">
          <div>
            <div className={mono} style={MONO}>{R.findings.workflowsLabel}</div>
            <div className="mt-1.5 text-ink-secondary" style={{ fontSize: 15 }}>{sample.workflow.name}</div>
          </div>
          <div className="tabular shrink-0 font-display font-semibold text-ink" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>
            {sample.workflow.hours}
          </div>
        </section>
      ) : null}
    </article>
  )
}
