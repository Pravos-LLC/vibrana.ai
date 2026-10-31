'use client'

import React from 'react'
import { Repeat, Rocket, ShieldCheck, Target, TrendingUp, Users } from 'lucide-react'
import { AI_TRANSFORMATION_DIFFERENTIATORS } from '@/src/enterprise-content'
import { Card, IconBox, SectionHeader } from '@/src/components/prism'

const ITEM_ICON = [ShieldCheck, Rocket, Repeat, Users, Target, TrendingUp] as const

export function AITransformationDifferentiators() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow={AI_TRANSFORMATION_DIFFERENTIATORS.eyebrow}
          title={AI_TRANSFORMATION_DIFFERENTIATORS.title}
          subtitle={AI_TRANSFORMATION_DIFFERENTIATORS.subtitle}
          align="left"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {AI_TRANSFORMATION_DIFFERENTIATORS.items.map((item, index) => {
            const Icon = ITEM_ICON[index]
            return (
              <Card key={item.title} variant="feature" glow gradientBorder className="flex flex-col">
                <IconBox icon={Icon} tint={item.tint} className="mb-5" />
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">{item.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
