import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { landingMedia } from '@/src/landing-media'
import { SPRINT_SCORECARD_URL, SPRINT_WAYS_IN } from '@/src/ai-build-sprint-content'
import { SprintBriefCta } from './SprintCta'
import { Deal, DealItem, Reveal, RevealStack } from './motion'
import { TrackedLink } from './TrackedLink'
import { AccentedHeading, MonoLabel } from './ui'

const { brief, roi, scorecard } = SPRINT_WAYS_IN

/**
 * The ways in before a call. The sprint brief leads: a full-width panel with the real report
 * beside the pitch. The ROI estimate and the readiness scorecard follow as smaller cards, each
 * with a crop of its own report.
 */
export function SprintWaysIn() {
  const scorecardImage = landingMedia(scorecard.imageId)
  return (
    <div>
      {/* The lead CTA */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-surface-raised p-6 shadow-[0_40px_90px_-50px_rgba(91,60,210,0.55)] sm:p-10 lg:p-14">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.45), transparent)' }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(45,212,191,0.5), transparent)' }} />
          <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <MonoLabel className="mb-4">{brief.eyebrow}</MonoLabel>
              <h2 className="text-balance text-ink" style={{ fontSize: 'clamp(2.1rem, 1.5rem + 2.6vw, 3.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                <AccentedHeading heading={brief.heading} accent={brief.accent} />
              </h2>
              <p className="mt-5 max-w-lg text-ink-secondary" style={{ lineHeight: 1.6, fontSize: '1.0625rem' }}>
                {brief.body}
              </p>
              <ul className="mt-6 space-y-2.5">
                {brief.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-ink">
                    <CheckCircle2 aria-hidden className="h-5 w-5 flex-none text-brand-emerald-strong" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-9">
                <SprintBriefCta location="ways-in" className="px-8! py-4! text-base!" />
              </div>
            </div>
            <Deal className="relative mx-auto w-full max-w-[460px] lg:max-w-none" delay={0.1} stagger={0.14}>
              <DealItem className="relative">
                <div aria-hidden className="absolute inset-x-6 -bottom-3 h-full -rotate-3 rounded-xl border border-line bg-surface-base opacity-70" />
                <div aria-hidden className="absolute inset-x-3 -bottom-1.5 h-full rotate-2 rounded-xl border border-line bg-surface-base opacity-85" />
                <div className="relative overflow-hidden rounded-xl border border-line-strong bg-white shadow-[0_30px_70px_-30px_rgba(40,25,110,0.6)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static sample brief, same asset as the brief's own intro page */}
                  <img src={brief.image} alt={brief.imageAlt} width={768} height={1086} className="block h-auto w-full" loading="lazy" />
                </div>
              </DealItem>
            </Deal>
          </div>
        </div>
      </Reveal>

      {/* Two quieter ways in */}
      <RevealStack className="mt-6 grid gap-6 md:grid-cols-2" stagger={0.15}>
        <Reveal variant="item">
          <TrackedLink
            href={roi.href}
            event="sprint_roi_click"
            className="group grid h-full grid-cols-[minmax(0,1fr)_132px] items-center gap-5 overflow-hidden rounded-2xl border border-line bg-surface-base p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_24px_50px_-34px_rgba(60,40,160,0.5)] sm:grid-cols-[minmax(0,1fr)_180px]"
          >
            <span>
              <span className="type-sm block text-ink-secondary">{roi.prompt}</span>
              <span className="mt-2 flex items-start gap-1.5 font-medium text-ink">
                {roi.link}
                <ArrowRight aria-hidden className="mt-1 h-4 w-4 flex-none transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- static report crop */}
            <img src={roi.image} alt={roi.imageAlt} width={370} height={400} className="h-auto w-full rounded-lg border border-line shadow-sm" loading="lazy" />
          </TrackedLink>
        </Reveal>
        <Reveal variant="item">
          <TrackedLink
            href={SPRINT_SCORECARD_URL}
            event="sprint_scorecard_click"
            className="group grid h-full grid-cols-[minmax(0,1fr)_132px] items-center gap-5 overflow-hidden rounded-2xl border border-line bg-surface-base p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_24px_50px_-34px_rgba(60,40,160,0.5)] sm:grid-cols-[minmax(0,1fr)_180px]"
          >
            <span>
              <span className="type-sm block text-ink-secondary">{scorecard.prompt}</span>
              <span className="mt-2 flex items-start gap-1.5 font-medium text-ink">
                {scorecard.link}
                <ArrowRight aria-hidden className="mt-1 h-4 w-4 flex-none transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- static report crop */}
            <img src={scorecardImage.path} alt={scorecard.imageAlt} width={scorecardImage.width} height={scorecardImage.height} className="h-auto w-full rounded-lg border border-line shadow-sm" loading="lazy" />
          </TrackedLink>
        </Reveal>
      </RevealStack>
    </div>
  )
}
