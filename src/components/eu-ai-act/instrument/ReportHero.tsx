'use client'

import { DeliverablePreview } from '@/src/components/landing'
import { ReadinessGauge } from '@/src/components/eu-ai-act/report/ReadinessGauge'
import { ExposureMap } from '@/src/components/eu-ai-act/report/ExposureMap'
import { StatusPill, formatDate } from '@/src/components/eu-ai-act/report/status'
import { useHydratedReducedMotion } from '@/src/components/prism/motion/useHydratedReducedMotion'
import { legalCite } from '@/src/lib/eu-ai-act/evidence'
import { cn } from '@/src/components/prism/utils/cn'
import { EU_REPORT_PREVIEW as RP, EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { TONE } from '../tone'
import type { SampleReport } from './sample'

/** Mono labels inside the report: 15px on the 720px page at preview scale; their own size when stacked. */
const MONO = '[[data-dp-mode=scaled]_&]:text-[15px]! label-mono'

/* Beat content is laid out at 720px and scaled into the paper. Under 560px the kit stacks the
   beats at reading size; the `[[data-dp-mode=stacked]_&]:` classes reflow them for that. */

/**
 * ReportHero: the sample report as the hero object. Three pages of the real report, rendered by
 * the real components from the sample company's answers: the cover with the readiness gauge
 * settling, the exposure map, and the dated obligations with their status and article. Callouts
 * are the copy deck's, on leader lines at xl and as numbered notes below it.
 */
export function ReportHero({ report }: { report: SampleReport }) {
  const { profile, rows, company } = report
  const reduce = useHydratedReducedMotion()
  const dated = rows.filter((r) => r.result.appliesFrom !== null)
  const level = R.readinessLabels[profile.readinessLevel]

  return (
    <div className="flex flex-col gap-4">
      <DeliverablePreview
        variant="paper"
        label={RP.ariaSummary}
        title={RP.kicker}
        designWidth={680}
        frameWidth={664}
        aspect={1.06}
        // Every callout sits on the right, so the kit reserves one label gutter, not two, and the
        // sheet renders near full size (664 / 680). Each dot lands where its line runs clear.
        beats={[
          { id: 'score', label: RP.beats.score, hold: 5200, callouts: [{ label: RP.callouts.gauge, target: 'gauge', side: 'right', y: 18 }] },
          { id: 'exposure', label: RP.beats.exposure, callouts: [{ label: RP.callouts.exposure, target: 'exposure', side: 'right', y: 22 }] },
          { id: 'obligations', label: RP.beats.obligations, callouts: [{ label: RP.callouts.obligations, target: 'obligations-head', side: 'right', y: 18 }] },
        ]}
      >
        {/* 1. Cover: the score */}
        <article className="flex min-h-[620px] flex-col [[data-dp-mode=stacked]_&]:min-h-0">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
            <span className={`${MONO} text-ink-secondary`}>
              {R.labels.readiness}
            </span>
            <span className={`${MONO} tabular text-ink-secondary`}>
              {R.labels.assessed(formatDate(profile.asOf))}
            </span>
          </div>
          <div className="mt-10 grid grid-cols-[1fr_300px] items-center gap-10 [[data-dp-mode=stacked]_&]:mt-6 [[data-dp-mode=stacked]_&]:grid-cols-1 [[data-dp-mode=stacked]_&]:gap-6">
            <div>
              <div className="font-display font-semibold text-ink" style={{ fontSize: 44, lineHeight: 1.04, letterSpacing: '-0.03em' }}>
                {company.name}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
                <Meta k={R.labels.scope} v={R.scopeLabels[profile.scope]} />
                <Meta k={R.labels.role} v={R.roleLabels[profile.role]} />
                <Meta k={R.labels.tier} v={R.tierLabels[profile.riskTier]} />
                <Meta k={R.labels.size} v={R.sizeLabels[profile.sizeBand]} />
              </div>
            </div>
            <div data-callout="gauge" className="rounded-[6px] bg-[#003399] p-6">
              <ReadinessGauge score={profile.readinessScore} level={profile.readinessLevel} />
              {reduce ? <span className="sr-only">{RP.gaugeReducedNote}</span> : null}
            </div>
          </div>
          <div className="mt-auto grid grid-cols-5 border-t border-line pt-5 [[data-dp-mode=stacked]_&]:mt-8 [[data-dp-mode=stacked]_&]:grid-cols-2 [[data-dp-mode=stacked]_&]:gap-y-4">
            {profile.sectionScores.map((s, i) => (
              <div key={s.key} className={cn('pr-3', i > 0 && 'border-l border-line-subtle pl-3 [[data-dp-mode=stacked]_&]:border-l-0 [[data-dp-mode=stacked]_&]:pl-0')}>
                <div className={`${MONO} text-ink-secondary`} style={{ minHeight: 40 }}>
                  {s.title}
                </div>
                <div className="tabular mt-2 font-display font-semibold text-ink" style={{ fontSize: 26, lineHeight: 1 }}>
                  {s.score ?? '-'}
                </div>
              </div>
            ))}
          </div>
          <span className="sr-only">
            {R.labels.readiness}: {profile.readinessScore} {R.labels.outOf}, {level}
          </span>
        </article>

        {/* 2. Exposure */}
        <article className="flex flex-col gap-6">
          <div className="border-b border-line pb-4">
            <span className={`${MONO} text-ink-secondary`}>
              {R.labels.exposure}
            </span>
            <div className="mt-2 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>
              {R.labels.exposureIntro}
            </div>
          </div>
          <div data-callout="exposure">
            <ExposureMap profile={profile} />
          </div>
        </article>

        {/* 3. The dated obligations, as a ledger */}
        <article className="flex flex-col">
          <div data-callout="obligations-head" className="border-b border-line pb-4">
            <span className={`${MONO} text-ink-secondary`}>
              {R.labels.obligations}
            </span>
            <div className="mt-2 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>
              {R.labels.obligationsIntro}
            </div>
          </div>
          <ol>
            {dated.map((r) => {
              const cite = legalCite(r.def.findings[0])
              return (
                <li key={r.def.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1.5 border-b border-line-subtle py-3.5">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span aria-hidden className={cn('mt-[6px] h-2.5 w-2.5 flex-none rounded-[2px]', TONE[r.tone].fill)} />
                    <span className="font-medium text-ink" style={{ fontSize: 16, lineHeight: 1.35 }}>
                      {r.def.title}
                    </span>
                  </div>
                  <StatusPill status={r.result.status} className="justify-self-end" />
                  <div className={`${MONO} col-span-2 flex flex-wrap gap-x-4 pl-5 text-ink-secondary`}>
                    <span>{r.result.appliesFrom ? `${R.labels.applies} ${formatDate(r.result.appliesFrom)}` : R.labels.undated}</span>
                    <span>{cite.label}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </article>
      </DeliverablePreview>
      <p className={`${MONO} text-center text-ink-secondary`}>{RP.sampleNote}</p>
    </div>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className={`${MONO} text-ink-secondary`}>
        {k}
      </div>
      <div className="mt-1 text-ink" style={{ fontSize: 18, lineHeight: 1.35 }}>
        {v}
      </div>
    </div>
  )
}
