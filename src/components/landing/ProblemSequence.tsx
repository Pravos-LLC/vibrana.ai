'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT, PRISM_STROKE } from './tokens'

export interface ProblemLine {
  text: React.ReactNode
  /** Optional small visual for this line: a tiny scene, a figure, a captured fragment. */
  visual?: React.ReactNode
}

export interface ProblemSequenceProps {
  /** Usually three problem lines. */
  lines: readonly ProblemLine[]
  /** The close: what replaces all of them. */
  close: ProblemLine
  /** Accessible name for the section. */
  label: string
  className?: string
}

type Mode = 'static' | 'pinned' | 'flow'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * ProblemSequence: three problem lines and a close, as one visual moment.
 *
 * Desktop (pinned): the section holds still while the visitor scrolls through it. Each line comes
 * up large with a `01 / 03` counter; when the next arrives, the previous one dims and takes a
 * gradient strike. After the last line, the strikes resolve into one gradient rule under the close
 * line. Each line's optional visual sits in a slot beside the text and changes with it.
 *
 * Mobile (flow): no pinning. Lines stack, each strike draws as it scrolls into view, then the close.
 *
 * Reduced motion and before hydration (static): a ledger. Mono numbers, hairlines between rows,
 * lines in full ink, visuals beside them, and the close set under a gradient rule. Nothing hidden,
 * so the section never renders blank.
 */
export function ProblemSequence({ lines, close, label, className }: ProblemSequenceProps) {
  const reduce = useHydratedReducedMotion()
  const [wide, setWide] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const mode: Mode = reduce || wide === null ? 'static' : wide ? 'pinned' : 'flow'

  if (mode === 'pinned') return <Pinned lines={lines} close={close} label={label} className={className} />
  if (mode === 'flow') return <Flow lines={lines} close={close} label={label} className={className} />
  return <Ledger lines={lines} close={close} label={label} className={className} />
}

const lineType = 'font-display font-semibold tracking-[-0.02em] text-ink'

function Ledger({ lines, close, label, className }: ProblemSequenceProps) {
  return (
    <section aria-label={label} className={cn('mx-auto max-w-5xl', className)}>
      <ol className="border-t border-line">
        {lines.map((l, i) => (
          <li key={i} className="grid grid-cols-[3rem_1fr] items-center gap-4 border-b border-line py-6 md:grid-cols-[4rem_1fr_minmax(0,168px)] md:gap-8 md:py-8">
            <span className="label-mono tabular text-ink-tertiary">{pad(i + 1)}</span>
            <p className={cn(lineType)} style={{ fontSize: 'clamp(1.375rem, 1.1rem + 1.2vw, 2rem)', lineHeight: 1.15 }}>{l.text}</p>
            {l.visual ? <div className="col-start-2 md:col-start-3">{l.visual}</div> : null}
          </li>
        ))}
      </ol>
      <div className="mt-10 grid grid-cols-[3rem_1fr] gap-4 md:grid-cols-[4rem_1fr_minmax(0,168px)] md:gap-8">
        <span aria-hidden />
        <div>
          <p className={cn(lineType)} style={{ fontSize: 'clamp(1.75rem, 1.3rem + 2vw, 3rem)', lineHeight: 1.08 }}>{close.text}</p>
          <span aria-hidden className="mt-4 block h-[3px] w-32 rounded-full" style={{ background: PRISM_STROKE }} />
        </div>
        {close.visual ? <div className="col-start-2 md:col-start-3">{close.visual}</div> : null}
      </div>
    </section>
  )
}

/**
 * A strike that follows the text across line wraps: a gradient background on the inline run,
 * cloned per line fragment, grown from 0 to 100% width.
 */
function Struck({ on, delay = 0, children }: { on: boolean; delay?: number; children: React.ReactNode }) {
  return (
    <span
      style={{
        backgroundImage: PRISM_STROKE,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '0 58%',
        backgroundSize: on ? '100% 0.09em' : '0% 0.09em',
        transition: `background-size ${DUR.draw * 1000}ms cubic-bezier(0.23, 1, 0.32, 1) ${delay * 1000}ms`,
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
    >
      {children}
    </span>
  )
}

function Pinned({ lines, close, label, className }: ProblemSequenceProps) {
  const ref = useRef<HTMLElement>(null)
  const steps = lines.length + 1
  const [step, setStep] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(steps - 1, Math.floor(p * steps * 0.999))
    if (next !== step) setStep(next)
  })
  const closing = step === lines.length
  const visual = closing ? close.visual : lines[step]?.visual

  return (
    <section ref={ref} aria-label={label} className={cn('relative', className)} style={{ height: `${steps * 70 + 30}vh` }}>
      <div className="sticky top-0 flex min-h-[100dvh] items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_minmax(0,280px)] items-center gap-12 px-6">
          <div>
            <p className="label-mono tabular mb-8 text-ink-tertiary" aria-hidden>
              {pad(Math.min(step + 1, lines.length))} / {pad(lines.length)}
            </p>
            <ol className="space-y-5">
              {lines.map((l, i) => {
                const state = closing ? 'resolved' : i < step ? 'past' : i === step ? 'current' : 'future'
                return (
                  <motion.li
                    key={i}
                    className="relative"
                    initial={false}
                    animate={{ opacity: state === 'future' ? 0 : 1, y: state === 'future' ? 14 : 0 }}
                    transition={{ duration: DUR.draw, ease: EASE_OUT }}
                  >
                    <p
                      className={cn(lineType, 'max-w-[22ch]')}
                      style={{
                        fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 3.25rem)',
                        lineHeight: 1.1,
                        // Dim the words, not the strike: the gradient stays at full strength.
                        color: state === 'current' ? 'var(--text-primary)' : `color-mix(in srgb, var(--text-primary) ${state === 'resolved' ? 18 : 26}%, transparent)`,
                        transition: `color ${DUR.draw * 1000}ms cubic-bezier(0.23, 1, 0.32, 1)`,
                      }}
                    >
                      <Struck on={state === 'past' || state === 'resolved'}>{l.text}</Struck>
                    </p>
                  </motion.li>
                )
              })}
            </ol>
            <motion.div
              className="mt-10"
              initial={false}
              animate={{ opacity: closing ? 1 : 0, y: closing ? 0 : 16 }}
              transition={{ duration: DUR.draw, ease: EASE_OUT }}
            >
              <p className={cn(lineType)} style={{ fontSize: 'clamp(2rem, 1.4rem + 2.6vw, 3.75rem)', lineHeight: 1.05 }}>{close.text}</p>
              <motion.span
                aria-hidden
                className="mt-5 block h-[3px] w-40 origin-left rounded-full"
                style={{ background: PRISM_STROKE }}
                initial={false}
                animate={{ scaleX: closing ? 1 : 0 }}
                transition={{ duration: DUR.draw, delay: closing ? 0.12 : 0, ease: EASE_OUT }}
              />
            </motion.div>
          </div>
          <div className="relative aspect-[4/5] w-full" aria-hidden={!visual}>
            <AnimatePresence mode="wait" initial={false}>
              {visual ? (
                <motion.div
                  key={closing ? 'close' : step}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: DUR.swap, ease: EASE_OUT }}
                >
                  {visual}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function Flow({ lines, close, label, className }: ProblemSequenceProps) {
  return (
    <section aria-label={label} className={cn('px-1', className)}>
      <ol className="space-y-10">
        {lines.map((l, i) => (
          <FlowLine key={i} n={i + 1} total={lines.length} line={l} />
        ))}
      </ol>
      <motion.div className="mt-12" initial={{ opacity: 0.001, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: DUR.draw, ease: EASE_OUT }}>
        <p className={cn(lineType)} style={{ fontSize: '2rem', lineHeight: 1.08 }}>{close.text}</p>
        <span aria-hidden className="mt-4 block h-[3px] w-28 rounded-full" style={{ background: PRISM_STROKE }} />
        {close.visual ? <div className="mt-6">{close.visual}</div> : null}
      </motion.div>
    </section>
  )
}

function FlowLine({ n, total, line }: { n: number; total: number; line: ProblemLine }) {
  const [seen, setSeen] = useState(false)
  return (
    <motion.li onViewportEnter={() => setSeen(true)} viewport={{ once: true, margin: '0px 0px -45% 0px' }}>
      <p className="label-mono tabular mb-3 text-ink-tertiary" aria-hidden>
        {pad(n)} / {pad(total)}
      </p>
      <p
        className={lineType}
        style={{
          fontSize: '1.625rem',
          lineHeight: 1.15,
          color: seen ? 'color-mix(in srgb, var(--text-primary) 40%, transparent)' : 'var(--text-primary)',
          transition: `color ${DUR.draw * 1000}ms ease 600ms`,
        }}
      >
        <Struck on={seen} delay={0.6}>{line.text}</Struck>
      </p>
      {line.visual ? <div className="mt-5">{line.visual}</div> : null}
    </motion.li>
  )
}
