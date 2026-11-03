'use client'

import React from 'react'
import { ObligationGantt } from '@/src/components/eu-ai-act/report/ObligationGantt'
import { SectionRadar } from '@/src/components/eu-ai-act/report/SectionRadar'
import { PenaltyExposure } from '@/src/components/eu-ai-act/report/PenaltyExposure'
import { ActionPlan } from '@/src/components/eu-ai-act/report/ActionPlan'
import { cn } from '@/src/components/prism/utils/cn'
import { EU_REPORT_PREVIEW as RP, EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import type { SampleReport } from './sample'

/**
 * One instrument panel: a ruled cell with its figure line in mono on top, the real report
 * component at reading size, and the copy deck's callout as the caption under it.
 */
function Panel({ fig, title, caption, children, className }: { fig: string; title: string; caption: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn('m-0 flex min-w-0 flex-col border-line-subtle', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-subtle px-5 py-3 md:px-7">
        <span className="label-mono tabular text-ink-tertiary">{fig}</span>
        <span className="font-display font-semibold text-ink" style={{ fontSize: 17, lineHeight: 1.3 }}>
          {title}
        </span>
      </div>
      <div className="min-w-0 flex-1 px-5 py-6 md:px-7 md:py-8">{children}</div>
      <figcaption className="label-mono border-t border-line-subtle px-5 py-3 text-ink-secondary md:px-7">{caption}</figcaption>
    </figure>
  )
}

/**
 * ReportInstruments: what the report contains, panel by panel, at full reading size. The sample
 * company's obligations on one time axis with today's line (bars draw left to right as the panel
 * enters), its five control-area scores, its fine exposure for its size band and its first 90
 * days. Every panel is the component the results page renders.
 *
 * The page keeps its one gradient in the gauge arc: the plan's phase rules and the size panel's
 * wash render flat here (page-scoped overrides; the results page is unchanged).
 */
export function ReportInstruments({ report, today }: { report: SampleReport; today: string }) {
  const { profile, rows, plan } = report
  return (
    <div className="grid border border-line-subtle bg-surface-base lg:grid-cols-12">
      <Panel fig="FIG 2" title={R.labels.timeline} caption={RP.callouts.timeline} className="lg:col-span-12">
        <ObligationGantt rows={rows} today={today} />
      </Panel>
      <Panel fig="FIG 3" title={R.labels.sections} caption={RP.callouts.sections} className="border-t lg:col-span-12">
        {/* On phones the radar's axis labels need room outside the plot. */}
        <div className="max-md:px-8 max-md:[&_svg]:max-w-[220px]">
          <SectionRadar sections={profile.sectionScores} />
        </div>
      </Panel>
      <Panel
        fig="FIG 4"
        title={R.labels.penalties}
        caption={RP.callouts.size}
        className="border-t lg:col-span-12 [&_.bg-linear-to-br]:[background-image:none]"
      >
        <PenaltyExposure profile={profile} />
      </Panel>
      <Panel
        fig="FIG 5"
        title={R.labels.plan}
        caption={RP.callouts.plan}
        className="border-t lg:col-span-12 [&_.bg-linear-to-r]:[background-image:none] [&_.bg-linear-to-r]:bg-eu-ink"
      >
        <ActionPlan plan={plan} />
      </Panel>
    </div>
  )
}
