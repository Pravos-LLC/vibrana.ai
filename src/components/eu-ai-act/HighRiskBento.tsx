'use client'

import Image from '@/src/components/PublicDemoImage'
import { RevealGroup, RevealItem } from '@/src/components/prism'
import { LegalCite } from './LegalCite'
import { LoopVideo } from './LoopVideo'
import { getImagery } from '@/src/imagery-manifest'
import { cn } from '@/src/components/prism/utils/cn'

type Item = {
  label: string
  body: string
  findings: readonly string[]
  media: { kind: 'video'; src: string } | { kind: 'image'; src: string; alt: string }
}

// Wide, narrow / narrow, wide: the four Annex III areas never sit as four equal cards.
const SPAN = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7']

/**
 * HighRiskBento: the four Annex III areas the assessment asks about first, each with a real
 * loop (hiring, managing people) or a generated still (credit, education). Amber is the
 * high-risk tone everywhere on the page; here it is the rule above each caption.
 */
export function HighRiskBento({ items }: { items: readonly Item[] }) {
  // Content order: hiring, managing people, credit, education. Layout order puts a still next
  // to each loop.
  const order = [items[0], items[2], items[3], items[1]]
  return (
    <RevealGroup className="grid gap-5 lg:grid-cols-12">
      {order.map((i, k) => {
        const still = i.media.kind === 'image' ? getImagery(i.media.src) : undefined
        return (
          <RevealItem key={i.label} className={cn('group flex flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface-base', SPAN[k])}>
            <div className={cn('relative overflow-hidden', k === 0 || k === 3 ? 'aspect-[16/9]' : 'aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-0 lg:flex-1')}>
              {i.media.kind === 'video' ? (
                <LoopVideo name={i.media.src} className="absolute inset-0" sizes="(max-width: 1024px) 92vw, 40vw" mediaClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
              ) : (
                still && (
                  <Image src={still.file} alt={i.media.alt} fill sizes="(max-width: 1024px) 92vw, 30vw" className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]" />
                )
              )}
            </div>
            <div className="border-t-2 border-brand-amber p-5 md:p-6">
              <h4 className="font-display text-lg font-semibold text-ink">{i.label}</h4>
              <div className="mt-1.5 text-sm leading-6 text-ink-secondary">{i.body}</div>
              <LegalCite findings={i.findings} className="mt-2" />
            </div>
          </RevealItem>
        )
      })}
    </RevealGroup>
  )
}
