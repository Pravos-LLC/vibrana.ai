'use client'

import { useEffect, useRef, useState } from 'react'
import Image from '@/src/components/PublicDemoImage'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import type { Currency, OfferCard } from '@/src/lib/simulator/types'
import { formatMoney, formatMoneyRange } from '@/src/lib/simulator/format'
import { Button } from '@/src/components/prism'
import { getImagery } from '@/src/imagery-manifest'
import { ABOUT_TEAM } from '@/src/about-content'
import { SIM_DASH, SIM_OFFERS, SIM_TEAM } from '@/src/simulator-content'

const h = SIM_DASH.help
const EASE = [0.22, 1, 0.36, 1] as const

/** Price label for a menu card, in the visitor's currency. `short` fits a chip. */
export function offerPrice(o: OfferCard, currency: Currency): { label: string; short: string } {
  const p = o.price
  switch (p.kind) {
    case 'free':
      return { label: h.free, short: h.free }
    case 'from':
      return { label: h.from(formatMoney(p.low, currency, { compact: true })), short: h.from(formatMoney(p.low, currency, { compact: true })) }
    case 'quote':
      return { label: h.quote, short: h.quote }
    case 'range': {
      const range = formatMoneyRange(p, currency, { compact: true })
      const per = p.per === 'each' ? ` ${h.each}` : p.per === 'month' ? ` ${h.month}` : ''
      return { label: `${range}${per}`, short: `${formatMoney(p.low, currency, { compact: true })}+` }
    }
  }
}

function photoFor(name: string): string | null {
  const m = ABOUT_TEAM.members.find((x) => x.name === name)
  return m?.photo ?? null
}

/** Pixels a second the gallery drifts. Slow enough to read a card as it passes. */
const DRIFT_PX_PER_SECOND = 22

/**
 * The services as a horizontally scrolling gallery: one card per offer with an image, the
 * price for this company, what the model assumes, and the people who lead it. It drifts slowly
 * on its own, stops on hover, focus or touch, and never moves for visitors who prefer reduced
 * motion. Every card has exactly one button: the free assessment takes the assessment, the rest
 * book a call.
 */
export function OfferGallery({ offers, currency, assessmentHref }: { offers: OfferCard[]; currency: Currency; assessmentHref: string }) {
  const track = useRef<HTMLUListElement>(null)
  const reduce = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const holds = useRef({ hover: false, focus: false, touch: false, manual: false, visible: false })
  const hold = useRef<number | null>(null)

  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 680), behavior: reduce ? 'auto' : 'smooth' })
  }
  const set = (key: 'hover' | 'focus' | 'touch', on: boolean) => {
    holds.current[key] = on
  }
  const releaseTouchSoon = () => {
    if (hold.current) window.clearTimeout(hold.current)
    hold.current = window.setTimeout(() => set('touch', false), 3500)
  }

  useEffect(() => {
    const el = track.current
    if (!el || reduce) return
    const io = new IntersectionObserver(([entry]) => {
      holds.current.visible = entry.isIntersecting
    })
    io.observe(el)
    let raf = 0
    let last = 0
    let pos = el.scrollLeft
    let dir = 1
    const tick = (t: number) => {
      const dt = last ? Math.min(64, t - last) : 16
      last = t
      const h = holds.current
      const still = h.hover || h.focus || h.touch || h.manual || !h.visible
      if (still) {
        pos = el.scrollLeft
      } else {
        const max = el.scrollWidth - el.clientWidth
        pos = Math.min(max, Math.max(0, pos + (dir * DRIFT_PX_PER_SECOND * dt) / 1000))
        el.scrollLeft = pos
        if (pos >= max - 0.5) dir = -1
        else if (pos <= 0.5) dir = 1
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      if (hold.current) window.clearTimeout(hold.current)
    }
  }, [reduce])

  useEffect(() => {
    holds.current.manual = paused
  }, [paused])

  return (
    <div
      onMouseEnter={() => set('hover', true)}
      onMouseLeave={() => set('hover', false)}
      onFocusCapture={() => set('focus', true)}
      onBlurCapture={() => set('focus', false)}
      onTouchStart={() => {
        set('touch', true)
        releaseTouchSoon()
      }}
      onTouchEnd={releaseTouchSoon}
    >
      <div className="flex items-center justify-end gap-2">
        {!reduce && (
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-label={paused ? h.play : h.pause}
            aria-pressed={paused}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-[border-color,transform] hover:border-brand-violet active:scale-95"
          >
            {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <button type="button" onClick={() => scroll(-1)} aria-label={h.prev} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-[border-color,transform] hover:border-brand-violet active:scale-95">
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => scroll(1)} aria-label={h.next} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-[border-color,transform] hover:border-brand-violet active:scale-95">
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ul
        ref={track}
        aria-label={h.heading}
        tabIndex={0}
        className="-mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] md:-mx-1 md:px-1"
      >
        {offers.map((o, i) => {
          const copy = SIM_OFFERS[o.id]
          const img = getImagery(copy.image)
          const price = offerPrice(o, currency)
          const isFree = o.id === 'readiness-free'
          return (
            <motion.li
              key={o.id}
              id={`offer-${o.id}`}
              className="w-[78%] flex-none scroll-mt-32 sm:w-[19rem]"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: Math.min(i, 4) * 0.06, ease: EASE }}
            >
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface-base transition-shadow hover:shadow-[0_14px_40px_rgba(76,29,149,0.10)]">
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-overlay">
                  {img && (
                    <Image
                      src={img.file}
                      alt={copy.imageAlt}
                      fill
                      sizes="(max-width: 640px) 78vw, 19rem"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-display type-base font-semibold leading-snug text-ink">{copy.title}</p>
                  <p className="mt-1.5 type-xs leading-relaxed text-ink-secondary">{copy.body}</p>
                  <div className="mt-3">
                    <p className="font-display type-lg font-semibold tabular-nums text-ink">{price.label}</p>
                    {copy.priceNote && <p className="mt-0.5 type-xs text-ink-tertiary">{copy.priceNote}</p>}
                    {o.quantity !== undefined && o.quantity > 0 && <p className="mt-0.5 type-xs text-ink-tertiary">{h.quantity(o.quantity)}</p>}
                    {o.typical && <p className="mt-0.5 type-xs text-ink-tertiary">{h.typical(formatMoney(o.typical.usd, currency, { compact: true }), o.typical.weeks)}</p>}
                  </div>
                  <div className="mt-auto pt-4">
                    <p className="type-xs text-ink-tertiary">{h.ledBy}</p>
                    <ul className="mt-1.5 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, o.leads.length)}, minmax(0, 1fr))` }}>
                      {o.leads.map((id) => {
                        const person = SIM_TEAM[id]
                        const photo = photoFor(person.name)
                        return (
                          <li key={id} className="flex min-w-0 items-center gap-2">
                            {photo ? (
                              <Image src={photo} alt="" width={28} height={28} className="h-7 w-7 flex-none rounded-full object-cover" />
                            ) : (
                              <span aria-hidden className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-surface-overlay type-xs font-semibold text-ink-secondary">
                                {person.first.charAt(0)}
                              </span>
                            )}
                            <span className="min-w-0 leading-tight">
                              <span className="block truncate type-xs font-medium text-ink">{person.first}</span>
                              <span className="block truncate text-[0.6875rem] text-ink-tertiary">{person.word}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="mt-4">
                      {isFree ? (
                        <Button href={assessmentHref} size="sm" showArrow className="w-full justify-center">
                          {SIM_DASH.assessment.primary}
                        </Button>
                      ) : (
                        <Button href={h.bookHref} target="_blank" rel="noopener noreferrer" size="sm" variant="secondary" className="w-full justify-center">
                          {h.book}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
