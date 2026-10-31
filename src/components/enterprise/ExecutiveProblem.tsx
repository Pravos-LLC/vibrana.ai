import React from 'react'
import { Mail, Brain, Puzzle, Clock } from 'lucide-react'
import { Card, IconBox, Section, SectionHeader } from '@/src/components/prism'
import { EXECUTIVE_PROBLEM } from '@/src/executive-transformation-content'

const ICONS = { Mail, Brain, Puzzle, Clock } as const

export function ExecutiveProblem() {
  return (
    <Section container="full" rhythm="large">
      <SectionHeader
        eyebrow={EXECUTIVE_PROBLEM.eyebrow}
        title={EXECUTIVE_PROBLEM.title}
        subtitle={EXECUTIVE_PROBLEM.subtitle}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {EXECUTIVE_PROBLEM.cards.map((card) => {
          const Icon = ICONS[card.icon as keyof typeof ICONS]
          return (
            <Card key={card.title} className="flex flex-col">
              <IconBox icon={Icon} tint="violet" className="mb-5" />
              <h3 className="text-lg font-semibold text-ink">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-secondary">{card.description}</p>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}
