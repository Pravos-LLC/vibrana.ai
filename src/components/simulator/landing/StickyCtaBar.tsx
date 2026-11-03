'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/src/components/prism/Button'
import { FINAL_CTA_ID, SIM_URL_FIELD_ID, STICKY_CTA_CONTENT as C } from '@/src/simulator-landing-cta-content'
import { focusSimulatorUrl } from './FinalCta'

const EASE = [0.22, 1, 0.36, 1] as const

const findForm = () =>
  document.getElementById(SIM_URL_FIELD_ID) ?? document.querySelector<HTMLElement>('input[inputmode="url"]')

/**
 * A bar fixed to the bottom that slides in once the form has scrolled out of view above,
 * and steps aside while the form or the closing CTA is on screen.
 */
export function StickyCtaBar() {
  const reduce = useReducedMotion()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Read positions on every scroll (once per frame) rather than from IntersectionObserver
    // callbacks: a jump (Home key, status-bar tap, a reduced-motion scroll to the hero) can cross
    // the form without ever intersecting it, and an observer would then keep a stale state.
    let frame = 0
    const update = () => {
      frame = 0
      const form = findForm()
      const final = document.getElementById(FINAL_CTA_ID)
      const vh = window.innerHeight
      const visible = (r: DOMRect) => r.bottom > 0 && r.top < vh
      const formRect = form?.getBoundingClientRect()
      const formAbove = formRect ? formRect.bottom <= 0 : false
      const finalInView = final ? visible(final.getBoundingClientRect()) : false
      setShow(formAbove && !finalInView)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: '110%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '110%' }}
          transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-surface-base/95 backdrop-blur"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
            <p className="hidden type-sm font-medium text-ink sm:block">{C.text}</p>
            <Button size="sm" onClick={focusSimulatorUrl} showArrow className="w-full sm:w-auto">
              {C.primary}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
