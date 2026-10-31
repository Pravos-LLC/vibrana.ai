import React from 'react'
import { Section, SectionHeader } from '@/src/components/prism'
import { EXECUTIVE_METHODOLOGY_BRIDGE } from '@/src/executive-transformation-content'
import { TRANSFORMATION_PHASES } from '@/src/enterprise-content'

export function ExecutiveMethodologyBridge() {
  return (
    <Section container="full" rhythm="large">
      <SectionHeader
        eyebrow={EXECUTIVE_METHODOLOGY_BRIDGE.eyebrow}
        title={EXECUTIVE_METHODOLOGY_BRIDGE.title}
        subtitle={EXECUTIVE_METHODOLOGY_BRIDGE.subtitle}
      />
      <div className="grid gap-6 md:grid-cols-4">
        {TRANSFORMATION_PHASES.map((phase, index) => (
          <div key={phase.title} className="rounded-2xl border border-line-subtle bg-surface-frost p-6">
            <span className="type-xs font-semibold uppercase tracking-wide text-ink-tertiary">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-ink">{phase.title}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-secondary">{phase.description}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
