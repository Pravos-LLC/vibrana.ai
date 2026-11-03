'use client'
import { PublicDemoImg } from '@/src/components/PublicDemoImage'

/* eslint-disable @next/next/no-img-element -- small static brand marks at fixed heights */
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Eyebrow, Section, SectionHeader } from '@/src/components/prism'
import { RedactedLogo } from '@/src/components/proof/AnonymizedMark'
import { LOGO_ROW_LABELS, NDA_SLOT_LABEL, PROOF_LOGOS } from '@/src/logo-rows-content'
import { cn } from '@/src/components/prism/utils/cn'
import { SECTOR_EXAMPLES, type SectorExample } from '@/src/lib/simulator/sector-examples'
import { PROOF_CONTENT as C, PROOF_WALL, PROOF_WALL_COLUMNS, type ProofWallLogo } from '@/src/simulator-landing-proof-content'

const EASE = [0.22, 1, 0.36, 1] as const

interface Entry {
  wall: ProofWallLogo
  example: SectorExample
}

const ENTRIES: Entry[] = PROOF_WALL.flatMap((wall) => {
  const example = SECTOR_EXAMPLES[wall.sector]
  return example ? [{ wall, example }] : []
})

/**
 * The company's name set as a wordmark. The real marks are not cleared for this repo yet, so the
 * wall shows names in type rather than a stand-in image.
 */
function Mark({ example }: { example: SectorExample }) {
  return (
    <span className="font-display font-semibold text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
      {example.company}
    </span>
  )
}

/** Clients and where the team has delivered, each mark once, wrapped (no marquee copies). */
function DeliveredRow() {
  return (
    <ul aria-label={LOGO_ROW_LABELS.combined} className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
      {PROOF_LOGOS.map(({ name, src, height, anonymized }) => (
        <li key={name} className="flex items-center">
          {anonymized ? (
            <RedactedLogo descriptor={NDA_SLOT_LABEL} />
          ) : (
            <PublicDemoImg src={src} alt={name} loading="lazy" className="proof-logo opacity-75" style={{ height: `${height}px`, width: 'auto' }} />
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Proof: a wall of the companies that published a result. It reveals row by row; picking a logo
 * (click, tap, keyboard focus or mouse hover) opens that company's primary-sourced result below.
 * The "delivered at" rows are a separate claim and keep their own label underneath.
 */
export function ProofSection() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const current = ENTRIES[active]

  return (
    <Section id={C.id} container="wide" surface="raised">
      <SectionHeader eyebrow={C.eyebrow} title={C.title} subtitle={C.subtitle} />

      <div
        role="group"
        aria-label={C.title}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line-subtle bg-line-subtle sm:grid-cols-3 lg:grid-cols-5"
      >
        {ENTRIES.map(({ wall, example }, i) => {
          const row = Math.floor(i / PROOF_WALL_COLUMNS)
          const col = i % PROOF_WALL_COLUMNS
          const on = i === active
          return (
            <motion.button
              key={wall.sector}
              type="button"
              aria-pressed={on}
              aria-controls="proof-detail"
              aria-label={example.company}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -12% 0px' }}
              transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : row * 0.28 + col * 0.06, ease: EASE }}
              className={cn(
                'group relative flex h-28 items-center justify-center bg-surface-base px-6 transition-colors duration-300',
                on ? 'bg-surface-raised' : 'hover:bg-surface-raised',
              )}
            >
              <span className={cn('flex items-center transition-opacity duration-300', on ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}>
                <Mark example={example} />
              </span>
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-6 bottom-0 h-0.5 origin-left rounded-full bg-brand-violet transition-transform duration-500',
                  on ? 'scale-x-100' : 'scale-x-0',
                )}
                style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </motion.button>
          )
        })}
      </div>

      <div id="proof-detail" aria-live="polite" className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.article
              key={current.wall.sector}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
              className="grid gap-6 rounded-2xl border border-line-subtle bg-surface-base p-6 md:grid-cols-[1.2fr_1fr] md:gap-10 md:p-8"
            >
              <div>
                <p className="type-xs font-medium text-ink-tertiary">{current.example.descriptor}</p>
                <h3 className="mt-1 font-display type-xl font-semibold text-ink">{current.example.company}</h3>
                <p className="mt-3 type-lg leading-snug text-ink">{current.example.result}</p>
              </div>
              <div className="flex flex-col justify-between gap-4 border-t border-line-subtle pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <figure>
                  <figcaption className="type-xs uppercase text-ink-tertiary" style={{ letterSpacing: '0.12em' }}>
                    {C.quoteLabel}
                  </figcaption>
                  <blockquote className="mt-2 type-sm leading-relaxed text-ink-secondary">&ldquo;{current.example.quote}&rdquo;</blockquote>
                </figure>
                <div className="flex flex-wrap items-center justify-between gap-2 type-xs text-ink-tertiary">
                  <span>{C.reported[current.example.reportedBy]}</span>
                  <a
                    href={current.example.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-violet-strong hover:underline"
                  >
                    {C.sourceLabel(current.example.publisher, current.example.date)}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-16 border-t border-line-subtle pt-10 text-center">
        <Eyebrow>{C.delivered.eyebrow}</Eyebrow>
        <h3 className="mt-2 font-display type-lg font-semibold text-ink">{C.delivered.title}</h3>
        <p className="mx-auto mt-2 max-w-md type-sm text-ink-tertiary">{C.delivered.note}</p>
        <DeliveredRow />
        <p className="mx-auto mt-4 max-w-md type-xs text-ink-tertiary">{LOGO_ROW_LABELS.clientsNote}</p>
      </div>
    </Section>
  )
}
