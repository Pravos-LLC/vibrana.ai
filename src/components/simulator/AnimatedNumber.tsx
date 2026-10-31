'use client'

import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * A number that tweens to its new value whenever the inputs change, so the
 * dashboard visibly responds to every edit. The server renders the final text;
 * reduced motion jumps straight to it. Text is written through a ref, so the
 * tween never re-renders React.
 */
export function AnimatedNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(value)
  const reduce = useReducedMotion()
  const fmt = useRef(format)
  fmt.current = format

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce || from.current === value) {
      el.textContent = fmt.current(value)
      from.current = value
      return
    }
    const controls = animate(from.current, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = fmt.current(v)
      },
    })
    from.current = value
    return () => controls.stop()
  }, [value, reduce])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}
