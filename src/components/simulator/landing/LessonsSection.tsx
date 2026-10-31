'use client'

import type { ReactNode } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useReducedMotion } from 'framer-motion'
import { CountUp } from '@/src/components/prism/motion/CountUp'
import { Button } from '@/src/components/prism/Button'
import { Eyebrow } from '@/src/components/prism/Eyebrow'
import { Heading } from '@/src/components/prism/typography'
import { SIM_LESSONS, SIM_WHY } from '@/src/simulator-landing-lessons-content'

const EASE = [0.22, 1, 0.36, 1] as const
const VIEW = { once: true, amount: 0.45 } as const

export interface LessonsSectionProps {
  /** Runs the tool. Defaults to scrolling to and focusing the URL field in the hero form. */
  onRun?: () => void
}

function focusForm() {
  const el = document.getElementById('sim-url')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/** Small helpers so each illustration reads as drawing instructions, not motion boilerplate. */
function useDraw() {
  const reduce = useReducedMotion()
  const line = (delay: number, duration = 0.8) => ({
    initial: reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: VIEW,
    transition: { duration, ease: EASE, delay },
  })
  const pop = (delay: number) => ({
    initial: reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: VIEW,
    transition: { duration: 0.5, ease: EASE, delay },
    style: { transformBox: 'fill-box' as const, transformOrigin: 'center' },
  })
  const grow = (delay: number) => ({
    initial: reduce ? { scaleY: 1 } : { scaleY: 0 },
    whileInView: { scaleY: 1 },
    viewport: VIEW,
    transition: { duration: 0.9, ease: EASE, delay },
    style: { transformBox: 'fill-box' as const, transformOrigin: 'bottom' },
  })
  return { line, pop, grow }
}

const SVG_PROPS = { viewBox: '0 0 240 160', className: 'h-full w-full', 'aria-hidden': true } as const

/** People: a network of four, one connection lights up. */
function PeopleArt() {
  const { line, pop } = useDraw()
  const pts = [
    [48, 112],
    [112, 42],
    [188, 78],
    [132, 120],
  ] as const
  const edges = [
    [0, 1],
    [1, 2],
    [0, 3],
    [2, 3],
  ] as const
  return (
    <svg {...SVG_PROPS}>
      {edges.map(([a, b], i) => (
        <motion.path
          key={i}
          d={`M${pts[a][0]} ${pts[a][1]} L${pts[b][0]} ${pts[b][1]}`}
          strokeWidth="2"
          className="stroke-line-strong"
          fill="none"
          {...line(0.2 + i * 0.15)}
        />
      ))}
      <motion.path d={`M${pts[1][0]} ${pts[1][1]} L${pts[3][0]} ${pts[3][1]}`} strokeWidth="3" strokeLinecap="round" className="stroke-brand-violet" fill="none" {...line(1, 1)} />
      {pts.map(([x, y], i) => (
        <motion.g key={i} {...pop(i * 0.12)}>
          <circle cx={x} cy={y} r="17" className="fill-surface-base stroke-ink-tertiary" strokeWidth="2" />
          <circle cx={x} cy={y - 3} r="4.5" className="fill-ink-secondary" />
          <path d={`M${x - 8} ${y + 8} a8 6 0 0 1 16 0`} className="fill-ink-secondary" />
        </motion.g>
      ))}
    </svg>
  )
}

/** Workflow: a tool bolted onto five old steps, then a shorter flow with AI inside it. */
function WorkflowArt() {
  const { line, pop } = useDraw()
  const old = [14, 56, 98, 140, 182]
  return (
    <svg {...SVG_PROPS}>
      <motion.path d="M24 42 H206" strokeWidth="2" className="stroke-line-strong" fill="none" {...line(0.1, 0.9)} />
      {old.map((x, i) => (
        <motion.rect key={x} x={x} y="30" width="34" height="24" rx="5" className="fill-surface-base stroke-ink-tertiary" strokeWidth="2" {...pop(0.1 + i * 0.1)} />
      ))}
      <motion.g {...pop(0.8)}>
        <rect x="170" y="2" width="38" height="18" rx="9" className="fill-surface-overlay stroke-brand-violet" strokeWidth="2" strokeDasharray="3 3" />
      </motion.g>
      <motion.path d="M189 20 V30" strokeWidth="2" strokeDasharray="2 3" className="stroke-brand-violet" fill="none" {...line(0.9, 0.4)} />
      <motion.path d="M14 100 H226" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" className="stroke-line-strong" fill="none" {...line(1.1, 0.5)} />
      <motion.path d="M24 130 H216" strokeWidth="2" className="stroke-line-strong" fill="none" {...line(1.3, 0.9)} />
      {[24, 100, 176].map((x, i) => (
        <motion.rect
          key={x}
          x={x}
          y="116"
          width="40"
          height="28"
          rx="6"
          className={i === 1 ? 'fill-brand-violet stroke-brand-violet' : 'fill-surface-base stroke-ink-tertiary'}
          strokeWidth="2"
          {...pop(1.3 + i * 0.15)}
        />
      ))}
    </svg>
  )
}

/** Training: three teams, three different needs, and a loop that repeats. */
function TrainingArt() {
  const { line, grow, pop } = useDraw()
  const bars = [
    { x: 22, h: 46 },
    { x: 66, h: 92 },
    { x: 110, h: 68 },
  ]
  return (
    <svg {...SVG_PROPS}>
      <motion.path d="M14 140 H146" strokeWidth="2" className="stroke-line-strong" fill="none" {...line(0, 0.6)} />
      {bars.map((b, i) => (
        <motion.rect key={b.x} x={b.x} y={140 - b.h} width="30" height={b.h} rx="5" className={i === 1 ? 'fill-brand-violet' : 'fill-ink-tertiary'} {...grow(0.2 + i * 0.2)} />
      ))}
      <motion.path d="M214 96 A30 30 0 1 1 184 66" strokeWidth="3" strokeLinecap="round" className="stroke-brand-violet" fill="none" {...line(0.9, 1.2)} />
      <motion.path d="M176 58 L186 66 L176 74" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-brand-violet" fill="none" {...line(2, 0.4)} />
      <motion.circle cx="184" cy="96" r="5" className="fill-ink-secondary" {...pop(1.1)} />
    </svg>
  )
}

/** Governance: the gate is drawn first, then paths widen behind it. */
function GovernanceArt() {
  const { line, pop } = useDraw()
  const fan = [30, 62, 98, 130]
  return (
    <svg {...SVG_PROPS}>
      <motion.path d="M96 24 V136 M124 24 V136" strokeWidth="4" strokeLinecap="round" className="stroke-ink" fill="none" {...line(0, 0.7)} />
      <motion.path d="M90 24 H130" strokeWidth="4" strokeLinecap="round" className="stroke-ink" fill="none" {...line(0.5, 0.4)} />
      <motion.path d="M14 80 H96" strokeWidth="3" strokeLinecap="round" className="stroke-ink-tertiary" fill="none" {...line(0.9, 0.6)} />
      {fan.map((y, i) => (
        <motion.path key={y} d={`M124 80 C160 80 170 ${y} 222 ${y}`} strokeWidth="3" strokeLinecap="round" className="stroke-brand-violet" fill="none" {...line(1.4 + i * 0.12, 0.9)} />
      ))}
      <motion.circle cx="110" cy="80" r="6" className="fill-brand-violet" {...pop(1.2)} />
    </svg>
  )
}

const ART: Record<string, () => ReactNode> = {
  people: PeopleArt,
  workflow: WorkflowArt,
  training: TrainingArt,
  governance: GovernanceArt,
}

function Lesson({ item, n }: { item: (typeof SIM_LESSONS.items)[number]; n: number }) {
  const reduce = useReducedMotion()
  const Art = ART[item.id]
  return (
    <motion.li
      className="grid gap-6 border-t border-line-subtle py-10 first:border-t-0 first:pt-0 sm:grid-cols-[13rem_1fr] sm:gap-8"
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div role="img" aria-label={item.illustration} className="aspect-[3/2] w-full max-w-[13rem] rounded-2xl border border-line-subtle bg-surface-raised p-3">
        <Art />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-brand-violet-strong" aria-hidden>
          {String(n).padStart(2, '0')}
        </p>
        <h3 className="mt-1 font-display text-2xl font-semibold text-ink">{item.title}</h3>
        <p className="mt-3 type-base text-ink-secondary">{item.body}</p>
        <div className="mt-4 border-l-2 border-brand-violet pl-4">
          <p className="mb-1 type-xs font-medium uppercase tracking-[0.12em] text-ink-tertiary">{SIM_LESSONS.evidenceLabel}</p>
          <p className="type-sm text-ink">{item.evidence}</p>
          <p className="mt-1 type-xs text-ink-tertiary">{item.source}</p>
        </div>
      </div>
    </motion.li>
  )
}

function WhyBlock({ onRun }: { onRun: () => void }) {
  const reduce = useReducedMotion()
  const W = SIM_WHY
  return (
    <motion.div
      id={W.id}
      className="mt-24 grid gap-12 rounded-3xl border border-line-subtle bg-surface-raised p-8 md:p-12 lg:grid-cols-12 lg:gap-16"
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <div className="lg:col-span-7">
        <Eyebrow className="mb-4">{W.eyebrow}</Eyebrow>
        <Heading level={2}>{W.title}</Heading>
        <div className="mt-6 space-y-4 type-base text-ink-secondary">
          {W.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Image
            src="public-demo:portrait"
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="font-display text-lg font-semibold text-ink">{W.signature.name}</p>
            <p className="type-sm text-ink-tertiary">{W.signature.org}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start gap-10 lg:col-span-5">
        <dl className="divide-y divide-line-subtle border-y border-line-subtle">
          {W.facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between py-5">
              <dt className="type-base text-ink-secondary">{f.label}</dt>
              <dd className="font-display text-5xl font-semibold leading-none text-ink">
                <CountUp value={f.value} duration={1.2} />
              </dd>
            </div>
          ))}
        </dl>
        <div>
          <Button onClick={onRun} showArrow>
            {W.cta}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function LessonsSection({ onRun }: LessonsSectionProps = {}) {
  const L = SIM_LESSONS
  return (
    <section id={L.id} aria-label={L.title} className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Eyebrow className="mb-4">{L.eyebrow}</Eyebrow>
              <Heading level={2}>{L.title}</Heading>
              <p className="mt-4 type-base text-secondary-token">{L.subtitle}</p>
            </div>
          </div>
          <ol className="lg:col-span-8">
            {L.items.map((item, i) => (
              <Lesson key={item.id} item={item} n={i + 1} />
            ))}
          </ol>
        </div>
        <WhyBlock onRun={onRun ?? focusForm} />
      </div>
    </section>
  )
}
