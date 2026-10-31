'use client'

import React from 'react'
import { ArrowDown } from 'lucide-react'
import { Eyebrow, Heading, cn } from '@/src/components/prism'
import { FlywheelDiagram } from './FlywheelDiagram'
import { LoopGlyph, FamilyAgentGlyph } from './loop-glyphs'
import {
  MACRO_FLYWHEEL,
  LEARNING_LOOP,
  LOOP_ROADMAP,
  FAMILY_AGENT,
  type LoopAccent,
} from '@/src/curriculum-loop-content'

const SECTION_H2 =
  'mt-4 max-w-2xl type-xl font-display font-semibold leading-tight tracking-tight text-ink'
const CARD = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

const ACCENT_TEXT: Record<LoopAccent, string> = {
  violet: 'text-brand-violet-strong',
  blue: 'text-brand-blue-strong',
  cyan: 'text-brand-cyan-strong',
  emerald: 'text-brand-emerald-strong',
}
const ACCENT_DOT: Record<LoopAccent, string> = {
  violet: 'bg-brand-violet',
  blue: 'bg-brand-blue',
  cyan: 'bg-brand-cyan',
  emerald: 'bg-brand-emerald',
}

/** Per-node dwell time. The full loop = nodes × this, and the orbiting dot is
 *  driven on the same clock, so the gallery advances exactly as the dot arrives. */
const PER_NODE_MS = 3500

/**
 * Drives a wheel's active node + its orbiting signal dot from one rAF clock, so
 * the panel "gallery" advances in lockstep with the dot. The dot position is
 * written imperatively (no per-frame React render); the integer index updates
 * only when it changes (once per dwell). Paused off-screen, on hover/focus, and
 * under prefers-reduced-motion.
 */
function useWheelGallery(count: number) {
  const FULL = count * PER_NODE_MS
  const [index, setIndex] = React.useState(0)
  const indexRef = React.useRef(0)
  const elapsed = React.useRef(0)
  const last = React.useRef<number | null>(null)
  const raf = React.useRef<number | null>(null)
  const paused = React.useRef(false)
  const inView = React.useRef(false)
  const reduced = React.useRef(false)
  const signalRef = React.useRef<SVGCircleElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const writeDot = (frac: number) => {
    if (signalRef.current) signalRef.current.style.offsetDistance = `${(frac * 100).toFixed(2)}%`
  }

  const stop = React.useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current)
    raf.current = null
    last.current = null
  }, [])

  const frame = React.useCallback(
    (ts: number) => {
      if (last.current == null) last.current = ts
      elapsed.current = (elapsed.current + (ts - last.current)) % FULL
      last.current = ts
      const frac = elapsed.current / FULL
      writeDot(frac)
      const idx = Math.floor(frac * count) % count
      if (idx !== indexRef.current) {
        indexRef.current = idx
        setIndex(idx)
      }
      raf.current = requestAnimationFrame(frame)
    },
    [FULL, count],
  )

  const start = React.useCallback(() => {
    if (inView.current && !paused.current && !reduced.current && raf.current == null) {
      raf.current = requestAnimationFrame(frame)
    }
  }, [frame])

  React.useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      inView.current = true
      start()
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting
        if (e.isIntersecting) start()
        else stop()
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pause = () => {
    paused.current = true
    stop()
  }
  const resume = () => {
    paused.current = false
    start()
  }
  /** Manual pick: snap the clock + dot to that node so play resumes from there. */
  const selectIndex = (i: number) => {
    indexRef.current = i
    elapsed.current = (i / count) * FULL
    writeDot(i / count)
    setIndex(i)
  }

  return { index, signalRef, containerRef, pause, resume, selectIndex }
}

function Kicker({ accent, children }: { accent: LoopAccent; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 type-xs font-mono uppercase tracking-[0.12em]',
        ACCENT_TEXT[accent],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_DOT[accent])} aria-hidden />
      {children}
    </span>
  )
}

function SignalChip({ accent, label }: { accent: LoopAccent; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line-subtle bg-surface-card px-3 py-1 text-sm text-ink-secondary">
      <span className={cn('h-1.5 w-1.5 rounded-full', ACCENT_DOT[accent])} aria-hidden />
      {label}
    </span>
  )
}

/** A node (id, kicker, accent, highlight) the wheel needs to render. */
interface WheelItem {
  id: string
  kicker: string
  accent: LoopAccent
  highlight?: boolean
}

/** A self-driving wheel + its detail panel, in the hero two-column rhythm. */
function WheelBlock({
  items,
  idPrefix,
  label,
  renderPanel,
  flip,
}: {
  items: WheelItem[]
  idPrefix: string
  label: string
  renderPanel: (activeId: string) => React.ReactNode
  /** When true, the wheel sits on the left (desktop). */
  flip?: boolean
}) {
  const { index, signalRef, containerRef, pause, resume, selectIndex } = useWheelGallery(items.length)
  const activeId = items[index]?.id ?? items[0].id

  const onSelect = (id: string) => {
    const i = items.findIndex((it) => it.id === id)
    if (i >= 0) selectIndex(i)
  }

  return (
    <div
      ref={containerRef}
      className="grid items-center gap-10 lg:grid-cols-2"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      <div className={cn('relative mx-auto w-full max-w-md', flip ? 'lg:order-1' : 'lg:order-2')}>
        <FlywheelDiagram
          nodes={items}
          activeId={activeId}
          onSelect={onSelect}
          idPrefix={idPrefix}
          label={label}
          signalRef={signalRef}
          controlled
        />
      </div>
      <div className={cn(flip ? 'lg:order-2' : 'lg:order-1')}>{renderPanel(activeId)}</div>
    </div>
  )
}

export function LearningLoopSection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* ── 1. Macro: Vibrana × AIOS flywheel ───────────────────────────── */}
          <Eyebrow>{MACRO_FLYWHEEL.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2}>{MACRO_FLYWHEEL.heading}</Heading>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-secondary">
          {MACRO_FLYWHEEL.thesis}
        </p>

        <div className="mt-12">
          <WheelBlock
            items={MACRO_FLYWHEEL.nodes}
            idPrefix="macro"
            label="The Vibrana and AIOS flywheel"
            renderPanel={(activeId) => {
              const node = MACRO_FLYWHEEL.nodes.find((n) => n.id === activeId) ?? MACRO_FLYWHEEL.nodes[0]
              return (
                <div className={cn(CARD, 'p-7')}>
                  <Kicker accent={node.accent}>{node.kicker}</Kicker>
                  <h3 className="mt-3 type-lg font-display font-semibold text-ink">{node.title}</h3>
                  <p className="mt-3 text-base leading-7 text-ink-secondary">{node.detail}</p>
                  {node.highlight && (
                    <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-blue-strong">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                      {MACRO_FLYWHEEL.growHint}
                    </p>
                  )}
                </div>
              )
            }}
          />
        </div>

        {/* ── 2. Inner: the daily learning loop ───────────────────────────── */}
        <div className="mt-20 border-t border-line-subtle pt-16">
          <Eyebrow>{LEARNING_LOOP.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={LEARNING_LOOP.gradientWord} gradient={LEARNING_LOOP.gradient} gradientClassName="font-serif-accent">
            {LEARNING_LOOP.heading}
          </Heading>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-secondary">{LEARNING_LOOP.intro}</p>

          <div className="mt-12">
            <WheelBlock
              items={LEARNING_LOOP.stages}
              idPrefix="loop"
              label="The daily learning loop"
              flip
              renderPanel={(activeId) => {
                const stage = LEARNING_LOOP.stages.find((s) => s.id === activeId) ?? LEARNING_LOOP.stages[0]
                return (
                  <div className={cn(CARD, 'p-7')}>
                    <Kicker accent={stage.accent}>{stage.kicker}</Kicker>
                    <h3 className="mt-3 type-lg font-display font-semibold text-ink">{stage.title}</h3>
                    <p className="mt-3 text-base leading-7 text-ink-secondary">{stage.detail}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {stage.signals.map((s) => (
                        <SignalChip key={s} accent={stage.accent} label={s} />
                      ))}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </div>

        {/* ── 3. Roadmap: human → agents ──────────────────────────────────── */}
        <div className="mt-20 border-t border-line-subtle pt-16">
          <Eyebrow>{LOOP_ROADMAP.eyebrow}</Eyebrow>
          <Heading level={2} className={SECTION_H2} gradientWord={LOOP_ROADMAP.gradientWord} gradient={LOOP_ROADMAP.gradient} gradientClassName="font-serif-accent">
            {LOOP_ROADMAP.heading}
          </Heading>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-secondary">{LOOP_ROADMAP.intro}</p>

          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {LOOP_ROADMAP.horizons.map((h) => (
              <li key={h.phase} className={cn(CARD, 'flex flex-col p-6')}>
                <LoopGlyph kind={h.glyph} accent={h.accent} />
                <span className="mt-4">
                  <Kicker accent={h.accent}>{h.phase}</Kicker>
                </span>
                <h3 className="mt-2 type-base font-display font-semibold text-ink">{h.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{h.body}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* ── 4. Family-agent capstone ────────────────────────────────────── */}
        <div className="mt-12">
          <div className={cn(CARD, 'grid items-center gap-8 p-8 lg:grid-cols-2')}>
            <div>
              <Eyebrow>{FAMILY_AGENT.eyebrow}</Eyebrow>
              <Heading level={2} className="mt-3 type-lg font-display font-semibold leading-tight text-ink">
                {FAMILY_AGENT.heading}
              </Heading>
              <p className="mt-4 text-base leading-7 text-ink-secondary">{FAMILY_AGENT.body}</p>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <FamilyAgentGlyph spokes={FAMILY_AGENT.spokes} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
