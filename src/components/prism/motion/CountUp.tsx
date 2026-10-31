'use client'

import React, { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
import { formatMetricValue, parseMetric } from '@/src/lib/parse-metric'
import { EASE_OUT } from './tokens'

/**
 * CountUp — renders a metric string ("20 yrs", "528 hrs") and counts its
 * number up from zero the first time it scrolls into view.
 *
 * The server renders the final value, so search engines, no-JS and reduced
 * motion all see the real number. An invisible copy of the final value holds
 * the width, so the count never shifts layout. Values that are not a single
 * number (ranges like "$120-250k") render as-is.
 */
export interface CountUpProps {
  value: string
  duration?: number
  className?: string
  /** Classes for the visible number itself (e.g. a gradient-text class). */
  textClassName?: string
  /** Classes for a word prefix such as "Up to " (e.g. a smaller size). */
  prefixClassName?: string
}

export function CountUp({ value, duration = 1.6, className, textClassName, prefixClassName }: CountUpProps) {
  const parsed = parseMetric(value)
  const ref = useRef<HTMLSpanElement>(null)
  const numRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const started = useRef(false)

  // Before it is seen, park the visible number at zero (client only).
  useEffect(() => {
    if (!parsed || reduce || started.current || !numRef.current) return
    const rect = ref.current?.getBoundingClientRect()
    const alreadyVisible = rect && rect.top < window.innerHeight && rect.bottom > 0
    if (!alreadyVisible) numRef.current.textContent = formatMetricValue(0, parsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!parsed || reduce || !inView || started.current || !numRef.current) return
    started.current = true
    const el = numRef.current
    const controls = animate(0, parsed.value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = formatMetricValue(v, parsed)
      },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce])

  if (!parsed) return <span className={[className, textClassName].filter(Boolean).join(' ')}>{value}</span>

  const final = formatMetricValue(parsed.value, parsed)
  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="inline-grid">
        <span className="invisible col-start-1 row-start-1">
          <span className={prefixClassName}>{parsed.prefix}</span>
          {final}
          {parsed.suffix}
        </span>
        <span className={['col-start-1 row-start-1', textClassName].filter(Boolean).join(' ')}>
          <span className={prefixClassName}>{parsed.prefix}</span>
          <span ref={numRef}>{final}</span>
          {parsed.suffix}
        </span>
      </span>
    </span>
  )
}
