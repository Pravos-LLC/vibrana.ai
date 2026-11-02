'use client'

import React, { useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/src/components/prism/utils/cn'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { ACCENTS, type Accent, DUR, EASE_OUT } from './tokens'

export type FrameChrome = 'browser' | 'app' | 'phone' | 'terminal'

export interface DistinctProductFrameProps {
  /** The silhouette. Two case studies on one page never share one. */
  chrome: FrameChrome
  /** Which end of the gradient this product owns: outlines, selection, labels. */
  accent?: Accent
  /** `comfortable` for a consumer surface, `compact` for an operator tool. Sets padding and base size. */
  density?: 'comfortable' | 'compact'
  /** URL (browser), app name (app), carrier time (phone) or shell title (terminal). */
  title?: string
  children: React.ReactNode
  /** Caption under the frame, in the mono label voice. */
  caption?: React.ReactNode
  /** No inner padding: for a full app screen that brings its own layout. */
  bleed?: boolean
  /**
   * The product's own theme, pinned whatever the page theme: products are designed in one theme
   * and are not token-aware throughout. Default `light`. `inherit` follows the page. The
   * terminal chrome is always dark.
   */
  theme?: 'light' | 'dark' | 'inherit'
  /**
   * Render the children on a fixed canvas (e.g. the 960x600 product mocks) and scale it to the
   * frame's width, so a screen built for a scaled render is never squeezed or cropped. Implies bleed.
   */
  fit?: { width: number; height: number }
  className?: string
}

const PAD = { comfortable: 'p-6 sm:p-8 text-[15px]', compact: 'p-4 sm:p-5 text-[13px]' } as const

/**
 * DistinctProductFrame: one product, one frame language. Silhouette (chrome), accent and density
 * are separate props so two prototypes read as different products before any detail is seen:
 * a desktop app on the violet end next to a phone on the teal end, say.
 *
 * Children are the real product components (or a captured screen); the frame only adds chrome.
 * `terminal` is always dark, in either theme: it is the page's one inverted panel.
 */
export function DistinctProductFrame({ chrome, accent = 'violet', density = 'comfortable', title, children: content, caption, bleed = false, theme = 'light', fit, className }: DistinctProductFrameProps) {
  const a = ACCENTS[accent]
  const pad = bleed || fit ? (density === 'compact' ? 'text-[13px]' : 'text-[15px]') : PAD[density]
  const children = fit ? <FitCanvas width={fit.width} height={fit.height}>{content}</FitCanvas> : content
  // A fitted canvas scales down instead; only an unfitted desktop silhouette keeps 560px on a phone.
  const holdWidth = !fit && (chrome === 'app' || chrome === 'browser')
  const pinned = chrome === 'terminal' ? 'dark' : theme === 'inherit' ? undefined : theme
  const vars = { '--pf-accent': a.solid, '--pf-accent-text': a.text, '--pf-tint': a.tint, '--pf-ring': a.ring } as React.CSSProperties
  return (
    <figure className={cn('m-0', holdWidth && 'max-sm:overflow-x-auto max-sm:pb-2', className)} style={vars} data-chrome={chrome} data-accent={accent}>
      {/* The theme pins on the frame, not the figure, so the caption follows the page. */}
      <div className={holdWidth ? 'max-sm:min-w-[560px]' : undefined} data-theme={pinned}>
      {chrome === 'browser' && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface-base shadow-[0_0_0_4px_var(--pf-tint),0_28px_60px_-32px_rgba(24,18,60,0.4)]">
          <div className="flex items-center gap-3 border-b border-line-subtle bg-surface-raised px-3 py-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="label-mono mx-auto flex min-w-0 max-w-[60%] items-center gap-1.5 truncate rounded-md border border-line-subtle bg-surface-base px-3 py-1 text-ink-secondary">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--pf-accent)' }} />
              {title}
            </span>
            <span className="w-[46px]" aria-hidden />
          </div>
          <div className={pad}>{children}</div>
        </div>
      )}

      {chrome === 'app' && (
        <div className="overflow-hidden rounded-[14px] border border-line-strong bg-surface-raised shadow-[0_28px_70px_-30px_rgba(24,18,60,0.45)]">
          <div className="flex h-10 items-center border-b border-line px-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full border border-line-strong" />
              <span className="h-3 w-3 rounded-full border border-line-strong" />
              <span className="h-3 w-3 rounded-full border border-line-strong" />
            </span>
            <span className="flex-1 text-center text-[13px] font-semibold text-ink">{title}</span>
            <span className="w-[52px]" aria-hidden />
          </div>
          <div className="h-[2px]" style={{ background: 'var(--pf-accent)' }} aria-hidden />
          <div className={cn('bg-surface-base', pad)}>{children}</div>
        </div>
      )}

      {chrome === 'phone' && (
        <div className="mx-auto w-full max-w-[300px] rounded-[44px] border border-line-strong bg-surface-overlay p-[9px] shadow-[0_0_0_5px_var(--pf-tint),0_30px_60px_-28px_rgba(24,18,60,0.45)]">
          <div className="overflow-hidden rounded-[36px] border border-line-subtle bg-surface-base" style={{ aspectRatio: '9 / 19.5' }}>
            <div className="flex items-center justify-between px-6 pb-1 pt-3">
              <span className="label-mono tabular text-ink">{title ?? '9:41'}</span>
              <span aria-hidden className="h-[22px] w-[76px] rounded-full bg-ink" />
              <span aria-hidden className="h-2.5 w-5 rounded-[3px] border border-ink/60" />
            </div>
            <div className={cn(bleed ? '' : density === 'compact' ? 'p-3' : 'p-4', density === 'compact' ? 'text-[12px]' : 'text-[13px]')}>{children}</div>
          </div>
        </div>
      )}

      {chrome === 'terminal' && (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d12] text-white/85 shadow-[0_0_0_1px_var(--pf-ring),0_28px_60px_-28px_rgba(10,8,30,0.7)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pf-accent)' }} />
            <span className="label-mono text-white/60">{title}</span>
          </div>
          <div className={cn('font-label', pad)}>{children}</div>
        </div>
      )}

      </div>
      {caption ? <figcaption className="label-mono mt-3 text-ink-tertiary">{caption}</figcaption> : null}
    </figure>
  )
}

/**
 * Lays children out on a fixed canvas and scales it to the available width; height follows. On a
 * narrow screen the scale stops at `MIN_FIT_SCALE` so the product stays legible, and the canvas
 * scrolls sideways inside the frame instead of shrinking to a thumbnail.
 */
const MIN_FIT_SCALE = 0.6

function FitCanvas({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setScale(Math.max(el.clientWidth / width, MIN_FIT_SCALE)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])
  return (
    // `lk-native` exempts the canvas from Prism's element type sizes, so the mock's own sizes apply.
    <div
      ref={ref}
      className="lk-native relative w-full overflow-x-auto overflow-y-hidden"
      style={scale ? { height: height * scale } : { aspectRatio: `${width} / ${height}` }}
    >
      <div className="relative" style={{ width: scale ? width * scale : '100%', height: '100%' }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})`, opacity: scale ? 1 : 0 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export interface ProductToggleItem {
  id: string
  /** Toggle label: the product, in two or three words. */
  label: string
  /** Who it is for, shown in the shared caption slot. */
  audience: React.ReactNode
  /** Usually a DistinctProductFrame. */
  content: React.ReactNode
}

export interface ProductToggleProps {
  items: readonly ProductToggleItem[]
  /** Accessible name for the toggle. */
  label: string
  defaultId?: string
  className?: string
}

/**
 * ProductToggle: two (or three) prototypes, one at a time, at full size. A labeled segmented
 * control (tabs), not a carousel: no arrows, no auto-advance. The panel never renders narrower
 * than 560px when the viewport allows it; on a phone it takes the full column. Arrow keys, Home and
 * End move between tabs (roving tabindex). The switch is a 240 ms crossfade with a 2px blur.
 */
export function ProductToggle({ items, label, defaultId, className }: ProductToggleProps) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id)
  const reduce = useHydratedReducedMotion()
  const uid = useId()
  const current = items.find((i) => i.id === active) ?? items[0]

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = items.length
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (to < 0) return
    e.preventDefault()
    const next = items[to]
    setActive(next.id)
    document.getElementById(`${uid}-tab-${next.id}`)?.focus()
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div role="tablist" aria-label={label} className="relative inline-flex rounded-full border border-line bg-surface-raised p-1">
        {items.map((item, i) => {
          const on = item.id === current.id
          return (
            <button
              key={item.id}
              id={`${uid}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${uid}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn('relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 active:scale-[0.97] sm:px-5', on ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary')}
            >
              {on ? (
                <motion.span
                  layoutId={`${uid}-pill`}
                  className="absolute inset-0 rounded-full border border-line bg-surface-base shadow-sm"
                  transition={reduce ? { duration: 0 } : { duration: DUR.swap, ease: EASE_OUT }}
                />
              ) : null}
              <span className="relative">{item.label}</span>
            </button>
          )
        })}
      </div>

      <p className="label-mono mt-3 min-h-[1.25em] text-center text-ink-tertiary" aria-live="polite">
        {current.audience}
      </p>

      <div
        id={`${uid}-panel`}
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`${uid}-tab-${current.id}`}
        className="mt-6 w-full"
        style={{ minWidth: 'min(560px, 100%)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)', y: 6 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)', y: -6 }}
            transition={{ duration: reduce ? DUR.reduced : DUR.swap / 1.6, ease: EASE_OUT }}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
