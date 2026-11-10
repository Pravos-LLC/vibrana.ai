'use client'

import { motion, type Variants } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'
import { AMBER, BLUE, Chip, G, GREEN, Loop, P, PRISM, Scene, TEAL, VIOLET, Win, growVariants, popVariants } from './sceneKit'

const { scene, closeCaption } = SPRINT_PROBLEM
const BARS = [34, 52, 44, 68, 58, 82, 74]
const SPARK = [VIOLET, BLUE, TEAL, GREEN, AMBER, '#ec4899', BLUE, TEAL]

const flipVariants: Variants = {
  hidden: { opacity: 0, y: 36, rotateY: 0 },
  show: {
    opacity: 1,
    y: 0,
    rotateY: 180,
    transition: { opacity: { duration: 0.4 }, y: { type: 'spring', stiffness: 160, damping: 20 }, rotateY: { delay: 0.9, duration: 1.1, ease: [0.65, 0, 0.2, 1] } },
  },
}

const stampVariants: Variants = {
  hidden: { opacity: 0, scale: 2.6, rotate: -22 },
  show: { opacity: 1, scale: 1, rotate: -7, transition: { delay: 2.45, type: 'spring', stiffness: 420, damping: 17, mass: 0.8 } },
}

const ringVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: [0, 0.7, 0], scale: [0.5, 1, 2.3], transition: { delay: 2.5, duration: 0.9, times: [0, 0.15, 1], ease: 'easeOut' } },
}

const sparkVariants: Variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 0 },
  show: (i: number) => {
    const a = (i / SPARK.length) * Math.PI * 2 + 0.3
    return { opacity: [0, 1, 0], x: Math.cos(a) * 78, y: Math.sin(a) * 52, scale: [0, 1.1, 0.4], transition: { delay: 2.5, duration: 0.85, ease: 'easeOut' } }
  },
}

const face = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as const

/** The close: the same window as the pilot, flipped to live; checks tick; a Shipped stamp lands. */
export function ShippedScene({ still }: { still: boolean }) {
  return (
    <Scene still={still} tint={[TEAL, GREEN]}>
      <div className="absolute inset-x-[6%] inset-y-[7%]" style={{ perspective: 1400 }}>
        <motion.div variants={flipVariants} className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Front: the demo window from line one, still locked. */}
          <div className="absolute inset-0" style={face}>
            <Win title={scene.windowTitle} badge={<span className="label-mono rounded-full border border-dashed px-2 py-0.5" style={{ color: AMBER, borderColor: AMBER }}>{scene.demoBadge}</span>}>
              <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4">
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-line-subtle bg-surface-raised p-2">
                      <span className="block h-1.5 w-1/2 rounded-full bg-surface-overlay" />
                      <span className="mt-2 block h-3 rounded-full bg-surface-overlay" style={{ width: `${70 - i * 12}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex min-h-0 flex-1 items-end gap-1.5 rounded-lg border border-line-subtle bg-surface-raised px-3 pb-2 pt-3 md:gap-2">
                  {BARS.map((h, i) => (
                    <span key={i} className="flex-1 rounded-t-md bg-surface-overlay" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-end">
                  <span className="flex items-center gap-2 rounded-[10px] bg-surface-overlay px-4 py-2 text-[13px] font-semibold text-ink-tertiary">
                    <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {scene.deploy}
                  </span>
                </div>
              </div>
            </Win>
          </div>
          {/* Back: the live window. */}
          <div className="absolute inset-0" style={{ ...face, transform: 'rotateY(180deg)' }}>
            <Win
              title={scene.windowTitle}
              badge={
                <span className="label-mono inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-brand-emerald-strong" style={{ background: 'rgba(34,197,94,0.14)' }}>
                  <Loop animate={{ scale: [1, 1.7, 1], opacity: [1, 0.4, 1] }} duration={1.8} className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                  live
                </span>
              }
            >
              <G className="flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4" stagger={0.1} delay={1.35}>
                <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr] gap-3">
                  <div className="flex min-h-0 items-end gap-1.5 rounded-lg border border-line-subtle bg-surface-raised px-2.5 pb-2 pt-3">
                    {BARS.map((h, i) => (
                      <P key={i} variants={growVariants} className="flex-1 origin-bottom rounded-t-md" style={{ height: `${h}%`, background: `linear-gradient(to top, ${VIOLET}, ${TEAL})` }} />
                    ))}
                  </div>
                  <G className="flex flex-col justify-between gap-2" stagger={0.14}>
                    {scene.checks.map((label) => (
                      <P key={label} c={{ x: 28, y: 0, r: 8 }} className="flex items-center gap-2 rounded-lg border border-line-subtle bg-surface-raised px-2 py-2 text-[11.5px] font-medium text-ink md:text-[12.5px]">
                        <motion.span variants={popVariants} className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-white md:h-[18px] md:w-[18px]" style={{ background: GREEN }}>
                          <Check className="h-2.5 w-2.5 md:h-3 md:w-3" strokeWidth={3.5} />
                        </motion.span>
                        <span className="truncate">{label}</span>
                      </P>
                    ))}
                  </G>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <G className="hidden -space-x-2 sm:flex" stagger={0.08}>
                    {[VIOLET, BLUE, TEAL].map((c, i) => (
                      <P key={i} variants={popVariants} className="grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-bold text-white" style={{ background: c, borderColor: GREEN }}>
                        {['A', 'B', 'C'][i]}
                      </P>
                    ))}
                  </G>
                  <P c={{ x: 20, r: 6 }}>
                    <Chip dot={GREEN} className="text-[10.5px]">{closeCaption}</Chip>
                  </P>
                </div>
              </G>
            </Win>
          </div>
        </motion.div>
      </div>

      <motion.span variants={ringVariants} aria-hidden className="pointer-events-none absolute bottom-[36%] left-[36%] h-24 w-24 rounded-full border-2" style={{ borderColor: TEAL }} />
      {SPARK.map((c, i) => (
        <motion.span key={i} custom={i} variants={sparkVariants} aria-hidden className="pointer-events-none absolute bottom-[45%] left-[44%] h-2 w-2 rounded-full" style={{ background: c }} />
      ))}
      <motion.div variants={stampVariants} className="absolute bottom-[30%] left-[30%]" style={{ transformOrigin: 'center' }}>
        <div className="rounded-xl p-[3px] shadow-[0_18px_34px_-12px_rgba(45,212,191,0.55)]" style={{ background: PRISM }}>
          <div className="rounded-[9px] bg-surface-base px-4 py-1.5">
            <span className="font-label text-[18px] font-bold uppercase tracking-[0.12em] md:text-[22px]" style={{ background: 'var(--gradient-prism-text)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              {scene.shipped}
            </span>
          </div>
        </div>
      </motion.div>
    </Scene>
  )
}
