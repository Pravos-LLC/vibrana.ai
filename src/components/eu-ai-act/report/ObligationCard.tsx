'use client'

import { useId, useState } from 'react'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import type { ReportRow } from '@/src/lib/eu-ai-act/report'
import { legalCite } from '@/src/lib/eu-ai-act/evidence'
import { EU_RESULTS as R } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'
import { LegalCite } from '../LegalCite'
import { TONE } from '../tone'
import { StatusPill, formatDate } from './status'

/**
 * ObligationCard: one obligation, with its tier color down the left edge, the status from the
 * answers, the date and the days left, what the law asks, the next step, and its source line.
 * "Read the provision" opens the verbatim text of each cited provision, quoted from the ledger
 * (legalCite). The panel opens with a grid-rows transition; under reduced motion it snaps. In
 * print every panel is open.
 */
export function ObligationCard({ row }: { row: ReportRow }) {
  const [open, setOpen] = useState(false)
  const panel = useId()
  const { result: o, def, tone, days } = row
  const seen = new Set<string>()
  const cites = def.findings.map(legalCite).filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)))

  return (
    <li className="relative overflow-hidden rounded-2xl border border-line-subtle bg-surface-base break-inside-avoid">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', TONE[tone].fill)} />
      <div className="grid gap-5 p-5 pl-6 md:grid-cols-[minmax(0,1fr)_12rem] md:gap-8 md:p-7 md:pl-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={o.status} />
            {def.practice && <span className="text-xs text-ink-tertiary">{R.labels.practice}</span>}
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink md:text-2xl">{def.title}</h3>
          <div className="mt-2 text-base leading-7 text-ink-secondary">{def.requirement}</div>
          {o.status !== 'met' && (
            <div className="mt-4 rounded-xl bg-surface-raised p-4 text-sm leading-6 text-ink">
              <span className="font-semibold">{R.labels.nextStep}: </span>
              {def.action}
            </div>
          )}
          <LegalCite findings={def.findings} className="mt-4" />
        </div>
        <div className="flex flex-row items-end justify-between gap-4 border-t border-line-subtle pt-4 md:flex-col md:items-end md:justify-start md:border-l md:border-t-0 md:pl-6 md:pt-0 md:text-right">
          <div>
            <div className="text-xs font-medium text-ink-tertiary">{o.appliesFrom ? R.labels.applies : R.labels.undated}</div>
            {o.appliesFrom && <div className="mt-1 font-mono text-sm font-semibold text-ink">{formatDate(o.appliesFrom)}</div>}
          </div>
          {days !== null && (
            <div className="md:mt-5">
              {days > 0 ? (
                <>
                  <div className="font-display text-4xl font-semibold leading-none tracking-tight tabular-nums text-ink">{days}</div>
                  <div className="mt-1 text-xs text-ink-secondary">{R.labels.days}</div>
                </>
              ) : (
                <span className={cn('inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1', TONE[tone].soft, TONE[tone].ring, TONE[tone].text)}>{R.labels.inForceShort}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line-subtle print:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-6 py-3.5 text-left text-sm font-medium text-ink-secondary transition-colors duration-150 hover:bg-surface-raised hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-violet md:px-8"
        >
          {open ? R.labels.hideLaw : R.labels.readLaw}
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200 ease-out motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
        </button>
      </div>
      <div
        id={panel}
        role="region"
        aria-label={def.title}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none print:grid-rows-[1fr]',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={cn('overflow-hidden', !open && 'invisible print:visible')}>
          <ol className="space-y-4 bg-surface-raised px-6 py-5 md:px-8">
            {cites.map((c) => (
              <li key={c.slug}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-eu-ink underline-offset-2 hover:underline">
                  {c.fullLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
                <blockquote className="mt-2 border-l-2 border-eu-ink pl-4 text-sm leading-6 text-ink">
                  “{c.quote}”
                </blockquote>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </li>
  )
}
