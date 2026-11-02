'use client'

/* Synthetic demos for the landing kit gallery. Every number, name and answer here is a fixture
   (Northwind Logistics is the fictional EU AI Act demo company). Nothing here is client data. */

import React from 'react'
import Image from 'next/image'
import {
  ChapterRail,
  DeliverablePreview,
  DistinctProductFrame,
  GateCard,
  ProblemSequence,
  ProductToggle,
  ProofMetric,
  ProofMetricRow,
  ReelStage,
  type Chapter,
} from '@/src/components/landing'
import { ReadinessGauge } from '@/src/components/eu-ai-act/report/ReadinessGauge'
import { ObligationGantt } from '@/src/components/eu-ai-act/report/ObligationGantt'
import { StatusTally } from '@/src/components/eu-ai-act/report/StatusTally'
import LiveRadarChart from '@/src/components/assessment/LiveRadarChart'
import ArchetypeQuadrant from '@/src/components/assessment/ArchetypeQuadrant'
import { InsurtechLiveCallQa } from '@/src/components/product-mocks'
import { reportRows, statusTally } from '@/src/lib/eu-ai-act/report'
import { ARCHETYPES } from '@/src/lib/assessment/scoring'
import { NORTHWIND_COMPANY, northwindProfile } from '@/scripts/eu-ai-act-report/northwind'

export function GalleryRail({ chapters }: { chapters: readonly Chapter[] }) {
  return <ChapterRail chapters={chapters} label="Kit components" top={88} />
}

/* ReelStage ---------------------------------------------------------------------------------- */

const DEMO_CLIPS = [
  { id: 'meeting', label: 'Team meeting', mp4: '/assets/eu-ai-act/video/eu-team-meeting.mp4', webm: '/assets/eu-ai-act/video/eu-team-meeting.webm', poster: '/assets/eu-ai-act/video/eu-team-meeting-poster.webp', duration: '0:12' },
  { id: 'hiring', label: 'Hiring review', mp4: '/assets/eu-ai-act/video/eu-hiring-cv.mp4', webm: '/assets/eu-ai-act/video/eu-hiring-cv.webm', poster: '/assets/eu-ai-act/video/eu-hiring-cv-poster.webp', duration: '0:10' },
  { id: 'rooftops', label: 'Brussels', mp4: '/assets/eu-ai-act/video/eu-brussels-rooftops.mp4', webm: '/assets/eu-ai-act/video/eu-brussels-rooftops.webm', poster: '/assets/eu-ai-act/video/eu-brussels-rooftops-poster.webp', duration: '0:09' },
] as const

export function ReelStageDemo() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
      <div>
        <p className="label-mono text-ink-tertiary">Demo hero, demo copy</p>
        <h3 className="mt-4 max-w-[14ch] font-display font-semibold text-ink" style={{ fontSize: 'clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem)', lineHeight: 1.06, letterSpacing: '-0.03em' }}>
          Ten days. One <span className="font-serif-accent">working</span> product.
        </h3>
        <p className="mt-5 max-w-[42ch] text-ink-secondary">The headline paints first. The reel loads its poster, then waits until it is half in view before fetching any video.</p>
      </div>
      <ReelStage clips={DEMO_CLIPS} title="Demo reel" captionNote="Demo footage (16:9 stand-ins). Approved reels carry burned-in captions." />
    </div>
  )
}

/* DeliverablePreview -------------------------------------------------------------------------- */

const profile = northwindProfile()
const rows = reportRows(profile)
const tally = statusTally(rows)

export function PaperPreviewDemo() {
  return (
    <DeliverablePreview
      variant="paper"
      label="Sample EU AI Act readiness report"
      title="EU AI Act readiness report"
      beats={[
        { id: 'cover', label: 'Cover', callouts: [{ label: 'Dated to the day', x: 10, y: 90, side: 'left' }] },
        { id: 'score', label: 'Score', callouts: [{ label: 'One score, three bands', x: 8, y: 36, side: 'left' }, { label: 'Every obligation, by status', x: 88, y: 66, side: 'right' }] },
        { id: 'findings', label: 'Findings', callouts: [{ label: 'Today, on the same axis', x: 60.5, y: 22, side: 'right' }] },
      ]}
    >
      <article className="flex min-h-[900px] flex-col">
        <p className="label-mono text-ink-tertiary">Sample report</p>
        <h4 className="mt-28 max-w-[14ch] font-display font-semibold text-ink" style={{ fontSize: 56, lineHeight: 1.02, letterSpacing: '-0.03em' }}>
          EU AI Act readiness
        </h4>
        <p className="mt-6 text-ink-secondary" style={{ fontSize: 22 }}>{NORTHWIND_COMPANY.name}</p>
        <div className="mt-auto grid grid-cols-3 gap-6 border-t border-line pt-6">
          <Meta k="Assessed" v={profile.asOf} />
          <Meta k="Role" v="Deployer" />
          <Meta k="Tier" v="High-risk" />
        </div>
      </article>
      <article className="space-y-10">
        <p className="label-mono text-ink-tertiary">Readiness</p>
        <div className="grid grid-cols-[300px_1fr] items-center gap-10">
          <div className="rounded-2xl bg-[#003399] p-6">
            <ReadinessGauge score={profile.readinessScore} level={profile.readinessLevel} />
          </div>
          <div>
            <p className="label-mono text-ink-tertiary">Band</p>
            <p className="mt-2 font-display font-semibold text-ink" style={{ fontSize: 34, lineHeight: 1.1 }}>
              {profile.readinessLevel[0].toUpperCase() + profile.readinessLevel.slice(1)}
            </p>
            <p className="mt-3 text-ink-secondary" style={{ fontSize: 16, lineHeight: 1.5 }}>
              {profile.sectionScores.filter((x) => x.score !== null).length} control areas scored. The weakest sets the first 90 days.
            </p>
          </div>
        </div>
        <StatusTally tally={tally} />
      </article>
      <article>
        <p className="label-mono mb-6 text-ink-tertiary">Obligations on one time axis</p>
        <ObligationGantt rows={rows} today={profile.asOf} />
      </article>
    </DeliverablePreview>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="label-mono text-ink-tertiary">{k}</p>
      <p className="tabular mt-1 text-ink" style={{ fontSize: 16 }}>{v}</p>
    </div>
  )
}

const DIMENSIONS = [
  { dimension: 'Leadership & Strategy', score: 68, weight: 1 },
  { dimension: 'Data Readiness', score: 41, weight: 1 },
  { dimension: 'Technology Infrastructure', score: 57, weight: 1 },
  { dimension: 'Talent & Capability', score: 36, weight: 1 },
  { dimension: 'Governance & Responsible AI', score: 49, weight: 1 },
  { dimension: 'Culture & Change Readiness', score: 62, weight: 1 },
]

export function AppPreviewDemo() {
  return (
    <DeliverablePreview
      variant="app"
      label="Sample AI readiness assessment"
      title="AI readiness assessment"
      beats={[
        { id: 'radar', label: 'Profile', callouts: [{ label: 'Six dimensions, live', x: 62, y: 30, side: 'right' }] },
        { id: 'archetype', label: 'Archetype', callouts: [{ label: 'Vision against operations', x: 70, y: 50, side: 'right' }] },
        { id: 'metrics', label: 'Summary' },
      ]}
    >
      <div className="grid grid-cols-2 gap-8">
        <LiveRadarChart dimensionScores={DIMENSIONS} predictedArchetype={ARCHETYPES.VisionaryArchitect} totalAnswered={18} />
        <LiveRadarChart dimensionScores={DIMENSIONS.map((d) => ({ ...d, score: Math.min(100, d.score + 14) }))} predictedArchetype={ARCHETYPES.ApexIntegrator} totalAnswered={30} />
      </div>
      <div className="mx-auto max-w-[520px]">
        <ArchetypeQuadrant axisScores={{ vision: 60, ops: 45 }} predictedArchetype={ARCHETYPES.VisionaryArchitect} totalAnswered={30} />
      </div>
      <div className="pt-10">
        <ProofMetricRow maxColumns={3} source="Sample answers, not a client">
          <ProofMetric value="52" unit="/100" label="Overall readiness" />
          <ProofMetric value="6" label="Dimensions scored" />
          <ProofMetric value="3" label="Blockers to clear first" />
        </ProofMetricRow>
      </div>
    </DeliverablePreview>
  )
}

/* ProofMetric -------------------------------------------------------------------------------- */

export function ProofMetricDemo() {
  return (
    <div className="flex flex-col gap-12">
      <ProofMetricRow maxColumns={4} label="Sample proof" source="Sample figures for the gallery">
        <ProofMetric value="12" unit="weeks" label="Kickoff to handover" />
        <ProofMetric value="100+" label="People trained in the pilot cohort" />
        <ProofMetric prefix="EUR" value="35" unit="m" label="Top fine for a prohibited practice" source="Art. 99(3)" />
        <ProofMetric value="4" label="Acceptance gates your team signs" />
      </ProofMetricRow>
      <div>
        <p className="label-mono mb-3 text-ink-tertiary">Same row in a 340px column: two columns, not four squeezed ones</p>
        <div className="max-w-[340px] rounded-xl border border-dashed border-line p-0">
          <ProofMetricRow maxColumns={4}>
            <ProofMetric value="12" unit="weeks" label="Kickoff to handover" />
            <ProofMetric value="100+" label="People trained" />
            <ProofMetric prefix="EUR" value="35" unit="m" label="Top fine" />
            <ProofMetric value="4" label="Gates" />
          </ProofMetricRow>
        </div>
      </div>
    </div>
  )
}

/* DistinctProductFrame ------------------------------------------------------------------------ */

export function ProductFrameDemo() {
  return (
    <div className="flex flex-col gap-16">
      <ProductToggle
        label="Choose a product"
        items={[
          {
            id: 'qa',
            label: 'Call QA desk',
            audience: 'For an insurer’s contact center. Desktop app, violet.',
            content: (
              <DistinctProductFrame chrome="app" accent="violet" density="compact" title="Assist" bleed caption="FIG 1 / Live call QA, scored as the call runs">
                <div className="h-[420px]">
                  <InsurtechLiveCallQa />
                </div>
              </DistinctProductFrame>
            ),
          },
          {
            id: 'viewings',
            label: 'Viewing planner',
            audience: 'For a property agent on the move. Phone, teal.',
            content: (
              <DistinctProductFrame chrome="phone" accent="teal" title="9:41" caption="FIG 2 / Viewings, confirmed from the inbox">
                <PhoneDemo />
              </DistinctProductFrame>
            ),
          },
        ]}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <DistinctProductFrame chrome="browser" accent="violet" title="app.example.com/reviews" caption="browser, violet, comfortable">
          <FrameFill accent="violet" />
        </DistinctProductFrame>
        <DistinctProductFrame chrome="terminal" accent="teal" density="compact" title="build log" caption="terminal, teal, compact">
          <pre className="whitespace-pre-wrap text-[12.5px] leading-6">
            <span className="text-white/45">$ </span>sprint ship --env pilot{'\n'}
            <span className="text-white/45">  </span>tests passed{'\n'}
            <span className="text-white/45">  </span>handover notes written{'\n'}
            <span style={{ color: 'var(--pf-accent)' }}>  shipped</span>
          </pre>
        </DistinctProductFrame>
      </div>
    </div>
  )
}

function FrameFill({ accent }: { accent: 'violet' | 'teal' }) {
  return (
    <div className="space-y-3">
      <p className="label-mono" style={{ color: `var(--lk-${accent}-text)` }}>Frame content slot</p>
      <p className="type-sm max-w-[40ch] text-ink-secondary">Real product components go here. The frame adds chrome, accent and density only.</p>
    </div>
  )
}

function PhoneDemo() {
  const items = [
    ['10:30', 'Flat 3B, Lindenstrasse', 'Confirmed'],
    ['12:00', 'House, Am Hang 4', 'Confirmed'],
    ['15:15', 'Loft, Hafenkante', 'Waiting'],
  ] as const
  return (
    <div className="space-y-3 pt-2">
      <p className="font-display font-semibold text-ink" style={{ fontSize: 20, lineHeight: 1.2 }}>Today</p>
      {items.map(([t, place, state]) => (
        <div key={t} className="rounded-2xl border border-line-subtle p-3">
          <p className="label-mono tabular text-ink-tertiary">{t}</p>
          <p className="mt-1 font-medium text-ink" style={{ fontSize: 14, lineHeight: 1.3 }}>{place}</p>
          <p className="mt-1" style={{ fontSize: 12, lineHeight: 1.3, color: state === 'Confirmed' ? 'var(--pf-accent-text)' : 'var(--text-tertiary)' }}>{state}</p>
        </div>
      ))}
    </div>
  )
}

/* ProblemSequence ----------------------------------------------------------------------------- */

const PLATES = [
  { src: '/assets/imagery/sprint/sprint-hands-keyboard.webp', fig: 'FIG 1' },
  { src: '/assets/imagery/sprint/sprint-whiteboard-team.webp', fig: 'FIG 2' },
  { src: '/assets/imagery/sprint/sprint-track-workflow.webp', fig: 'FIG 3' },
  { src: '/assets/imagery/sprint/sprint-prototype-laptop.webp', fig: 'FIG 4' },
] as const

function Plate({ i, caption }: { i: number; caption: string }) {
  return (
    <figure className="m-0 w-full max-w-[260px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-line-subtle">
        <Image src={PLATES[i].src} alt="" fill sizes="260px" className="object-cover" />
      </div>
      <figcaption className="label-mono mt-2 text-ink-tertiary">
        {PLATES[i].fig} / {caption}
      </figcaption>
    </figure>
  )
}

export function ProblemSequenceDemo() {
  return (
    <ProblemSequence
      label="Sample problem sequence"
      lines={[
        { text: 'The pilot that never left the pilot.', visual: <Plate i={0} caption="week 9, still a pilot" /> },
        { text: 'The strategy deck nobody builds from.', visual: <Plate i={1} caption="the workshop wall" /> },
        { text: 'The tool nobody opens after launch.', visual: <Plate i={2} caption="login count, month 3" /> },
      ]}
      close={{ text: 'One working build your team runs.', visual: <Plate i={3} caption="day 10, shipped" /> }}
    />
  )
}

/* GateCard ----------------------------------------------------------------------------------- */

export function GateCardDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <GateCard gate={1} when="Week 2" title="Baseline agreed" criteria={['Readiness evidence reviewed with the sponsor', 'Three workflows chosen and owned', 'Success measures written down']} signedBy="Your sponsor" />
      <GateCard gate={2} when="Week 6" title="Pilot runs in production" criteria={['Workflow live for one team', 'Owner trained and on call', 'Risk review signed']} signedBy="Your COO" />
      <GateCard gate={3} when="Week 12" title="Handover" criteria={['Runbook in your wiki', 'Two internal owners per workflow', 'Metrics reported for four weeks', 'Next quarter planned']} signedBy="Your leadership team" />
    </div>
  )
}
