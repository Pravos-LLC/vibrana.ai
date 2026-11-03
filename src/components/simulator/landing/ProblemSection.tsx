'use client'

import { ProofMetric, ProofMetricRow, ReelStage } from '@/src/components/landing'
import { Section } from '@/src/components/prism/Section'
import { landingVideo } from '@/src/landing-media'
import { SIM_PROBLEM, SIM_PROBLEM_MIT, SIM_PROBLEM_PWC } from '@/src/simulator-landing-problem-content'
import { SIM_SIZZLE_STAGE as Z } from '@/src/simulator-landing-hero-content'

/** m:ss from the encoded file's duration in the media manifest, never typed. */
const clock = (seconds: number) => `${Math.floor(Math.round(seconds) / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}`

const reel = landingVideo('simulator/simulator-sizzle-full')
const CLIPS = [
  {
    id: 'simulator-sizzle',
    label: Z.clipLabel,
    mp4: reel.mp4.path,
    webm: reel.webm.path,
    poster: reel.poster.path,
    duration: clock(reel.mp4.duration ?? 0),
  },
]

/**
 * Why it stalls: the two figures this page owns (PwC CEO payoff, MIT NANDA with its Contested tag
 * and caveat), the closing lines, and the approved sizzle reel beside them. The other surveys moved
 * to the Readiness page (deck §3, plan S4).
 */
export function ProblemSection() {
  const P = SIM_PROBLEM
  return (
    <Section id={P.id} container="wide" className="scroll-mt-16">
      <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-20">
        <div className="min-w-0">
          <p className="label-mono text-ink-tertiary">{P.eyebrow}</p>
          <h2 className="mt-4 max-w-[18ch] font-display font-semibold text-ink" style={{ fontSize: 'clamp(2rem, 1.4rem + 2vw, 3rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            {P.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-ink-secondary" style={{ fontSize: '1.0625rem', lineHeight: 1.55 }}>
            {P.subtitle}
          </p>

          <ProofMetricRow maxColumns={2} label={P.title} className="mt-10">
            <ProofMetric
              value={SIM_PROBLEM_PWC.value.replace('%', '')}
              unit="%"
              label={
                <>
                  {SIM_PROBLEM_PWC.label} {SIM_PROBLEM_PWC.both.value} {SIM_PROBLEM_PWC.both.label}
                </>
              }
              source={SIM_PROBLEM_PWC.source}
            />
            <ProofMetric
              value={SIM_PROBLEM_MIT.value.replace('%', '')}
              unit="%"
              label={
                <>
                  <span className="label-mono mb-2 inline-flex items-center rounded-full border border-line px-2 py-0.5 text-ink-secondary">{SIM_PROBLEM_MIT.tag}</span>
                  <span className="block">{SIM_PROBLEM_MIT.label}</span>
                </>
              }
              source={SIM_PROBLEM_MIT.source}
            />
          </ProofMetricRow>
          <p className="mt-4 max-w-[64ch] type-xs leading-relaxed text-ink-tertiary">
            <span className="font-medium text-ink-secondary">{SIM_PROBLEM_MIT.tag}.</span> {SIM_PROBLEM_MIT.detail} {SIM_PROBLEM_MIT.caveat}
          </p>

          <div className="mt-10 border-l-2 border-brand-violet pl-5">
            <p className="font-display font-semibold text-ink" style={{ fontSize: 'clamp(1.25rem, 1rem + 0.9vw, 1.75rem)', lineHeight: 1.25 }}>
              {P.closing.line}
            </p>
            <p className="mt-1 font-display text-ink-secondary" style={{ fontSize: 'clamp(1.25rem, 1rem + 0.9vw, 1.75rem)', lineHeight: 1.25 }}>
              {P.closing.bridge}
            </p>
          </div>
        </div>

        <ReelStage
          clips={CLIPS}
          title={Z.title}
          caption={Z.caption}
          playLabel={Z.playLabel}
          playingLabel={Z.playingLabel}
          labels={Z.labels}
          cardWidth={320}
        />
      </div>
    </Section>
  )
}
