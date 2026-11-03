'use client'

import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { cn } from '@/src/components/prism/utils/cn'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Text whose digits roll like an odometer when the value changes. Digits are keyed from the
 * right, so units and tens keep their place as the number grows. Visual only: callers give the
 * accessible text separately. With reduced motion the digits swap in place.
 */
export function RollingText({ text, className }: { text: string; className?: string }) {
  const reduce = useHydratedReducedMotion()
  const chars = Array.from(text)
  return (
    <span aria-hidden className={cn('inline-flex whitespace-nowrap tabular', className)}>
      {chars.map((c, i) => {
        const key = chars.length - i
        if (!/\d/.test(c)) return <span key={`c${key}`} style={{ whiteSpace: 'pre' }}>{c}</span>
        return (
          <span key={`d${key}`} className="relative inline-block overflow-hidden" style={{ height: '1em', lineHeight: 1 }}>
            <span className="invisible">0</span>
            <span
              className="absolute inset-x-0 top-0 flex flex-col"
              style={{
                transform: `translateY(${-Number(c) * 10}%)`,
                transition: reduce ? 'none' : 'transform 380ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {DIGITS.map((d) => (
                <span key={d} style={{ height: '1em', lineHeight: 1 }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}
