'use client'

import { motion } from 'framer-motion'
import { KeyRound, Lock } from 'lucide-react'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'
import { AMBER, BLUE, Chip, G, Loop, P, PRISM, RED, Scene, TEAL, VIOLET, popVariants, useMarch } from './sceneKit'

const { scene, visualCaptions } = SPRINT_PROBLEM

function Padlock() {
  return (
    <svg viewBox="0 0 64 80" className="h-16 w-14 drop-shadow-[0_10px_16px_rgba(76,29,149,0.45)] md:h-20 md:w-16" fill="none">
      <defs>
        <linearGradient id="padlock-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={VIOLET} />
          <stop offset="1" stopColor={BLUE} />
        </linearGradient>
      </defs>
      <path d="M16 36 V24 a16 16 0 0 1 32 0 V36" stroke="currentColor" className="text-ink-secondary" strokeWidth={6} strokeLinecap="round" />
      <rect x="6" y="34" width="52" height="40" rx="10" fill="url(#padlock-body)" />
      <circle cx="32" cy="52" r="5" fill="#fff" fillOpacity={0.92} />
      <rect x="30" y="54" width="4" height="11" rx="2" fill="#fff" fillOpacity={0.92} />
    </svg>
  )
}

/** Dashed reach line from the team to the key: it marches, then stops short at the glass. */
function Reach() {
  const march = useMarch(-24, 1.2)
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 520 400" preserveAspectRatio="none">
      <motion.path d="M96 372 C 120 300, 250 330, 372 236" fill="none" stroke={RED} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" {...march} />
    </svg>
  )
}

/** Line 3: a sign-in only the vendor can get past, with the key hovering out of reach. */
export function VendorScene({ still }: { still: boolean }) {
  return (
    <Scene still={still} tint={[VIOLET, AMBER]}>
      <P c={{ y: 40, r: -5, to: 0 }} className="absolute left-[5%] top-[9%] w-[62%] md:w-[58%]">
        <div className="rounded-2xl border border-line bg-surface-base p-4 shadow-[0_28px_56px_-28px_rgba(76,29,149,0.5)]">
          <G className="flex flex-col" stagger={0.1} delay={0.25}>
            <P c={{ y: -18, r: -8 }} className="flex items-center gap-2.5">
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: PRISM }} />
              <span className="text-[15px] font-semibold text-ink md:text-base">{scene.signIn}</span>
            </P>
            <P c={{ x: -30, r: -4 }} className="mt-4 flex h-9 items-center rounded-lg border border-line bg-surface-raised px-3">
              <motion.span variants={{ hidden: { width: 0 }, show: { width: '62%', transition: { duration: 0.7, delay: 0.3 } } }} className="h-1.5 rounded-full bg-ink-tertiary/60" />
            </P>
            <P c={{ x: -30, r: -4 }} className="mt-2.5 flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface-raised px-3">
              <G className="flex gap-1.5" stagger={0.06} delay={0.5}>
                {Array.from({ length: 8 }, (_, i) => (
                  <P key={i} variants={popVariants} className="h-1.5 w-1.5 rounded-full bg-ink" />
                ))}
              </G>
            </P>
            <P c={{ y: 20, r: 6 }} className="relative mt-4">
              <Loop animate={{ x: [0, -3, 3, -2, 0, 0, 0] }} times={[0, 0.06, 0.1, 0.14, 0.18, 0.6, 1]} duration={3.6} ease="linear">
                <div className="flex h-9 items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white opacity-70" style={{ background: PRISM }}>
                  <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {scene.signIn}
                </div>
              </Loop>
            </P>
            <P c={{ y: 12 }} className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
              <Lock aria-hidden className="h-3 w-3" style={{ color: AMBER }} strokeWidth={2} />
              {scene.vendorNote}
            </P>
          </G>
        </div>
      </P>

      <P c={{ y: -80, x: 20, r: 40, to: 10 }} className="absolute left-[50%] top-[2%] md:left-[47%]">
        <Loop animate={{ rotate: [0, -7, 5, 0], y: [0, -3, 0, 0] }} duration={4.2}>
          <Padlock />
        </Loop>
      </P>

      <P c={{ x: 50, y: -30, r: 16, to: 0 }} className="absolute right-[4%] top-[12%] h-[42%] w-[27%]">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-base/70 shadow-[inset_0_0_30px_rgba(245,158,11,0.18)] backdrop-blur-md">
          <span aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(115deg, transparent 38%, color-mix(in srgb, var(--surface-base) 85%, transparent) 50%, transparent 62%)' }} />
          <Loop animate={{ y: [-7, 7, -7], rotate: [-18, 10, -18] }} duration={4}>
            <KeyRound aria-hidden className="h-10 w-10 md:h-12 md:w-12" style={{ color: AMBER, filter: 'drop-shadow(0 0 14px rgba(245,158,11,0.65))' }} strokeWidth={1.75} />
          </Loop>
        </div>
      </P>

      <P c={{ y: 20, x: 20, r: 6, to: 0 }} className="absolute bottom-[5%] right-[4%]">
        <Chip dot={AMBER}>{visualCaptions[2]}</Chip>
      </P>

      <P variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 1.1 } } }} className="absolute inset-0">
        <Reach />
      </P>
      <G className="absolute bottom-[5%] left-[6%] flex -space-x-2" stagger={0.1} delay={0.9}>
        {[VIOLET, BLUE, TEAL].map((c, i) => (
          <P key={i} variants={popVariants} className="grid h-8 w-8 place-items-center rounded-full border-2 border-surface-base text-[10px] font-bold text-white" style={{ background: c, opacity: 0.9 }}>
            {['A', 'B', 'C'][i]}
          </P>
        ))}
      </G>
    </Scene>
  )
}
