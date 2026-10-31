import { cite } from '@/src/lib/readiness-page/evidence'
import { READINESS_SOURCE_LABELS as L } from '@/src/ai-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * Cite — the source line under a figure: publisher, linked title and year, and who was
 * studied. Data comes from the ledger snapshot (src/lib/readiness-page/evidence.ts);
 * the sample line comes from page copy and is checked against the source by tests.
 */
export function Cite({ findings, sample, className }: { findings: readonly string[]; sample?: string; className?: string }) {
  // One source line per distinct source document, in the order first cited.
  const seen = new Set<string>()
  const sources = findings
    .map(cite)
    .filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)))
  return (
    <div className={cn('text-xs leading-5 text-ink-tertiary', className)}>
      {L.source}:{' '}
      {sources.map((c, i) => (
        <span key={c.slug}>
          {i > 0 && '; '}
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
            {c.publisher}, {c.title} ({c.year})
          </a>
        </span>
      ))}
      .{sample ? ` ${L.studied}: ${sample}.` : ''}
    </div>
  )
}
