'use client'

import { motion } from 'framer-motion'
import { FileText, FolderOpen } from 'lucide-react'
import { SPRINT_PROBLEM } from '@/src/ai-build-sprint-content'
import { AMBER, BLUE, Chip, G, Loop, P, PRISM, RED, Scene, TEAL, VIOLET, useMarch } from './sceneKit'

const { scene, visualCaptions } = SPRINT_PROBLEM

const SLIDES = [
  { c: VIOLET, r: -13, from: -26 },
  { c: BLUE, r: -6, from: 22 },
  { c: TEAL, r: 5, from: -18 },
  { c: AMBER, r: -2, from: 30 },
]

function Lines({ n = 3, w = [86, 62, 74] }: { n?: number; w?: number[] }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="mt-2 block h-1.5 rounded-full bg-surface-overlay" style={{ width: `${w[i % w.length]}%` }} />
      ))}
    </>
  )
}

function Dashes() {
  const march = useMarch(-26, 1.6)
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.rect x="1" y="1" width="98" height="98" rx="8" fill="none" stroke="currentColor" className="text-ink-tertiary" strokeWidth={2} strokeDasharray="6 7" vectorEffect="non-scaling-stroke" {...march} />
    </svg>
  )
}

/** Line 2: slides riffle past like a shuffled deck and land on "Next steps"; the build folder stays empty. */
export function DeckScene({ still }: { still: boolean }) {
  return (
    <Scene still={still} tint={[BLUE, TEAL]}>
      <G className="absolute left-[6%] top-[8%] h-[66%] w-[62%] md:h-[70%] md:w-[60%]" stagger={0.14}>
        {SLIDES.map((s, i) => (
          <P key={i} c={{ y: -90, x: s.from * 3, r: s.from, to: s.r }} className="absolute inset-0">
            <Loop
              className="h-full w-full"
              animate={{ x: [0, 0, 150, 150, 0], y: [0, 0, -12, -12, 0], rotate: [0, 0, 22, 22, 0], opacity: [1, 1, 0, 0, 1] }}
              times={[0, 0.12 + i * 0.14, 0.26 + i * 0.14, 0.9, 1]}
              duration={6}
              ease="easeInOut"
            >
              <div className="h-full w-full overflow-hidden rounded-xl border border-line bg-surface-base shadow-[0_18px_34px_-18px_rgba(30,41,99,0.5)]">
                <div className="h-[22%]" style={{ background: s.c, opacity: 0.9 }} />
                <div className="p-3">
                  <span className="block h-2.5 w-1/2 rounded-full" style={{ background: s.c, opacity: 0.35 }} />
                  <Lines />
                </div>
              </div>
            </Loop>
          </P>
        ))}
        <P c={{ y: -110, x: -40, r: 16, to: -1.5 }} className="absolute inset-0">
          <div className="h-full w-full overflow-hidden rounded-xl border border-line-strong bg-surface-base shadow-[0_28px_50px_-20px_rgba(76,29,149,0.55)]">
            <div className="flex h-[22%] items-center px-3" style={{ background: PRISM }}>
              <span className="text-[15px] font-semibold tracking-tight text-white md:text-[17px]">{scene.slideTitle}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3 p-3">
              <div>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="mt-2 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full border-2" style={{ borderColor: [VIOLET, BLUE, TEAL][i] }} />
                    <span className="h-1.5 rounded-full bg-surface-overlay" style={{ width: `${[88, 66, 76][i]}%` }} />
                  </span>
                ))}
              </div>
              <svg viewBox="0 0 40 28" className="h-8 w-12 md:h-10 md:w-14" fill="none">
                <path d="M2 24 L12 14 L20 18 L36 4" stroke={BLUE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
              </svg>
            </div>
          </div>
        </P>
      </G>

      <P c={{ x: -24, y: 20, r: -10, to: -2 }} className="absolute bottom-[8%] left-[6%]">
        <Chip dot={RED}>
          <span className="inline-flex items-center gap-1.5">
            <FileText aria-hidden className="h-3 w-3" strokeWidth={2} />
            {visualCaptions[1]}
          </span>
        </Chip>
      </P>

      <P c={{ x: 60, y: -20, r: 14, to: 0 }} className="absolute bottom-[10%] right-[5%] h-[44%] w-[27%]">
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-surface-base/60 backdrop-blur-sm">
          <Dashes />
          <Loop animate={{ y: [0, -4, 0], opacity: [0.7, 1, 0.7] }} duration={2.6}>
            <FolderOpen aria-hidden className="h-7 w-7 text-ink-tertiary md:h-9 md:w-9" strokeWidth={1.5} />
          </Loop>
          <span className="label-mono text-ink-tertiary">{scene.folder}</span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <Loop key={i} animate={{ opacity: [0.15, 0.5, 0.15] }} duration={2.2} delay={i * 0.35} className="h-1.5 w-4 rounded-full bg-ink-tertiary" />
            ))}
          </span>
        </div>
      </P>
    </Scene>
  )
}
