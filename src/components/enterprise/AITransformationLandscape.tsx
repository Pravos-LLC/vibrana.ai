'use client'

import React from 'react'
import { Building2, Cloud, CheckCircle2 } from 'lucide-react'
import { AI_TRANSFORMATION_LANDSCAPE } from '@/src/enterprise-content'
import { Button, Card, Eyebrow, IconBox, SectionHeader } from '@/src/components/prism'

const CARD_ICON = [Building2, Cloud, CheckCircle2] as const

export function AITransformationLandscape() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={AI_TRANSFORMATION_LANDSCAPE.eyebrow}
          title={AI_TRANSFORMATION_LANDSCAPE.title}
          subtitle={AI_TRANSFORMATION_LANDSCAPE.subtitle}
          align="left"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {AI_TRANSFORMATION_LANDSCAPE.cards.map((card, index) => {
            const Icon = CARD_ICON[index]
            return (
              <Card
                key={card.title}
                variant="feature"
                glow={card.highlighted}
                gradientBorder={card.highlighted}
                className="flex flex-col"
              >
                <IconBox icon={Icon} tint={card.tint} className="mb-5" />
                <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-wide text-ink-tertiary">{card.subtitle}</p>
                <ul className="mt-6 space-y-4">
                  {card.points.map((point) => (
                    <li key={point.label} className="border-t border-line-subtle pt-3 first:border-0 first:pt-0">
                      <div className="text-sm font-semibold text-ink">{point.label}</div>
                      <div className="mt-0.5 text-sm leading-6 text-ink-secondary">{point.description}</div>
                    </li>
                  ))}
                </ul>
                {card.proof && (
                  <div className="mt-6 flex flex-col gap-3">
                    <Eyebrow>See it in a real engagement</Eyebrow>
                    {card.proof.map((ref) => (
                      <Button key={ref.href} href={ref.href} variant="secondary" showArrow>
                        {ref.label}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
