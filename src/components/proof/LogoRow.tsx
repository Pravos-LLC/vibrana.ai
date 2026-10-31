import { PublicDemoImg } from '@/src/components/PublicDemoImage'
import { RedactedLogo } from '@/src/components/proof/AnonymizedMark'
import { Eyebrow } from '@/src/components/prism'
import { cn } from '@/src/components/prism/utils/cn'
import { LOGO_ROW_LABELS, PROOF_LOGOS, type ProofLogo } from '@/src/logo-rows-content'

/**
 * LogoRow — the two honest proof rows: "Our clients" and, quieter, "Where our team
 * has delivered". Used under the home hero and the AI Build Sprint hero.
 *
 * Each row is a slow, edge-faded horizontal carousel (CSS only, so it costs no JS and
 * paints with the HTML). The track holds the list six times and slides by half its
 * width, so the loop is seamless at any viewport up to ~2.5k wide. Hover pauses it;
 * under prefers-reduced-motion it stops and wraps as a static centred row.
 */
const COPIES = 6

function Row({
  label,
  logos,
  tone,
  seconds,
  note,
}: {
  label: string
  note?: string
  logos: readonly ProofLogo[]
  tone: 'strong' | 'quiet'
  seconds: number
}) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className="logo-marquee mt-5" style={{ ['--marquee-duration' as string]: `${seconds}s` }}>
        <ul className="logo-marquee-track">
          {Array.from({ length: COPIES }).flatMap((_, copy) =>
            logos.map(({ name, src, height, anonymized }) => (
              <li key={`${copy}-${name}`} className="logo-marquee-item" aria-hidden={copy > 0 || undefined}>
                {anonymized ? (
                  <RedactedLogo descriptor={anonymized} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- small SVG wordmarks; next/image adds nothing here
                  <PublicDemoImg
                    src={src}
                    alt={copy === 0 ? name : ''}
                    className={cn('proof-logo transition-opacity', tone === 'strong' ? 'opacity-75 hover:opacity-100' : 'opacity-60 hover:opacity-90')}
                    style={{ height: `${height}px`, width: 'auto' }}
                  />
                )}
              </li>
            )),
          )}
        </ul>
      </div>
      {note && <p className="mx-auto mt-4 max-w-md text-ink-tertiary" style={{ fontSize: 12, lineHeight: "18px" }}>{note}</p>}
    </div>
  )
}

export function LogoRow({ className }: { className?: string }) {
  return (
    <div className={cn('text-center', className)}>
      <Row label={LOGO_ROW_LABELS.combined} logos={PROOF_LOGOS} tone="strong" seconds={140} note={LOGO_ROW_LABELS.clientsNote} />
    </div>
  )
}
