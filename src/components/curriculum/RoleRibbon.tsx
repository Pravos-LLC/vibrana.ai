'use client'

import React from 'react'
import { RoleImage, cn } from '@/src/components/prism'
import { ROLE_CATEGORIES, roleImageSrc } from '@/src/role-visuals'
import Link from 'next/link'
import { learnRoleHref } from '@/src/learn-role-content'
import { JOB_FUNCTIONS_DETAILED } from '@/src/enterprise-content'

/**
 * RoleRibbon — a continuous, gently auto-drifting horizontal stream of every
 * role family we cover, so the breadth is visible at a glance rather than
 * buried behind category filters.
 *
 *  - one endless track (the list is duplicated and the scroll position wraps at
 *    the halfway point, so the loop is seamless)
 *  - drifts left ~55px/s; pauses on hover / focus / pointer / wheel, and stays
 *    still entirely under `prefers-reduced-motion`
 *  - soft fade masks on BOTH edges so cards emerge and dissolve, not clip
 *  - family "jump chips" smooth-scroll to the first card of a family
 */

const CARD = 'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'
const EDGE_FADE =
  'linear-gradient(to right, transparent 0, #000 7%, #000 93%, transparent 100%)'
const DRIFT_PX_PER_SEC = 55

const ROLE_BY_NAME = new Map(JOB_FUNCTIONS_DETAILED.map((f) => [f.name, f]))

interface RibbonItem {
  roleName: string
  family: { name: string; description: string }
  accents: [string, string]
  dot: string
  catLabel: string
  catId: string
  seed: number
}

const ITEMS: RibbonItem[] = ROLE_CATEGORIES.flatMap((cat, ci) =>
  cat.roles.flatMap((roleName, ri) => {
    const family = ROLE_BY_NAME.get(roleName)
    return family
      ? [
          {
            roleName,
            family,
            accents: cat.accents,
            dot: cat.dot,
            catLabel: cat.label,
            catId: cat.id,
            seed: ci * 10 + ri + 1,
          },
        ]
      : []
  }),
)

// index of the first card of each family (for the jump chips)
const FIRST_INDEX = new Map<string, number>()
ITEMS.forEach((it, idx) => {
  if (!FIRST_INDEX.has(it.catId)) FIRST_INDEX.set(it.catId, idx)
})

function RibbonCard({ item, hidden }: { item: RibbonItem; hidden?: boolean }) {
  return (
    <div
      className={cn('relative w-[264px] shrink-0 overflow-hidden sm:w-[300px]', CARD)}
      aria-hidden={hidden || undefined}
    >
      <RoleImage
        src={roleImageSrc(item.roleName)}
        alt={`${item.roleName} — abstract illustration`}
        accents={item.accents}
        seed={item.seed}
      />
      <div className="p-6">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: `rgb(${item.dot})` }}
            aria-hidden
          />
          <span className="type-xs uppercase tracking-[0.12em] text-ink-tertiary">
            {item.catLabel}
          </span>
        </div>
        <h3 className="mt-2 heading-card text-ink">
          <Link
            href={learnRoleHref(item.family.name)}
            tabIndex={hidden ? -1 : undefined}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline"
          >
            {item.family.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-secondary">
          {item.family.description}
        </p>
      </div>
    </div>
  )
}

export function RoleRibbon() {
  const scroller = React.useRef<HTMLDivElement>(null)
  const paused = React.useRef(false)
  const resumeTimer = React.useRef<number | undefined>(undefined)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  React.useEffect(() => {
    const el = scroller.current
    if (!el) return
    let raf = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05) // clamp tab-restore jumps
      last = now
      const half = el.scrollWidth / 2
      if (!paused.current && !reduced && half > 0) {
        el.scrollLeft += DRIFT_PX_PER_SEC * dt
      }
      if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const nudgePause = () => {
    paused.current = true
    window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false
    }, 2500)
  }

  const jumpTo = (catId: string) => {
    const el = scroller.current
    if (!el) return
    const target = el.querySelector<HTMLElement>(`[data-cat="${catId}"]`)
    if (target) {
      el.scrollTo({ left: Math.max(0, target.offsetLeft - 24), behavior: 'smooth' })
      nudgePause()
    }
  }

  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div>
      {/* family jump chips */}
      <div className="mx-auto mt-8 flex max-w-6xl flex-wrap gap-2 px-6">
        {ROLE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => jumpTo(cat.id)}
            className="inline-flex items-center gap-2 rounded-full border border-line-subtle px-3 py-1.5 type-xs uppercase tracking-[0.12em] text-ink-secondary transition-colors hover:bg-surface-card hover:text-ink"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: `rgb(${cat.dot})` }}
              aria-hidden
            />
            {cat.label}
          </button>
        ))}
      </div>

      {/* the ribbon */}
      <div
        ref={scroller}
        role="region"
        aria-label="Role families we support — scroll to explore"
        tabIndex={0}
        onMouseEnter={() => {
          paused.current = true
        }}
        onMouseLeave={() => {
          paused.current = false
        }}
        onFocus={() => {
          paused.current = true
        }}
        onBlur={() => {
          paused.current = false
        }}
        onPointerDown={nudgePause}
        onWheel={nudgePause}
        className="mt-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
        style={{
          scrollbarWidth: 'none',
          WebkitMaskImage: EDGE_FADE,
          maskImage: EDGE_FADE,
        }}
      >
        <div className="flex w-max gap-4 px-6">
          {doubled.map((item, i) => {
            const firstCopy = i < ITEMS.length
            const isFamilyAnchor = firstCopy && FIRST_INDEX.get(item.catId) === i
            return (
              <div key={i} data-cat={isFamilyAnchor ? item.catId : undefined}>
                <RibbonCard item={item} hidden={!firstCopy} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
