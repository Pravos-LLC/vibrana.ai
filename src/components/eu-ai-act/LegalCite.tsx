import { legalCite } from '@/src/lib/eu-ai-act/evidence'
import { EU_SOURCE_LABELS as L } from '@/src/eu-ai-act-readiness-content'
import { cn } from '@/src/components/prism/utils/cn'

/**
 * LegalCite: the source line under a legal statement, one linked locator per provision
 * ("Reg. (EU) 2024/1689, Article 26(7)"). Hovering shows the quoted text. Data comes from the
 * ledger snapshot (src/lib/eu-ai-act/evidence.ts), so a slug the knowledge base does not
 * allow fails the build.
 */
export function LegalCite({ findings, className }: { findings: readonly string[]; className?: string }) {
  const seen = new Set<string>()
  const cites = findings.map(legalCite).filter((c) => (seen.has(c.label) ? false : (seen.add(c.label), true)))
  return (
    <div className={cn('text-xs leading-5 text-ink-tertiary', className)}>
      {L.source}:{' '}
      {cites.map((c, i) => (
        <span key={c.slug}>
          {i > 0 && '; '}
          <a href={c.url} target="_blank" rel="noopener noreferrer" title={`${c.fullLabel}: “${c.quote}”`} className="underline decoration-line underline-offset-2 hover:text-ink">
            {c.label}
          </a>
        </span>
      ))}
    </div>
  )
}
