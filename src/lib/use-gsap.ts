'use client'

import { useLayoutEffect, useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/src/lib/gsap'

export function useGSAP(
  callback: (context: gsap.Context) => void,
  deps: React.DependencyList = []
) {
  const scopeRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context((context) => {
      callback(context)
    }, scopeRef.current || undefined)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scopeRef
}

export function useScrollReveal(delay: number = 0) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay, ease: 'power2.out' }
    )
  }, [delay])

  return ref
}

export function useScrollTrigger(
  callback: (scrollTrigger: typeof ScrollTrigger) => Record<string, any>,
  deps: React.DependencyList = []
) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      ...callback(ScrollTrigger),
    })

    return () => trigger.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
