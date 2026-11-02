'use client'

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { DUR, EASE_OUT } from './tokens'

export interface PreviewCallout {
  /** Short note in the mono label voice: `Scored across 6 dimensions`. */
  label: string
  /**
   * `data-callout` value of an element inside this beat's content. The dot tracks that element,
   * so it lands on the thing it names at every size. Without a target, x/y are frame percentages.
   */
  target?: string
  /** Percent across the target (or the frame). Defaults to the target's edge on the label side. */
  x?: number
  /** Percent down the target (or the frame). Default 50. */
  y?: number
  /** Which side of the frame the label sits on (xl and up). Default `right`. */
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
  /** Frame height over width. Defaults: paper 1.414 (A4), app 0.6. Size it to the content. */
  aspect?: number
  /** Auto-advance through the beats while in view. Off under reduced motion. Default true. */
  autoplay?: boolean
  /** Accessible name for the preview. */
  label: string
  className?: string
}

/** Below this component width the preview stacks its beats at reading size instead of scaling. */
const STACK_BELOW = 560
/** Room reserved on each side at xl and up for callout labels. Inside the component's own box. */
const GUTTER = 168

type Pos = { x: number; y: number } | null

/**
 * DeliverablePreview: shows the thing the buyer gets, using the real components.
 *
 * Wide (560px and up): children render at `designWidth` and scale into a paper sheet or app
 * window. The beats script steps through them (cover, score, findings); each beat remounts its
 * child, so a gauge or a Gantt replays its entrance. Callout dots track `data-callout` elements in
 * the content; at xl (1280px) and up, leader lines run to mono labels in a gutter the component reserves
 * inside its own box, so nothing overflows the page. Auto-advance runs only in view and pauses on
 * hover, focus and the pause button.
 *
 * Narrow (under 560px): the beats stack as separate sheets at reading size (no scaling), each with
 * its label and its notes listed under it. Real components reflow to their own mobile layouts.
 *
 * Reduced motion: no auto-advance, no tilt, beats switch with a short fade.
 */
export function DeliverablePreview({
  children,
  beats,
  variant = 'paper',
  title,
  designWidth,
  aspect,
  autoplay = true,
  label,
  className,
}: DeliverablePreviewProps) {
  const pages = React.Children.toArray(children)
  const paper = variant === 'paper'
  const width = designWidth ?? (paper ? 720 : 1040)
  const ratio = aspect ?? (paper ? 1.414 : 0.6)
  const frameMax = paper ? 520 : 760
  const hasCallouts = beats.some((b) => b.callouts?.length)
  const uid = useId()

  const [beat, setBeat] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [stacked, setStacked] = useState(false)
  const [scale, setScale] = useState(frameMax / width)
  const [positions, setPositions] = useState<Pos[]>([])
  const reduce = useHydratedReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.4 })
  const arrived = useInView(rootRef, { amount: 0.4, once: true })
  const index = Math.min(beat, beats.length - 1, pages.length - 1)
  const current = beats[index]
  const running = autoplay && !stacked && !reduce && !paused && !hovered && inView && beats.length > 1

  // Mode and scale follow the component's own width.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setStacked(root.clientWidth < STACK_BELOW)
      const vp = viewportRef.current
      if (vp) setScale(vp.clientWidth / width)
    })
    ro.observe(root)
    if (viewportRef.current) ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [width, stacked])

  // Place each callout dot on its target, measured in frame coordinates.
  const measure = useCallback(() => {
    const frame = frameRef.current
    const vp = viewportRef.current
    if (!frame || !vp || !current) return
    const fr = frame.getBoundingClientRect()
    setPositions(
      (current.callouts ?? []).map((c) => {
        const right = (c.side ?? 'right') === 'right'
        const el = c.target ? vp.querySelector<HTMLElement>(`[data-callout="${c.target}"]`) : null
        const box = el ? el.getBoundingClientRect() : vp.getBoundingClientRect()
        if (c.target && !el) return null
        const px = c.x ?? (el ? (right ? 100 : 0) : 50)
        const py = c.y ?? 50
        const x = box.left - fr.left + (box.width * px) / 100
        const y = box.top - fr.top + (box.height * py) / 100
        // Keep the dot inside the frame.
        return { x: Math.min(Math.max(x, 10), fr.width - 10), y: Math.min(Math.max(y, 10), fr.height - 10) }
      }),
    )
  }, [current])

  useLayoutEffect(() => {
    if (stacked) return
    setPositions([])
    // After the beat's entrance (320 ms) and the paper straightening (600 ms).
    const t1 = window.setTimeout(measure, 360)
    const t2 = window.setTimeout(measure, 680)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [index, scale, stacked, measure, arrived])

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => setBeat((b) => (b + 1) % beats.length), current?.hold ?? 4200)
    return () => window.clearTimeout(id)
  }, [running, index, beats.length, current?.hold])

  const sheet = cn(
    'relative overflow-hidden border border-line bg-surface-base',
    paper
      ? 'rounded-[6px] shadow-[0_1px_0_var(--border-subtle),0_30px_60px_-30px_rgba(24,18,60,0.35),0_12px_24px_-16px_rgba(24,18,60,0.18)]'
      : 'rounded-xl shadow-[0_30px_70px_-34px_rgba(24,18,60,0.45)]',
  )

  const head = (n: number, beatLabel?: string) =>
    paper ? (
      <div className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-2.5">
        <span className="label-mono truncate text-ink-tertiary">{beatLabel ?? title}</span>
        <span className="label-mono tabular shrink-0 text-ink-tertiary">
          p. {String(n + 1).padStart(2, '0')} / {String(beats.length).padStart(2, '0')}
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-3 border-b border-line-subtle bg-surface-raised px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="label-mono flex-1 truncate text-center text-ink-tertiary">{beatLabel ?? title}</span>
        <span className="w-[42px]" aria-hidden />
      </div>
    )

  return (
    <figure
      ref={rootRef}
      aria-label={label}
      data-dp-mode={stacked ? 'stacked' : 'scaled'}
      className={cn('m-0 min-w-0 [overflow-x:clip]', className)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      {stacked ? (
        <ol className="flex flex-col gap-8">
          {beats.slice(0, pages.length).map((b, i) => (
            <li key={b.id}>
              <div className={sheet}>
                {head(i, `${String(i + 1).padStart(2, '0')} ${b.label}`)}
                <div className={paper ? 'p-5' : 'p-4'}>{pages[i]}</div>
              </div>
              {b.callouts?.length ? (
                <ul className="mt-3 space-y-1">
                  {b.callouts.map((c, j) => (
                    <li key={j} className="label-mono text-ink-secondary">
                      {c.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <>
          <div
            className={cn('relative mx-auto', hasCallouts && 'xl:px-[var(--dp-gutter)]')}
            style={{ maxWidth: hasCallouts ? `calc(${frameMax}px + 2 * var(--dp-gutter, 0px))` : frameMax, ['--dp-gutter' as string]: `${GUTTER}px` }}
          >
            <div ref={frameRef} className="relative mx-auto" style={{ maxWidth: frameMax }}>
              <motion.div
                initial={false}
                animate={reduce || !paper || arrived ? { rotate: 0, y: 0 } : { rotate: -2, y: 12 }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className={sheet}
              >
                {head(index)}
                <div ref={viewportRef} className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${ratio}` }}>
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
                        <div className={paper ? 'p-12' : 'p-8'}>{pages[index]}</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Callouts sit outside the scaled layer, so labels stay at reading size. */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <AnimatePresence initial={false}>
                  {(current.callouts ?? []).map((c, i) => {
                    const p = positions[i]
                    if (!p) return null
                    return <Callout key={`${current.id}-${i}`} c={c} n={i + 1} p={p} delay={reduce ? 0 : i * 0.08} reduce={reduce} />
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {current.callouts?.length ? (
            <ol className="mx-auto mt-4 space-y-1 xl:hidden" style={{ maxWidth: frameMax }} aria-label="Notes">
              {current.callouts.map((c, i) => (
                <li key={i} className="label-mono flex gap-2 text-ink-secondary">
                  <span className="tabular text-ink-tertiary">{i + 1}</span>
                  {c.label}
                </li>
              ))}
            </ol>
          ) : null}

          {/* Pager: the beats as labeled steps, with play and pause. */}
          <figcaption className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-1" style={{ maxWidth: frameMax }}>
            {beats.length > 1 && autoplay && !reduce ? (
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-label={paused ? 'Play the preview' : 'Pause the preview'}
                className="mr-1 grid h-8 w-8 place-items-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-surface-overlay hover:text-ink active:scale-[0.94]"
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            ) : null}
            {beats.slice(0, pages.length).map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setBeat(i)}
                className={cn(
                  'label-mono relative rounded-full px-3 py-1.5 transition-colors duration-150 active:scale-[0.97]',
                  i === index ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary',
                )}
              >
                {i === index ? (
                  <motion.span layoutId={`${uid}-pill`} className="absolute inset-0 -z-10 rounded-full bg-surface-overlay" transition={{ duration: 0.24, ease: EASE_OUT }} />
                ) : null}
                <span className="tabular mr-1.5 text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
                {b.label}
              </button>
            ))}
          </figcaption>
        </>
      )}
    </figure>
  )
}

function Callout({ c, n, p, delay, reduce }: { c: PreviewCallout; n: number; p: { x: number; y: number }; delay: number; reduce: boolean }) {
  const right = (c.side ?? 'right') === 'right'
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: reduce ? DUR.reduced : 0.24, delay, ease: EASE_OUT }}
    >
      {/* Leader line from the dot to just past the frame edge, xl and up. */}
      <motion.span
        className="absolute hidden h-px bg-ink/35 xl:block"
        style={
          right
            ? { left: p.x, right: -12, top: p.y, transformOrigin: 'left' }
            : { left: -12, width: p.x + 12, top: p.y, transformOrigin: 'right' }
        }
        initial={{ scaleX: reduce ? 1 : 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reduce ? 0 : 0.32, delay, ease: EASE_OUT }}
      />
      <span
        className="tabular absolute z-10 grid h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-surface-base bg-ink text-[10px] font-semibold leading-none text-surface-base shadow-sm"
        style={{ left: p.x, top: p.y }}
      >
        {n}
      </span>
      <span
        className="label-mono absolute hidden -translate-y-1/2 rounded-md border border-line bg-surface-base px-2 py-1 text-ink shadow-sm xl:block"
        style={{ top: p.y, width: 'max-content', maxWidth: GUTTER - 24, ...(right ? { left: 'calc(100% + 12px)' } : { right: 'calc(100% + 12px)' }) }}
      >
        {c.label}
      </span>
    </motion.div>
  )
}
