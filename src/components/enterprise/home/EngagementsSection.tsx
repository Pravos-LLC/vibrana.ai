'use client'

import React from 'react'
import { Button } from '@/src/components/prism'
import { ParallaxMedia } from '@/src/components/prism/motion/ParallaxMedia'
import { RevealGroup, RevealItem } from '@/src/components/prism/motion/Reveal'
import { cn } from '@/src/components/prism/utils/cn'

export interface Engagement {
  title: string
  description: string
  bullets: string[]
  image: { src: string; alt: string }
  cta?: { text: string; href: string }
}

/**
 * EngagementsSection — the three ways in, each with a scene. The AI Build
 * Sprint leads as a wide split card (it is the hero's first step); the
 * transformation and the learning journeys sit below as a matched pair.
 */
export function EngagementsSection({ lead, pair }: { lead: Engagement; pair: Engagement[] }) {
  return (
    <div className="space-y-6">
      <RevealGroup>
        <RevealItem>
          <article className="grid overflow-hidden rounded-3xl border border-line-subtle bg-surface-raised shadow-[0_8px_40px_rgba(124,58,237,0.08)] lg:grid-cols-[7fr_5fr]">
            <div className="p-3 lg:p-4">
              <ParallaxMedia
                src={lead.image.src}
                alt={lead.image.alt}
                sizes="(max-width: 1024px) 92vw, 56vw"
                className="aspect-3/2 lg:aspect-auto lg:h-full lg:min-h-[460px]"
              />
            </div>
            <EngagementBody engagement={lead} accent="cyan" large />
          </article>
        </RevealItem>
      </RevealGroup>

      <RevealGroup className="grid gap-6 md:grid-cols-2">
        {pair.map((engagement, i) => (
          <RevealItem key={engagement.title} className="h-full">
            <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-line-subtle bg-surface-raised shadow-[0_8px_40px_rgba(124,58,237,0.06)]">
              <div className="p-3">
                <ParallaxMedia
                  src={engagement.image.src}
                  alt={engagement.image.alt}
                  aspect="16 / 10"
                  sizes="(max-width: 768px) 92vw, 45vw"
                />
              </div>
              <EngagementBody engagement={engagement} accent={i === 0 ? 'violet' : 'blue'} />
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}

const ACCENTS = {
  violet: { bg: 'rgba(124,58,237,0.10)', fg: 'var(--violet-strong)' },
  blue: { bg: 'rgba(59,130,246,0.10)', fg: '#1d4ed8' },
  cyan: { bg: 'rgba(45,212,191,0.14)', fg: '#0f766e' },
} as const

function EngagementBody({
  engagement,
  accent,
  large = false,
}: {
  engagement: Engagement
  accent: keyof typeof ACCENTS
  large?: boolean
}) {
  const a = ACCENTS[accent]
  return (
    <div className={cn('flex flex-1 flex-col', large ? 'px-6 py-8 md:px-10 md:py-12' : 'px-6 pb-8 pt-4 md:px-8')}>
      <h3 className={cn('font-display tracking-tight text-ink', large ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl')}>
        {engagement.title}
      </h3>
      <p className="mt-4 text-base leading-7 text-ink-secondary">{engagement.description}</p>
      <ul className="mt-6 space-y-3">
        {engagement.bullets.map((bullet, i) => (
          <li key={bullet} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-semibold"
              style={{ background: a.bg, color: a.fg }}
            >
              {i + 1}
            </span>
            <span className="text-base leading-7 text-ink">{bullet}</span>
          </li>
        ))}
      </ul>
      {engagement.cta && (
        <div className="mt-auto pt-8">
          <Button href={engagement.cta.href} variant={large ? 'primary' : 'secondary'} showArrow>
            {engagement.cta.text}
          </Button>
        </div>
      )}
    </div>
  )
}
