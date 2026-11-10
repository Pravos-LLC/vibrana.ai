'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { SPRINT_GUARANTEE } from '@/src/ai-build-sprint-content'

/**
 * The guarantee as a stamp: a double ring with the words set around it, and a large "100%" filled
 * with a green to blue gradient. It lands once when it scrolls into view (scale down, a small
 * overshoot, settle), like an inked stamp pressed onto the page.
 */
export function GuaranteeStamp({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const ring = `stamp-ring-${id}`
  const grad = `stamp-grad-${id}`
  const text = `${SPRINT_GUARANTEE.stampCaption} guarantee · First sprint · `.toUpperCase()
  return (
    <motion.div
      aria-hidden="true"
      className={className}
      initial={{ opacity: 0, scale: 1.7, rotate: -26 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -11 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ type: 'spring', stiffness: 210, damping: 15, mass: 0.9, delay: 0.1 }}
    >
      <svg viewBox="0 0 240 240" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="55%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <path id={ring} d="M120,120 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
          <filter id={`${grad}-rough`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </defs>
        <g filter={`url(#${grad}-rough)`}>
          <circle cx="120" cy="120" r="112" fill="none" stroke={`url(#${grad})`} strokeWidth="5" />
          <circle cx="120" cy="120" r="103" fill="none" stroke={`url(#${grad})`} strokeWidth="1.5" />
          <circle cx="120" cy="120" r="64" fill="none" stroke={`url(#${grad})`} strokeWidth="1.5" strokeDasharray="2 5" />
          <text fill={`url(#${grad})`} fontSize="15" fontWeight="700" letterSpacing="3.2" style={{ fontFamily: 'var(--font-label, ui-monospace), monospace' }}>
            <textPath href={`#${ring}`} startOffset="0" textLength="570" lengthAdjust="spacing">
              {text}
            </textPath>
          </text>
          <text x="120" y="138" textAnchor="middle" fill={`url(#${grad})`} fontSize="62" fontWeight="800" letterSpacing="-2" style={{ fontFamily: 'var(--font-display, system-ui), sans-serif' }}>
            {SPRINT_GUARANTEE.stamp}
          </text>
          <text x="120" y="164" textAnchor="middle" fill={`url(#${grad})`} fontSize="13" fontWeight="700" letterSpacing="4" style={{ fontFamily: 'var(--font-label, ui-monospace), monospace' }}>
            {SPRINT_GUARANTEE.stampCaption.toUpperCase()}
          </text>
        </g>
      </svg>
    </motion.div>
  )
}
