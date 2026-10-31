'use client'

import { useEffect, useRef, useState } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { BrowserFrame } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'
import { EASE_OUT } from '@/src/components/prism/motion/tokens'

export interface SectionScreen {
  key: string
  title: string
  meta: string
  body: string
  screenshot: { src: string; alt: string }
}

interface SectionScreensProps {
  items: readonly SectionScreen[]
  width: number
  height: number
}

/**
 * "What the assessment checks": the six sections on the right, a sticky browser frame on the
 * left whose screenshot follows the section in focus. A thin band across the middle of the
 * viewport decides focus, so the panel and the highlighted item always agree with what the
 * reader is looking at.
 *
 * Every screenshot stays mounted in the frame, stacked, so all six are fetched and decoded with
 * the first and a swap never shows a blank frame. The transition is direction-aware: scrolling
 * down, the next screen rises in from below while the last one lifts away; scrolling back up
 * reverses it. Opacity, transform and a light blur only, and interruptible, since framer
 * retargets mid-flight. Reduced motion: an instant swap, and the active rail jumps.
 *
 * Below `lg` there is no panel: each section carries its own screenshot inline.
 */
export function SectionScreens({ items, width, height }: SectionScreensProps) {
  const [active, setActive] = useState(0)
  const reduce = useReducedMotion()
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const nodes = itemRefs.current.filter((n): n is HTMLLIElement => n !== null)
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number((e.target as HTMLElement).dataset.index)
          if (!Number.isNaN(i)) setActive(i)
        }
      },
      // A 2% band just above the middle of the viewport, level with the panel's center.
      { rootMargin: '-48% 0px -50% 0px', threshold: 0 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [items.length])

  const swap = reduce ? { duration: 0 } : { duration: 0.65, ease: EASE_OUT }

  // Once a swap settles, clear the filter on every layer so idle layers hold no blur surface.
  // Framer keeps its own filter value, so the next swap still animates from it. (transitionEnd
  // would cancel the blur animation itself, and framer re-applies the target on each render,
  // so every layer is cleared, not just the two that moved.) A new swap resets the timer.
  useEffect(() => {
    const t = window.setTimeout(() => {
      for (const el of layerRefs.current) if (el) el.style.filter = 'none'
    }, (swap.duration + 0.05) * 1000)
    return () => window.clearTimeout(t)
  }, [active, swap.duration])

  return (
    <MotionConfig reducedMotion="user">
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        {/* Sticky panel, wide screens only */}
        <div className="hidden lg:block">
          <div className="sticky" style={{ top: 'max(7rem, calc(50vh - 14rem))' }}>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10"
                style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgba(0,51,153,0.10), transparent 72%)', filter: 'blur(8px)' }}
              />
              <figure className="overflow-hidden rounded-xl border border-line-subtle bg-surface-raised shadow-lg ring-1 ring-black/5">
                <div className="flex items-center gap-1.5 border-b border-line-subtle bg-surface-frost px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-[#febc2e]" aria-hidden />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" aria-hidden />
                  {/* which of the six screens is showing */}
                  <span aria-hidden className="ml-auto flex items-center gap-1">
                    {items.map((item, i) => (
                      <span
                        key={item.key}
                        className={cn(
                          'h-1 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                          i === active ? 'w-5 bg-eu-ink' : 'w-1.5 bg-ink/15',
                        )}
                      />
                    ))}
                  </span>
                </div>
                <div className="relative w-full overflow-hidden bg-surface-raised" style={{ aspectRatio: `${width} / ${height}` }}>
                  {items.map((item, i) => {
                    const offset = i === active ? 0 : i < active ? -1 : 1
                    return (
                      <motion.div
                        key={item.key}
                        aria-hidden={i !== active}
                        className="absolute inset-0"
                        initial={false}
                        animate={{
                          opacity: offset === 0 ? 1 : 0,
                          transform: offset === 0 ? 'translateY(0%) scale(1)' : `translateY(${offset * 6}%) scale(0.985)`,
                          filter: offset === 0 ? 'blur(0px)' : 'blur(4px)',
                        }}
                        transition={swap}
                        ref={(el: HTMLDivElement | null) => {
                          layerRefs.current[i] = el
                        }}
                        style={{ zIndex: offset === 0 ? 2 : 1 }}
                      >
                        <Image
                          src={item.screenshot.src}
                          alt={item.screenshot.alt}
                          fill
                          sizes="(max-width: 1024px) 92vw, 55vw"
                          className="object-cover object-top"
                          // decode off-screen layers as soon as they arrive, so the first swap to each is instant
                          onLoad={(e) => void e.currentTarget.decode?.().catch(() => {})}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </figure>
            </div>
          </div>
        </div>

        {/* The six sections. Wide screens: tall stops that drive the panel. Small: text, then its screen. */}
        <LayoutGroup>
          <ol className="relative grid gap-y-12 lg:gap-y-0 lg:border-l lg:border-line-subtle lg:py-[12vh]">
            {items.map((item, i) => {
              const isActive = i === active
              return (
                <li
                  key={item.key}
                  ref={(el) => {
                    itemRefs.current[i] = el
                  }}
                  data-index={i}
                  aria-current={isActive ? 'step' : undefined}
                  className="relative lg:flex lg:min-h-[34vh] lg:flex-col lg:justify-center lg:pl-8"
                >
                  {isActive && (
                    <motion.span
                      layoutId="eu-method-rail"
                      aria-hidden
                      className="absolute -left-px top-[22%] bottom-[22%] hidden w-0.5 rounded-full bg-eu-ink lg:block"
                      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
                    />
                  )}
                  <div className="border-t border-line-subtle pt-4 lg:border-t-0 lg:pt-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3
                        className={cn(
                          'font-display text-lg font-semibold transition-colors duration-300 ease-out motion-reduce:transition-none lg:text-xl',
                          isActive ? 'text-ink' : 'text-ink lg:text-ink-secondary',
                        )}
                      >
                        {item.title}
                      </h3>
                      <span className="whitespace-nowrap text-xs tabular-nums text-ink-tertiary">{item.meta}</span>
                    </div>
                    <div className="mt-2 max-w-md text-sm leading-6 text-ink-secondary">{item.body}</div>
                  </div>
                  <BrowserFrame
                    src={item.screenshot.src}
                    alt={item.screenshot.alt}
                    width={width}
                    height={height}
                    aspect={`${width} / ${height}`}
                    sizes="92vw"
                    className="mt-5 lg:hidden"
                  />
                </li>
              )
            })}
          </ol>
        </LayoutGroup>
      </div>
    </MotionConfig>
  )
}
