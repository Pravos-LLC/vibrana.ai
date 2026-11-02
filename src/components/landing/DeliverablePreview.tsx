'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT } from './tokens'

export interface PreviewCallout {
  /** Short note in the mono label voice: `Scored across 6 dimensions`. */
  label: string
  /** Anchor point on the page, in percent of the frame (0 to 100). */
  x: number
  y: number
  /** Which side of the frame the label sits on at desktop widths. Defaults by x. */
  side?: 'left' | 'right'
}

export interface PreviewBeat {
  id: string
  /** Pager label: `Cover`, `Score`, `Findings`. */
  label: string
  callouts?: readonly PreviewCallout[]
  /** Milliseconds this beat holds before auto-advance. Default 4200. */
  hold?: number
}

export interface DeliverablePreviewProps {
  /** One child per beat, in order. Each child is a real component fed synthetic fixtures. */
  children: React.ReactNode
  beats: readonly PreviewBeat[]
  /** `paper`: an A4 sheet that straightens as it arrives. `app`: a desktop app window. */
  variant?: 'paper' | 'app'
  /** Window title (app) or running head (paper). */
  title?: string
  /**
   * Width in px the children are laid out at before scaling into the frame. Real components keep
   * their own proportions this way. Defaults: paper 720, app 1040.
   */
  designWidth?: number
  /** Auto-advance through the beats while in view. Off under reduced motion. Default true. */
  autoplay?: boolean
  /** Accessible name for the preview. */
  label: string
  className?: string
}

/**
 * DeliverablePreview: shows the thing the buyer gets, using the real components at preview scale.
 *
 * Children render at `designWidth` and the frame scales them down to fit (transform, so their own
 * layout never reflows). The beats script steps through them: cover, score, findings. A beat
 * remounts its child, so a gauge or a Gantt plays its own entrance each time it comes round.
 * Callouts sit outside the scaled layer, so they stay readable: a dot on the page and a short mono
 * label beside the frame at desktop; on mobile, numbered dots with the notes listed under the frame.
 *
 * Auto-advance runs only while the frame is in view and pauses on hover, focus and the pause
 * button. Reduced motion: no auto-advance, no tilt, beats switch with a short fade.
 */
export function DeliverablePreview({
  children,
  beats,
  variant = 'paper',
  title,
  designWidth,
  autoplay = true,
  label,
  className,
}: DeliverablePreviewProps) {
  const pages = React.Children.toArray(children)
  const [beat, setBeat] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const reduce = useHydratedReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.4 })
  const width = designWidth ?? (variant === 'paper' ? 720 : 1040)
  const aspect = variant === 'paper' ? 1.414 : 0.625
  const [scale, setScale] = useState(variant === 'paper' ? 0.62 : 0.6)
  const current = beats[beat]
  const running = autoplay && !reduce && !paused && !hovered && inView && beats.length > 1

  // Fit the design width into the frame.
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => setBeat((b) => (b + 1) % beats.length), current?.hold ?? 4200)
    return () => window.clearTimeout(id)
  }, [running, beat, beats.length, current?.hold])

  const paper = variant === 'paper'

  return (
    <figure
      ref={rootRef}
      aria-label={label}
      className={cn('m-0', className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="relative mx-auto" style={{ maxWidth: paper ? 520 : 760 }}>
        <motion.div
          initial={false}
          animate={reduce || !paper ? { rotate: 0, y: 0 } : inView ? { rotate: 0, y: 0 } : { rotate: -2, y: 12 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className={cn(
            'relative overflow-hidden border border-line bg-surface-base',
            paper ? 'rounded-[6px] shadow-[0_1px_0_var(--border-subtle),0_30px_60px_-30px_rgba(24,18,60,0.35),0_12px_24px_-16px_rgba(24,18,60,0.18)]' : 'rounded-xl shadow-[0_30px_70px_-34px_rgba(24,18,60,0.45)]',
          )}
        >
          {paper ? (
            <div className="flex items-center justify-between border-b border-line-subtle px-5 py-2.5">
              <span className="label-mono text-ink-tertiary">{title}</span>
              <span className="label-mono tabular text-ink-tertiary">
                p. {String(beat + 1).padStart(2, '0')} / {String(beats.length).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-b border-line-subtle bg-surface-raised px-3 py-2">
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
              </span>
              <span className="label-mono flex-1 truncate text-center text-ink-tertiary">{title}</span>
              <span className="w-[42px]" aria-hidden />
            </div>
          )}

          <div ref={viewportRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${aspect}` }}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: 'blur(2px)' }}
                transition={{ duration: reduce ? DUR.reduced : 0.32, ease: EASE_OUT }}
              >
                {/* Scale lives on a plain wrapper: motion owns the transform of its own node. */}
                <div className="origin-top-left" style={{ width, transform: `scale(${scale})` }}>
                  <div className={paper ? 'p-12' : 'p-8'}>{pages[beat]}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Callouts: outside the scaled layer so they stay at reading size. */}
        <AnimatePresence initial={false}>
          {(current.callouts ?? []).map((c, i) => (
            <Callout key={`${current.id}-${i}`} c={c} n={i + 1} delay={reduce ? 0 : 0.35 + i * 0.08} reduce={reduce} />
          ))}
        </AnimatePresence>
      </div>

      {current.callouts?.length ? (
        <ol className="mx-auto mt-4 max-w-[520px] space-y-1 lg:hidden" aria-label="Notes">
          {current.callouts.map((c, i) => (
            <li key={i} className="label-mono flex gap-2 text-ink-secondary">
              <span className="tabular text-ink-tertiary">{i + 1}</span>
              {c.label}
            </li>
          ))}
        </ol>
      ) : null}

      {/* Pager: the beats as labeled steps, with play and pause. */}
      <figcaption className="mx-auto mt-5 flex max-w-[520px] items-center justify-center gap-1">
        {beats.length > 1 && autoplay && !reduce ? (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play the preview' : 'Pause the preview'}
            className="mr-1 grid h-8 w-8 place-items-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-surface-overlay hover:text-ink active:scale-[0.94]"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        ) : null}
        {beats.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-current={i === beat ? 'step' : undefined}
            onClick={() => setBeat(i)}
            className={cn(
              'label-mono relative rounded-full px-3 py-1.5 transition-colors duration-150 active:scale-[0.97]',
              i === beat ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary',
            )}
          >
            {i === beat ? (
              <motion.span layoutId={`dp-pill-${label}`} className="absolute inset-0 -z-10 rounded-full bg-surface-overlay" transition={{ duration: 0.24, ease: EASE_OUT }} />
            ) : null}
            <span className="tabular mr-1.5 text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
            {b.label}
          </button>
        ))}
      </figcaption>
    </figure>
  )
}

function Callout({ c, n, delay, reduce }: { c: PreviewCallout; n: number; delay: number; reduce: boolean }) {
  const right = (c.side ?? (c.x > 50 ? 'right' : 'left')) === 'right'
  // The callout spans from its anchor to 9.5rem past the frame edge; the line fills the gap.
  const span: React.CSSProperties = right ? { left: `${c.x}%`, right: '-9.5rem' } : { right: `${100 - c.x}%`, left: '-9.5rem' }
  return (
    <motion.div
      aria-hidden
      className={cn('pointer-events-none absolute flex h-0 items-center', right ? '' : 'flex-row-reverse')}
      style={{ top: `${c.y}%`, ...span }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: reduce ? DUR.reduced : 0.24, delay, ease: EASE_OUT }}
    >
      <span className={cn('tabular z-10 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-surface-base bg-ink text-[10px] font-semibold leading-none text-surface-base shadow-sm', right ? '-ml-[9px]' : '-mr-[9px]')}>
        {n}
      </span>
      {/* Leader line and label at lg and up; below that the notes are listed under the frame. */}
      <motion.span
        className="hidden h-px flex-1 bg-ink/35 lg:block"
        style={{ transformOrigin: right ? 'left' : 'right' }}
        initial={{ scaleX: reduce ? 1 : 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reduce ? 0 : 0.32, delay, ease: EASE_OUT }}
      />
      <span className="label-mono hidden rounded-md border border-line bg-surface-base px-2 py-1 text-ink shadow-sm lg:block" style={{ maxWidth: '9rem' }}>{c.label}</span>
    </motion.div>
  )
}
