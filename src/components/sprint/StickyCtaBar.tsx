'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/src/components/prism/utils/cn'
import { SPRINT_STICKY } from '@/src/ai-build-sprint-content'
import { SprintCta } from './SprintCta'

/**
 * StickyCtaBar — mobile only. Appears once the hero has scrolled out of view and
 * steps aside while the fit-call form itself is on screen.
 */
export function StickyCtaBar({ heroId, formId }: { heroId: string; formId: string }) {
  const [heroVisible, setHeroVisible] = useState(true)
  const [formVisible, setFormVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById(heroId)
    const form = document.getElementById(formId)
    const observers: IntersectionObserver[] = []
    if (hero) {
      const o = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0 })
      o.observe(hero)
      observers.push(o)
    }
    if (form) {
      const o = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting), { threshold: 0.15 })
      o.observe(form)
      observers.push(o)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [heroId, formId])

  const show = !heroVisible && !formVisible

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-(--surface-nav) px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden',
        show ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="type-sm font-medium text-ink">{SPRINT_STICKY.label}</p>
        <SprintCta location="sticky-bar" className="px-5! py-2.5!" />
      </div>
    </div>
  )
}
