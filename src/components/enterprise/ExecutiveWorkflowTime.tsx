import React from 'react'
import { Mail, Users, Calendar, BarChart3, FileText, MessageSquare } from 'lucide-react'
import { Badge, Card, IconBox, Section, SectionHeader } from '@/src/components/prism'
import { EXECUTIVE_WORKFLOW_TIME, type ExecutiveWorkflowLoad } from '@/src/executive-transformation-content'

const ICONS = { Mail, Users, Calendar, BarChart3, FileText, MessageSquare } as const

const LOAD_TINT: Record<ExecutiveWorkflowLoad, 'amber' | 'blue' | 'cyan'> = {
  Heaviest: 'amber',
  High: 'blue',
  Moderate: 'cyan',
}

export function ExecutiveWorkflowTime() {
  return (
    <Section container="full" rhythm="large" surface="raised">
      <SectionHeader
        eyebrow={EXECUTIVE_WORKFLOW_TIME.eyebrow}
        title={EXECUTIVE_WORKFLOW_TIME.title}
        subtitle={EXECUTIVE_WORKFLOW_TIME.subtitle}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {EXECUTIVE_WORKFLOW_TIME.workflows.map((workflow) => {
          const Icon = ICONS[workflow.icon as keyof typeof ICONS]
          return (
            <Card key={workflow.title} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <IconBox icon={Icon} tint="violet" />
                <Badge tint={LOAD_TINT[workflow.load]} size="sm" uppercase>
                  {workflow.load} load
                </Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-ink">{workflow.title}</h3>
              <div className="mt-4 flex flex-col gap-3">
                <div className="rounded-xl border border-line-subtle bg-surface-frost p-3">
                  <span className="type-xs font-semibold uppercase tracking-wide text-ink-tertiary">Before</span>
                  <p className="mt-1 text-sm leading-6 text-ink-secondary">{workflow.before}</p>
                </div>
                <div className="rounded-xl border border-line-subtle bg-surface-frost p-3">
                  <span className="type-xs font-semibold uppercase tracking-wide text-ink-tertiary">After</span>
                  <p className="mt-1 text-sm leading-6 text-ink-secondary">{workflow.after}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-ink-tertiary">
        {EXECUTIVE_WORKFLOW_TIME.footnote}
      </p>
    </Section>
  )
}
