'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Calendar, Mail, Printer } from 'lucide-react'
import { Button, Eyebrow } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'
import { LegalCite } from './LegalCite'
import { TONE } from './tone'
import { ReadinessGauge } from './report/ReadinessGauge'
import { StatusTally } from './report/StatusTally'
import { ExposureMap } from './report/ExposureMap'
import { ObligationGantt } from './report/ObligationGantt'
import { ActionPlan } from './report/ActionPlan'
import { SectionRadar } from './report/SectionRadar'
import { ObligationCard } from './report/ObligationCard'
import { PenaltyExposure } from './report/PenaltyExposure'
import { formatDate } from './report/status'
import { useToday } from './ComplianceTimeline'
import { EU_ASSESSMENT_HREF, EU_CALL_HREF, EU_CTA, EU_DETAILS, EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import type { EUProfile } from '@/src/lib/eu-ai-act/engine'
import { actionPlan, nextDate, reportRows, statusTally, tierTone } from '@/src/lib/eu-ai-act/report'
import { trackCallClick } from '@/src/lib/funnel/client'
import type { EntryPoint } from '@/src/lib/funnel/entry'

const EASE = [0.23, 1, 0.32, 1] as const

function SectionHead({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
      {intro && <p className="mt-3 text-base leading-7 text-ink-secondary">{intro}</p>}
    </div>
  )
}

/**
 * EUResults: the EU AI Act Readiness report. A verdict header (scope, role, tier and size, with the
 * readiness score as a ring of EU stars), a status tally and the next date, the exposure map, the
 * obligations on a timeline, a suggested first 90 days, scores by control area, each obligation
 * with the quoted provision behind it, and the penalty caps for the company's size. Everything is
 * derived from the profile (src/lib/eu-ai-act/report.ts); every legal line keeps its citation.
 * Countdowns and the timeline's today line use the real date, read after mount (the page is
 * client-rendered from storage), never earlier than the assessment date; `today` pins it (e.g. for
 * a video embed). Existing props are unchanged so embeds keep working.
 */
export function EUResults({ profile, company, entry, today: pinned }: { profile: EUProfile; company: { name: string; email: string }; entry?: EntryPoint; today?: string }) {
  const reduce = useReducedMotion()
  const live = useToday()
  const today = pinned ?? (live && live > profile.asOf ? live : profile.asOf)
  const rows = reportRows(profile, today)
  const tally = statusTally(rows)
  const next = nextDate(rows)
  const plan = actionPlan(profile, rows)
  const tier = tierTone(profile.riskTier)

  const facts = [
    { label: R.labels.scope, value: R.scopeLabels[profile.scope] },
    { label: R.labels.role, value: R.roleLabels[profile.role] },
    { label: R.labels.tier, value: R.tierLabels[profile.riskTier], tone: tier },
    { label: R.labels.size, value: R.sizeLabels[profile.sizeBand] },
  ] as const

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: reduce ? 0 : delay, ease: EASE },
  })

  return (
    <div className="eu-report mx-auto max-w-6xl px-5 pb-24 pt-24 md:px-6 md:pt-32 print:pt-0">
      {/* Verdict */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-8">
        <motion.div className="flex flex-col" {...rise(0)}>
          <Eyebrow gradient="prism">{R.eyebrow}</Eyebrow>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">{company.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-secondary">
            <span>{R.labels.assessed(formatDate(profile.asOf))}</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-secondary transition-[color,transform] duration-150 ease-out hover:text-ink active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet print:hidden"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              {R.labels.print}
            </button>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line-subtle bg-line-subtle lg:mt-auto">
            {facts.map((f) => (
              <div key={f.label} className={cn('relative bg-surface-base p-4 md:p-5', 'tone' in f && TONE[f.tone].soft)}>
                {'tone' in f && <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', TONE[f.tone].fill)} />}
                <dt className="text-xs font-medium text-ink-tertiary">{f.label}</dt>
                <dd className={cn('mt-1.5 font-display text-base font-semibold leading-snug md:text-lg', 'tone' in f ? TONE[f.tone].text : 'text-ink')}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-3xl bg-eu-blue p-6 text-white shadow-[0_30px_80px_-30px_rgba(0,51,153,0.6)] md:p-8 print:shadow-none"
          {...rise(0.1)}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(90% 70% at 85% 0%, rgba(255,204,0,0.22), transparent 60%), radial-gradient(90% 90% at 0% 100%, rgba(0,10,40,0.55), transparent 65%)' }}
          />
          <div className="relative text-sm font-semibold text-white/85">{R.labels.scoreLabel}</div>
          <div className="relative mt-2">
            <ReadinessGauge score={profile.readinessScore} level={profile.readinessLevel} />
          </div>
        </motion.div>
      </section>

      {/* Summary */}
      <motion.section className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" {...rise(0.2)}>
        <div className="flex flex-col rounded-2xl border border-line-subtle bg-surface-base p-6 md:p-7">
          <StatusTally tally={tally} />
        </div>
        <div className={cn('relative overflow-hidden rounded-2xl border border-line-subtle p-6 md:p-7', next ? TONE[next.rows[0].tone].soft : 'bg-surface-base')}>
          <h2 className="font-display text-lg! font-semibold tracking-tight text-ink">{R.labels.nextDate}</h2>
          {next ? (
            <>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl font-semibold leading-none tracking-tight tabular-nums text-ink">{next.days}</span>
                <span className="text-base text-ink-secondary">{R.labels.days}</span>
              </div>
              <div className={cn('mt-2 font-mono text-sm font-semibold', TONE[next.rows[0].tone].text)}>{formatDate(next.date)}</div>
              <ul className="mt-3 space-y-1">
                {next.rows.map((r) => (
                  <li key={r.def.id} className="flex items-start gap-2 text-sm leading-5 text-ink">
                    <span aria-hidden className={cn('mt-[5px] h-2 w-2 flex-none rounded-[2px]', TONE[r.tone].fill)} />
                    {r.def.title}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-3 text-sm leading-6 text-ink-secondary">{R.labels.noNextDate}</div>
          )}
        </div>
      </motion.section>

      {profile.prohibitedFlag && (
        <div role="alert" className="mt-6 flex gap-4 rounded-2xl border border-brand-red-strong/30 bg-brand-red/[0.06] p-5 md:p-6">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-red-strong text-white">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="text-sm leading-6 text-ink">{R.labels.prohibitedFlag}</div>
            <LegalCite findings={R.labels.prohibitedFindings} className="mt-1" />
          </div>
        </div>
      )}

      <section className="mt-20 md:mt-28">
        <SectionHead title={R.labels.exposure} intro={R.labels.exposureIntro} />
        <div className="mt-8">
          <ExposureMap profile={profile} />
        </div>
      </section>

      <section className="mt-20 md:mt-28 print:break-before-page">
        <SectionHead title={R.labels.timeline} intro={R.labels.timelineIntro} />
        <div className="mt-8 rounded-2xl border border-line-subtle bg-surface-base p-5 md:p-8">
          <ObligationGantt rows={rows} today={today} />
        </div>
      </section>

      <section className="mt-20 md:mt-28">
        <SectionHead title={R.labels.plan} intro={R.labels.planIntro} />
        <div className="mt-8">
          <ActionPlan plan={plan} />
        </div>
      </section>

      <section className="mt-20 md:mt-28 print:break-before-page">
        <SectionHead title={R.labels.sections} intro={R.labels.sectionsIntro} />
        <div className="mt-8 rounded-2xl border border-line-subtle bg-surface-base p-6 md:p-10">
          <SectionRadar sections={profile.sectionScores} />
        </div>
      </section>

      <section className="mt-20 md:mt-28">
        <SectionHead title={R.labels.obligations} intro={R.labels.obligationsIntro} />
        <ol className="mt-8 space-y-4">
          {rows.map((r) => (
            <ObligationCard key={r.def.id} row={r} />
          ))}
        </ol>
      </section>

      <section className="mt-20 md:mt-28 print:break-before-page">
        <SectionHead title={R.labels.penalties} />
        <div className="mt-8">
          <PenaltyExposure profile={profile} />
        </div>
      </section>

      {/* Next */}
      <section className="mt-20 grid gap-6 md:grid-cols-2 print:hidden">
        <div className="rounded-2xl border border-line-subtle bg-surface-frost p-6 backdrop-blur-md">
          <Mail className="h-5 w-5 text-brand-violet-strong" aria-hidden />
          <p className="mt-3 text-sm leading-6 text-ink-secondary">{R.labels.emailed(company.email)}</p>
          <Button href={EU_ASSESSMENT_HREF} variant="secondary" className="mt-5">{R.labels.retake}</Button>
        </div>
        <div className="rounded-2xl border border-brand-violet/30 bg-brand-violet/5 p-6">
          <h3 className="font-display text-xl font-semibold text-ink">{R.labels.callTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">{R.labels.callBody}</p>
          <Button href={EU_CALL_HREF} target="_blank" rel="noopener noreferrer" className="mt-5" onClick={() => trackCallClick('eu-ai-act-report', entry)}>
            <Calendar className="h-4 w-4" aria-hidden />
            {EU_CTA.secondary.label}
          </Button>
        </div>
      </section>

      <p className="mt-12 text-xs leading-5 text-ink-tertiary">{EU_DETAILS.disclaimer}</p>
    </div>
  )
}
