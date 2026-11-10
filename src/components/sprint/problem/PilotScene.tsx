'use client'

import { Lock, MousePointer2 } from 'lucide-react'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'
import { AMBER, BLUE, Chip, G, Loop, P, PRISM, RED, Scene, TEAL, VIOLET, Win, drawVariants, growVariants } from './sceneKit'
import { motion } from 'framer-motion'

const { scene, visualCaptions } = SPRINT_PROBLEM
const BARS = [34, 52, 44, 68, 58, 82, 74]
const KPIS = [VIOLET, BLUE, TEAL]

/** Line 1: the pilot works, the dashboard climbs, and Deploy stays out of reach. */
export function PilotScene({ still }: { still: boolean }) {
  return (
    <Scene still={still} tint={[VIOLET, BLUE]}>
      <P c={{ y: 50, r: 5, to: 0 }} className="absolute inset-x-[6%] inset-y-[7%]">
        <Win
          title={scene.windowTitle}
          badge={<span className="label-mono rounded-full border border-dashed px-2 py-0.5" style={{ color: AMBER, borderColor: AMBER }}>{scene.demoBadge}</span>}
        >
          <G className="relative flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4" stagger={0.06} delay={0.15}>
            <G className="grid grid-cols-3 gap-2" stagger={0.07}>
              {KPIS.map((c, i) => (
                <P key={i} c={{ y: -26, r: i % 2 ? 9 : -9 }} className="rounded-lg border border-line-subtle bg-surface-raised p-2">
                  <span className="block h-1.5 w-1/2 rounded-full bg-surface-overlay" />
                  <span className="mt-2 block h-3 rounded-full" style={{ width: `${70 - i * 12}%`, background: c, opacity: 0.85 }} />
                </P>
              ))}
            </G>
            <div className="relative min-h-0 flex-1 rounded-lg border border-line-subtle bg-surface-raised px-3 pb-2 pt-3">
              <G className="flex h-full items-end gap-1.5 md:gap-2" stagger={0.07} delay={0.1}>
                {BARS.map((h, i) => (
                  <P key={i} variants={growVariants} className="flex-1 origin-bottom rounded-t-md" style={{ height: `${h}%`, background: `linear-gradient(to top, ${VIOLET}, ${i > 4 ? TEAL : BLUE})` }} />
                ))}
              </G>
              <svg className="pointer-events-none absolute inset-x-3 inset-y-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path variants={drawVariants} d="M3 70 C 18 62, 24 48, 38 52 S 62 34, 72 30 S 90 12, 97 8" fill="none" stroke={AMBER} strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="relative flex items-center justify-between gap-3">
              <P c={{ x: -30, y: 0, r: -6 }}>
                <Chip dot={AMBER}>{visualCaptions[0]}</Chip>
              </P>
              <P c={{ x: 30, y: 10, r: 8 }} className="relative">
                <Loop animate={{ x: [0, 0, -5, 5, -3, 0, 0, 0, -5, 5, -3, 0, 0] }} times={[0, 0.2, 0.22, 0.25, 0.28, 0.3, 0.68, 0.7, 0.72, 0.75, 0.78, 0.8, 1]} duration={5.2} ease="linear">
                  <Loop animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0.0)', '0 0 26px 4px rgba(124,58,237,0.55)', '0 0 0 0 rgba(124,58,237,0.0)'] }} duration={2.4} className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white" style={{ background: PRISM, borderRadius: 10 }}>
                    <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
                    {scene.deploy}
                    <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 border-surface-base" style={{ background: RED }} />
                  </Loop>
                </Loop>
                <Loop
                  className="pointer-events-none absolute -inset-2 rounded-xl border-2 border-dashed"
                  style={{ borderColor: RED, opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.9, 0, 0, 0.9, 0], scale: [0.9, 0.9, 1.08, 1.12, 0.9, 1.08, 1.12] }}
                  times={[0, 0.2, 0.24, 0.34, 0.68, 0.72, 0.82]}
                  duration={5.2}
                  ease="linear"
                />
              </P>
              <Loop
                className="pointer-events-none absolute bottom-0 right-6"
                animate={{ x: [-150, -48, -48, -150, -110, -44, -150], y: [-30, 12, 12, -46, -12, 16, -30] }}
                times={[0, 0.2, 0.32, 0.5, 0.66, 0.78, 1]}
                duration={5.2}
                ease="easeInOut"
              >
                <MousePointer2 aria-hidden className="h-5 w-5 fill-ink text-surface-base drop-shadow" strokeWidth={1.5} />
              </Loop>
            </div>
          </G>
        </Win>
      </P>
    </Scene>
  )
}
