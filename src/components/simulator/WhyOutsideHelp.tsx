'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@/src/components/prism'
import { SIM_DASH } from '@/src/simulator-content'

const w = SIM_DASH.why

/**
 * Why outside help: three cited figures, the supporting research with its caveats, and one
 * honest line on what the studies do not test. All copy lives in SIM_DASH.why.
 */
export function WhyOutsideHelp() {
  return (
    <div>
      <ul className="grid gap-4 md:grid-cols-3">
        {w.cards.map((c) => (
          <li key={c.title} className="flex flex-col rounded-2xl border border-line-subtle bg-surface-base p-5">
            <p className="font-display type-2xl font-semibold tabular-nums tracking-tight text-brand-violet-strong">{c.stat}</p>
            <p className="mt-1 font-display type-base font-semibold leading-snug text-ink">{c.title}</p>
            <p className="mt-2 type-sm leading-relaxed text-ink-secondary">{c.body}</p>
            <a href={c.source.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 type-xs font-medium text-brand-violet-strong hover:underline">
              {c.source.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-8 type-sm font-semibold text-ink">{w.evidenceHeading}</p>
      <ul className="mt-2 grid gap-x-8 md:grid-cols-2">
        {w.evidence.map((e) => (
          <li key={e.text} className="border-t border-line-subtle py-3">
            <p className="type-xs leading-relaxed text-ink-secondary">{e.text}</p>
            <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 type-xs text-brand-violet-strong hover:underline">
              {e.source.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl type-sm text-ink-secondary">{w.close}</p>
        <Button href={SIM_DASH.help.bookHref} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">
          {w.cta}
        </Button>
      </div>
    </div>
  )
}
