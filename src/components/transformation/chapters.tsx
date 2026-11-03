'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { AI_TRANSFORMATION_DIFFERENTIATORS, AI_TRANSFORMATION_LANDSCAPE } from '@/src/enterprise-content'
import { TRANSFORMATION_PAGE, type ChapterId, type PhaseId } from '@/src/ai-transformation-content'
import { GateCard, ProofMetric, ProofMetricRow, DUR, EASE_OUT } from '@/src/components/landing'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { accent } from './accent'

const T = TRANSFORMATION_PAGE
const CHAPTER_NUMBER = Object.fromEntries(T.rail.chapters.map((c) => [c.id, c.number])) as Record<ChapterId, string>
const PHASES = T.map.phases

const H2 = { fontSize: 'clamp(2rem, 1.35rem + 2.3vw, 3.4rem)', lineHeight: 1.06, letterSpacing: '-0.03em' } as const
const H3 = { fontSize: 'clamp(1.5rem, 1.2rem + 1.1vw, 2.15rem)', lineHeight: 1.12, letterSpacing: '-0.02em' } as const
const LEDE = { fontSize: 'clamp(1.1rem, 1rem + 0.45vw, 1.35rem)', lineHeight: 1.55 } as const

/**
 * Chapter: one numbered section of the report. A hairline, the chapter number set large in the
 * margin (the rail repeats it in mono), the title with its one serif italic word, and the lede.
 */
export function Chapter({
  id,
  title,
  lede,
  eyebrow,
  aside,
  strip,
  children,
}: {
  id: ChapterId
  title: string
  lede?: string
  eyebrow?: string
  aside?: React.ReactNode
  strip?: PhaseId
  children?: React.ReactNode
}) {
  const headingId = `${id}-title`
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-28 border-t border-line pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <header className="min-w-0">
          <div className="flex items-center gap-5">
            <span aria-hidden className="tabular font-display font-light text-ink-tertiary" style={{ fontSize: '3.25rem', lineHeight: 0.9, letterSpacing: '-0.04em' }}>
              {CHAPTER_NUMBER[id]}
            </span>
            {strip ? <PhaseStrip current={strip} /> : eyebrow ? <span className="label-mono max-w-[48ch] text-ink-tertiary">{eyebrow}</span> : null}
          </div>
          <h2 id={headingId} className="mt-6 max-w-[22ch] font-display font-semibold text-ink" style={H2}>
            {accent(title)}
          </h2>
          {lede ? (
            <p className="mt-6 max-w-[60ch] text-ink-secondary" style={LEDE}>
              {lede}
            </p>
          ) : null}
        </header>
        {aside ? <div className="min-w-0 lg:pt-[4.6rem]">{aside}</div> : null}
      </div>
      {children ? <div className="mt-12 md:mt-16">{children}</div> : null}
    </section>
  )
}

/** Where this chapter sits on the operating map: a small echo of the hero figure. */
function PhaseStrip({ current }: { current: PhaseId }) {
  const at = PHASES.findIndex((p) => p.id === current)
  return (
    <span aria-hidden className="grid w-full max-w-[26rem] grid-cols-4 gap-1.5">
      {PHASES.map((p, i) => (
        <span key={p.id} className="flex flex-col gap-2">
          <span className={`h-[3px] rounded-full ${i < at ? 'bg-[var(--border-strong)]' : i === at ? 'bg-ink' : 'bg-[var(--border-subtle)]'}`} />
          <span className={`label-mono ${i === at ? 'text-ink' : 'text-ink-tertiary'}`}>{p.name}</span>
        </span>
      ))}
    </span>
  )
}

/** Chapter 0 margin: the live fit criteria. */
export function FitCriteria() {
  return (
    <div className="border-l border-line pl-5">
      <p className="label-mono text-ink-tertiary">{T.outcomes.fitEyebrow}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {T.outcomes.fit.map((item) => (
          <li key={item} className="text-ink-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The landscape (kept copy): three ways to buy this, as one ledger. Columns read top to bottom;
 * the last row lines up what each leaves you with, so the comparison is made by alignment, not
 * by icons. Our column is the raised band.
 */
export function Landscape() {
  const L = AI_TRANSFORMATION_LANDSCAPE
  // Title row, the points before the last, and the aligned "what you're left with" row.
  const rows = Math.max(...L.cards.map((c) => c.points.length)) + 1
  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="label-mono text-ink-tertiary">{L.eyebrow}</p>
        <h3 className="mt-3 max-w-[30ch] font-display font-semibold text-ink" style={H3}>
          {L.title}
        </h3>
        <p className="mt-4 max-w-[62ch] text-ink-secondary">{L.subtitle}</p>
      </div>
      <div className="flex flex-col gap-10 md:grid md:grid-cols-3 md:gap-0">
        {L.cards.map((card, col) => {
          const ours = card.highlighted
          const left = card.points[card.points.length - 1]
          const points = card.points.slice(0, -1)
          const cell = `md:px-6 ${ours ? 'md:bg-surface-raised' : ''}`
          return (
            <div key={card.title} className={`grid md:grid-rows-subgrid ${ours ? 'max-md:rounded-2xl max-md:bg-surface-raised max-md:px-5 max-md:pt-5' : ''} ${col > 0 && !ours ? 'md:border-l md:border-line' : ''}`} style={{ gridRow: `span ${rows}` }}>
              <div className={`${cell} pb-5 md:pt-6 ${ours ? 'md:rounded-t-2xl' : ''}`}>
                <h4 className="font-display font-semibold text-ink" style={{ fontSize: '1.25rem', lineHeight: 1.25 }}>
                  {card.title}
                </h4>
                <p className="label-mono mt-2 text-ink-tertiary">{card.subtitle}</p>
              </div>
              {Array.from({ length: rows - 2 }, (_, r) => {
                const point = points[r]
                return (
                  <div key={r} className={`${cell} border-t border-line-subtle py-4 ${point ? '' : 'max-md:hidden'}`}>
                    {point ? (
                      <>
                        <div className="text-sm font-semibold text-ink">{point.label}</div>
                        <div className="mt-1 text-sm leading-6 text-ink-secondary">{point.description}</div>
                      </>
                    ) : null}
                  </div>
                )
              })}
              <div className={`${cell} border-t border-[var(--border-strong)] pb-7 pt-5 ${ours ? 'md:rounded-b-2xl' : ''}`}>
                <div className="label-mono text-ink-tertiary">{left.label}</div>
                <div className="mt-2 font-display text-ink" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>
                  {left.description}
                </div>
                {card.proof ? (
                  <div className="mt-5 flex flex-col gap-2">
                    <span className="label-mono text-ink-tertiary">See it in a real engagement</span>
                    {card.proof.map((ref) => (
                      <Link key={ref.href} href={ref.href} className="group inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
                        {ref.label}
                        <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** How we work (kept copy): six commitments as a two-column definition list, no icons. */
export function Differentiators() {
  const D = AI_TRANSFORMATION_DIFFERENTIATORS
  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="label-mono text-ink-tertiary">{D.eyebrow}</p>
        <h3 className="mt-3 max-w-[30ch] font-display font-semibold text-ink" style={H3}>
          {D.title}
        </h3>
        <p className="mt-4 max-w-[62ch] text-ink-secondary">{D.subtitle}</p>
      </div>
      <dl className="grid gap-x-12 lg:grid-cols-2">
        {D.items.map((item) => (
          <div key={item.title} className="grid gap-2 border-t border-line py-6 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <dt className="font-display font-semibold text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.3 }}>
              {item.title}
            </dt>
            <dd className="m-0 text-sm leading-6 text-ink-secondary">{item.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Closes chapter 0 and opens the four phases: the live outcomes heading as a pull line. */
export function OutcomesBridge() {
  return (
    <p className="border-l-2 border-ink pl-6 font-display text-ink" style={{ fontSize: 'clamp(1.35rem, 1.1rem + 0.9vw, 1.9rem)', lineHeight: 1.25, letterSpacing: '-0.015em', maxWidth: '34ch' }}>
      {T.outcomes.title}.
    </p>
  )
}

/**
 * A phase chapter's body: what the SOW fixes for this phase, then the gate that closes it. Gate 1
 * carries the page's one margin note.
 */
export function PhaseBody({ phase }: { phase: PhaseId }) {
  const gate = T.gates[phase]
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
      <div className="flex flex-col gap-8">
        <div className="border-t border-ink pt-4">
          <p className="label-mono text-ink-tertiary">Fixed in the SOW</p>
          <p className="mt-3 text-ink" style={{ fontSize: 'clamp(1.05rem, 0.98rem + 0.3vw, 1.2rem)', lineHeight: 1.55 }}>
            {T.outcomes.items[phase]}
          </p>
        </div>
        {phase === 'map' ? <p className="label-mono border-l-2 border-line pl-3 text-ink-secondary">{T.marginNote}</p> : null}
      </div>
      <GateCard
        gate={gate.gate}
        when={gate.when}
        title={gate.title}
        criteria={gate.criteria}
        signedBy={gate.signedBy}
        transfers={gate.transfers}
        note={gate.note}
        labels={T.gateLabels}
        className="md:p-9"
      />
    </div>
  )
}

/** Chapter 5: the related six-week engagement, by the numbers, then its one approved result. */
export function ProofSpread() {
  const P = T.proof
  return (
    <div className="flex flex-col gap-12">
      <ProofMetricRow maxColumns={3} label={P.eyebrow}>
        {P.metrics.map((m) => (
          <ProofMetric key={m.label} value={m.value} label={m.label} />
        ))}
      </ProofMetricRow>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
        <p className="max-w-[44ch] font-display text-ink" style={{ fontSize: 'clamp(1.3rem, 1.1rem + 0.8vw, 1.8rem)', lineHeight: 1.35, letterSpacing: '-0.015em' }}>
          {P.body}
        </p>
        <HoursGlyph />
      </div>
      <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="max-w-[60ch] text-ink-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.55 }}>
          {P.diligence}
        </p>
        <Link href={P.caseStudyHref} className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
          {P.caseStudyLink}
          <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}

/**
 * The approved result (T10) drawn once: about 10 hours, then 1, on one scale with no track. The
 * sentence beside it carries the claim, so the glyph is hidden from assistive tech.
 */
function HoursGlyph() {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.8 })
  const reduce = useHydratedReducedMotion()
  const rows = [
    { label: 'Before', value: 'about 10 h', width: 1, ink: 'var(--border-strong)' },
    { label: 'Now', value: '1 h', width: 0.1, ink: 'var(--text-primary)' },
  ]
  return (
    <div ref={ref} aria-hidden className="flex flex-col gap-4">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[4rem_1fr] items-center gap-4">
          <span className="label-mono text-ink-tertiary">{r.label}</span>
          <span className="flex items-center gap-3">
            <motion.span
              className="block h-2 rounded-r-[4px]"
              style={{ width: `${r.width * 72}%`, background: r.ink, transformOrigin: '0% 50%' }}
              initial={false}
              animate={{ transform: seen || reduce ? 'scaleX(1)' : 'scaleX(0)' }}
              transition={{ duration: DUR.draw, delay: reduce ? 0 : i * 0.12, ease: EASE_OUT }}
            />
            <span className="label-mono tabular whitespace-nowrap text-ink">{r.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/** Chapter 6: the kept description, then the four kept safeguards set as numbered clauses. */
export function SafeguardClauses() {
  return (
    <ol className="grid gap-x-10 gap-y-10 md:grid-cols-2">
      {T.safeguards.items.map((item, i) => (
        <li key={item} className="border-t-2 border-ink pt-4">
          <span className="label-mono tabular text-ink-tertiary">6.{i + 1}</span>
          <p className="mt-3 max-w-[40ch] text-ink" style={{ fontSize: 'clamp(1.1rem, 1rem + 0.4vw, 1.3rem)', lineHeight: 1.45 }}>
            {item}
          </p>
        </li>
      ))}
    </ol>
  )
}
