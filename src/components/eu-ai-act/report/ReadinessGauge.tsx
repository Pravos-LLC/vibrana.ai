'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { READINESS_BANDS } from '@/src/lib/eu-ai-act/report'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'

const EASE = [0.23, 1, 0.32, 1] as const
const C = 130
const RING = 92
const STAR_R = 116

/** A five-point star centered on (x, y): the EU flag's star. */
function star(x: number, y: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.4 : r
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

const polar = (pct: number, r: number) => {
  const a = -Math.PI / 2 + (pct / 100) * Math.PI * 2
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const
}

/**
 * ReadinessGauge: the readiness score as a ring on an EU-blue field, ringed by the flag's twelve
 * stars. The ring fills to the score, and the stars light in step (one per 1/12 of the score), so
 * the flag completes at 100. Ticks mark the band edges (45 and 75). The ring draws and the stars
 * light in sequence on mount; under reduced motion everything renders in place.
 */
export function ReadinessGauge({ score, level }: { score: number; level: EUProfile['readinessLevel'] }) {
  const reduce = useReducedMotion()
  const lit = Math.round((score / 100) * 12)
  const circumference = 2 * Math.PI * RING
  return (
    <figure className="relative mx-auto w-full max-w-[300px]" aria-label={`${R.labels.scoreLabel}: ${score} ${R.labels.outOf}, ${R.readinessLabels[level]}`}>
      <svg viewBox={`0 0 ${C * 2} ${C * 2}`} className="block w-full" aria-hidden>
        <defs>
          <linearGradient id="eu-gauge-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe066" />
            <stop offset="100%" stopColor="#ffcc00" />
          </linearGradient>
        </defs>
        <circle cx={C} cy={C} r={RING} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={14} />
        <motion.circle
          cx={C}
          cy={C}
          r={RING}
          fill="none"
          stroke="url(#eu-gauge-arc)"
          strokeWidth={14}
          strokeLinecap="round"
          transform={`rotate(-90 ${C} ${C})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? circumference * (1 - score / 100) : circumference }}
          animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
          transition={{ duration: reduce ? 0 : 1.4, delay: 0.25, ease: EASE }}
        />
        {/* band edges */}
        {READINESS_BANDS.slice(1).map((b) => {
          const [x1, y1] = polar(b.from, RING - 7)
          const [x2, y2] = polar(b.from, RING + 7)
          return <line key={b.level} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const [x, y] = polar((i / 12) * 100, STAR_R)
          const on = i < lit
          return (
            <motion.polygon
              key={i}
              points={star(x, y, 7)}
              fill={on ? '#ffcc00' : 'rgba(255,255,255,0.18)'}
              initial={{ opacity: reduce ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : 0.25 + (on ? (i / Math.max(lit, 1)) * 1.3 : 1.4) }}
            />
          )
        })}
      </svg>
      <figcaption className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-6xl font-semibold leading-none tracking-tight tabular-nums text-white md:text-7xl">{score}</span>
        <span className="mt-1 text-xs font-medium text-white/70">{R.labels.outOf}</span>
        <span className="mt-3 rounded-full bg-eu-gold px-3 py-1 text-xs font-semibold text-[#0b1a4d]">{R.readinessLabels[level]}</span>
      </figcaption>
    </figure>
  )
}
