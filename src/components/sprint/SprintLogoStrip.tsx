import { PublicDemoImg } from '@/src/components/PublicDemoImage'
import { RedactedLogo } from '@/src/components/proof/AnonymizedMark'
import { LOGO_ROW_LABELS, NDA_SLOT_LABEL, PROOF_LOGOS } from '@/src/logo-rows-content'
import { MonoLabel } from './ui'

/**
 * The proof row under the hero, set once and still: each mark appears in one slot (the shared
 * marquee renders its track six times, which the image-slot guard counts as duplicates). Cells
 * sit on a hairline grid so the row reads as a spec strip, not a ticker.
 */
export function SprintLogoStrip() {
  return (
    <section aria-label={LOGO_ROW_LABELS.combined} className="px-6 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl">
        <MonoLabel className="mb-4">{LOGO_ROW_LABELS.combined}</MonoLabel>
        <ul className="grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-9">
          {PROOF_LOGOS.map(({ name, src, height, anonymized }) => (
            <li key={name} className="flex h-16 items-center sm:h-20 justify-center border-b border-r border-line px-4">
              {anonymized ? (
                <RedactedLogo descriptor={NDA_SLOT_LABEL} />
              ) : (
                <PublicDemoImg src={src} alt={name} className="proof-logo opacity-75" style={{ height: `${Math.round(height * 0.85)}px`, width: 'auto', maxWidth: '100%' }} />
              )}
            </li>
          ))}
        </ul>
        {LOGO_ROW_LABELS.clientsNote ? (
          <p className="type-xs mt-3 max-w-xl text-ink-tertiary" style={{ lineHeight: 1.5 }}>
            {LOGO_ROW_LABELS.clientsNote}
          </p>
        ) : null}
      </div>
    </section>
  )
}
