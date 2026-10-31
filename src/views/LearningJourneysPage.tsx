'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Layers3 } from 'lucide-react'
import { EnterprisePageShell } from '@/src/components/enterprise/EnterprisePageShell'
import { LEARNING_JOURNEY_PILLARS, JOB_FUNCTIONS } from '@/src/enterprise-content'
import { Button, Eyebrow, SectionHeader } from '@/src/components/prism'

const panel =
  'rounded-2xl border border-line-subtle bg-surface-frost backdrop-blur-md'

export default function LearningJourneysPage() {
  return (
    <EnterprisePageShell>
      <section className="px-6 pb-16 pt-32 md:pb-24 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Role-based curricula</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight text-ink md:text-7xl">
            Your Finance team and your Engineering team need completely different AI training. We built both.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-ink-secondary md:text-xl md:leading-8">
            20 role-specific learning journeys. Each one teaches AI through the workflows, decisions, and tools that
            role already uses. Self-paced, with real-work assignments, and manager-ready rollout guides so your team
            leads can deploy without external trainers.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/contact" showArrow>Get a curriculum preview</Button>
            <Button href="/learn" variant="secondary">See the full curriculum</Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Why this works"
            title="Generic AI training has a 90% forgetting rate. Ours doesn't."
            subtitle="The difference: we start from the job, not the technology. Each curriculum is built around real workflows your team runs every week."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {LEARNING_JOURNEY_PILLARS.map((pillar) => (
              <div key={pillar.title} className={`${panel} p-6`}>
                <div className="flex items-center gap-3">
                  <span className="rounded-full p-3" style={{ background: 'rgba(124,58,237,0.10)' }}>
                    <Layers3 className="h-5 w-5 text-brand-violet" />
                  </span>
                  <h3 className="text-xl font-semibold text-ink">{pillar.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-ink-secondary">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-2xl border border-line-subtle px-6 py-10 md:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Full catalog</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-5xl md:leading-[1.1]">
                20 roles. 20 curricula. Zero overlap.
              </h2>
            </div>
            <Link
              href="/contact"
              className="type-xs uppercase tracking-[0.12em] text-brand-violet-strong transition-opacity hover:opacity-80"
            >
              Which ones fit your org?
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {JOB_FUNCTIONS.map((family) => (
              <div key={family} className={`${panel} px-4 py-4`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-violet-strong" />
                  <p className="text-sm leading-6 text-ink">{family}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </EnterprisePageShell>
  )
}
