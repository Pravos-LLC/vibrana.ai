'use client'

import { useState } from 'react'

// Ordinal violet ramp, largest part strongest. Light: dark to light on white (light end 2.65:1).
// Dark: the same order runs light to dark, so the largest part keeps the most contrast on the
// dark surface. Classes, not inline hex, so the theme can swap them.
const RAMP = ['bg-[#4c1d95] dark:bg-[#c4b5fd]', 'bg-[#7c3aed] dark:bg-[#8b5cf6]', 'bg-[#a78bfa] dark:bg-[#6d28d9]']

/**
 * ChallengeSplit — one 100% bar split into ordered parts (BCG's 70 / 20 / 10). Values sit
 * in the legend under the bar, never squeezed into a thin segment; hovering or focusing a
 * segment or its legend row highlights the pair.
 */
export function ChallengeSplit({ segments, ariaLabel }: { segments: readonly { value: number; label: string }[]; ariaLabel: string }) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <figure aria-label={ariaLabel}>
      <div className="flex h-6 w-full gap-[2px]" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}%`).join(', ')}>
        {segments.map((s, i) => (
          <div
            key={s.label}
            className={`h-full transition-opacity duration-200 first:rounded-l-[4px] last:rounded-r-[4px] ${RAMP[i]}`}
            style={{ width: `${s.value}%`, opacity: active === null || active === i ? 1 : 0.35 }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          />
        ))}
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {segments.map((s, i) => (
          <li
            key={s.label}
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className="flex items-baseline gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
          >
            <span aria-hidden className={`mt-1 inline-block h-2.5 w-2.5 flex-none translate-y-[-1px] rounded-full ${RAMP[i]}`} />
            <span className="tabular font-display text-3xl font-semibold tracking-tight text-ink">{s.value}%</span>
            <span className="text-sm leading-5 text-ink-secondary">{s.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
