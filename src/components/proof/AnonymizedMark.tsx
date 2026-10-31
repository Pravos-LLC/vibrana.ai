import { Lock } from 'lucide-react'
import { cn } from '@/src/components/prism/utils/cn'
import { ANONYMIZED_PROOF } from '@/src/anonymized-proof-content'

/**
 * AnonymizedTag — the quiet "this client is under NDA" marker. Tertiary ink, hairline
 * border, a lock glyph. It sits next to the vertical on cards and under the title on
 * case study pages; it never covers an image.
 */
export function AnonymizedTag({ long = false, className }: { long?: boolean; className?: string }) {
  return (
    <span
      title={ANONYMIZED_PROOF.explainer}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line-subtle px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-tertiary',
        className,
      )}
    >
      <Lock aria-hidden className="h-3 w-3" />
      <span>{long ? ANONYMIZED_PROOF.tagLong : ANONYMIZED_PROOF.tag}</span>
      <span className="sr-only">. {ANONYMIZED_PROOF.explainer}</span>
    </span>
  )
}

/**
 * RedactedLogo — the logo-row slot for an anonymized client. No invented brand: a
 * hairline-dashed slot, a lock, and the descriptor.
 */
export function RedactedLogo({ descriptor, className }: { descriptor: string; className?: string }) {
  return (
    <span
      title={ANONYMIZED_PROOF.explainer}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-dashed border-line-strong px-3 py-1.5 text-xs text-ink-tertiary',
        className,
      )}
    >
      <Lock aria-hidden className="h-3 w-3 shrink-0" />
      <span>{descriptor}</span>
    </span>
  )
}
