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
      <ReelStage
        clips={DEMO_CLIPS}
        title="Demo reel"
        playLabel="Watch"
        caption="FIG 1 / Stand-in clips until the approved reels are encoded."
        captionNote="Demo footage. Approved reels carry burned-in captions."
      />
    </div>
  )
}

/* DeliverablePreview -------------------------------------------------------------------------- */

const profile = northwindProfile()
const rows = reportRows(profile)
const tally = statusTally(rows)

/* In the stacked (phone) view the beats reflow at reading size instead of keeping the A4 grid:
   the `[[data-dp-mode=stacked]_&]:` variant. Written out in full so Tailwind can see each class. */

export function PaperPreviewDemo() {
  return (
    <DeliverablePreview
      variant="paper"
      label="Sample EU AI Act readiness report"
      title="EU AI Act readiness report"
      beats={[
        { id: 'cover', label: 'Cover', callouts: [{ label: 'Dated to the day', target: 'assessed', side: 'left' }] },
        {
          id: 'score',
          label: 'Score',
          callouts: [
            { label: 'One score, three bands', target: 'gauge', side: 'left' },
            { label: 'Every obligation, by status', target: 'tally', side: 'right', y: 30 },
          ],
        },
        // The today line sits at the assessment date on the Gantt's 2025 to 2028 axis.
        { id: 'findings', label: 'Findings', callouts: [{ label: 'Today, on the same axis', target: 'gantt', side: 'right', x: 62, y: 14 }] },
      ]}
    >
      <article className={`flex min-h-[900px] flex-col [[data-dp-mode=stacked]_&]:min-h-0`}>
        <p className="label-mono text-ink-tertiary">Sample report</p>
        <h4 className={`mt-28 max-w-[14ch] font-display font-semibold text-ink [[data-dp-mode=stacked]_&]:mt-8`} style={{ fontSize: 'clamp(2rem, 6cqi + 1rem, 3.5rem)', lineHeight: 1.04, letterSpacing: '-0.03em' }}>
          EU AI Act readiness
        </h4>
        <p className="mt-6 text-ink-secondary" style={{ fontSize: 20 }}>{NORTHWIND_COMPANY.name}</p>
        <div className={`mt-auto grid grid-cols-3 gap-6 border-t border-line pt-6 [[data-dp-mode=stacked]_&]:mt-10 [[data-dp-mode=stacked]_&]:gap-3`}>
          <Meta k="Assessed" v={profile.asOf} callout="assessed" />
          <Meta k="Role" v="Deployer" />
          <Meta k="Tier" v="High-risk" />
        </div>
      </article>
      <article className="space-y-10">
        <p className="label-mono text-ink-tertiary">Readiness</p>
        <div className={`grid grid-cols-[300px_1fr] items-center gap-10 [[data-dp-mode=stacked]_&]:grid-cols-1 [[data-dp-mode=stacked]_&]:gap-6`}>
          <div data-callout="gauge" className="rounded-2xl bg-[#003399] p-6">
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
        <div data-callout="tally">
          <StatusTally tally={tally} />
        </div>
      </article>
      <article>
        <p className="label-mono mb-6 text-ink-tertiary">Obligations on one time axis</p>
        <div data-callout="gantt">
          <ObligationGantt rows={rows} today={profile.asOf} />
        </div>
      </article>
    </DeliverablePreview>
  )
}

function Meta({ k, v, callout }: { k: string; v: string; callout?: string }) {
  return (
    <div data-callout={callout}>
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

const MOVES = ['Name one owner for data quality', 'Pick two workflows to pilot this quarter', 'Write the review step before the first launch']

export function AppPreviewDemo() {
  const archetype = ARCHETYPES.VisionaryArchitect
  return (
    <DeliverablePreview
      variant="app"
      aspect={0.52}
      label="Sample AI readiness assessment"
      title="AI readiness assessment"
      beats={[
        { id: 'radar', label: 'Profile', callouts: [{ label: 'Six dimensions, live', target: 'radar', side: 'left', x: 8, y: 20 }, { label: 'Every score in plain numbers', target: 'dims', side: 'right' }] },
        { id: 'archetype', label: 'Archetype', callouts: [{ label: 'Vision against operations', target: 'quadrant', side: 'left', x: 0, y: 40 }] },
        { id: 'metrics', label: 'Summary', callouts: [{ label: 'Where to start', target: 'moves', side: 'right', x: 100, y: 20 }] },
      ]}
    >
      <div className={`grid grid-cols-[1.1fr_1fr] items-center gap-10 [[data-dp-mode=stacked]_&]:grid-cols-1 [[data-dp-mode=stacked]_&]:gap-6`}>
        <div data-callout="radar">
          <LiveRadarChart dimensionScores={DIMENSIONS} predictedArchetype={archetype} totalAnswered={30} />
        </div>
        <ol data-callout="dims" className="border-t border-line">
          {DIMENSIONS.map((d) => (
            <li key={d.dimension} className="flex items-baseline justify-between gap-4 border-b border-line-subtle py-3">
              <span className="text-ink-secondary" style={{ fontSize: 15 }}>{d.dimension}</span>
              <span className="tabular font-display font-semibold text-ink" style={{ fontSize: 22 }}>
                {d.score}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className={`grid grid-cols-[minmax(0,460px)_1fr] items-center gap-10 [[data-dp-mode=stacked]_&]:grid-cols-1 [[data-dp-mode=stacked]_&]:gap-6`}>
        <div data-callout="quadrant">
          <ArchetypeQuadrant axisScores={{ vision: 60, ops: 45 }} predictedArchetype={archetype} totalAnswered={30} />
        </div>
        <div>
          <p className="label-mono text-ink-tertiary">Predicted archetype</p>
          <p className="mt-2 font-display font-semibold text-ink" style={{ fontSize: 30, lineHeight: 1.12 }}>{archetype.title}</p>
          <p className="mt-3 text-ink-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>{archetype.hook}.</p>
        </div>
      </div>
      <div className="flex flex-col gap-8 pt-4">
        <ProofMetricRow maxColumns={3} source="Sample answers, not a client">
          <ProofMetric value="52" unit="/100" label="Overall readiness" />
          <ProofMetric value="6" label="Dimensions scored" />
          <ProofMetric value="3" label="Blockers to clear first" />
        </ProofMetricRow>
        <div data-callout="moves">
          <p className="label-mono text-ink-tertiary">First three moves</p>
          <ol className="mt-3 space-y-2">
            {MOVES.map((m, i) => (
              <li key={m} className="flex gap-3 text-ink" style={{ fontSize: 17 }}>
                <span className="label-mono tabular pt-1 text-ink-tertiary">{String(i + 1).padStart(2, '0')}</span>
                {m}
              </li>
            ))}
          </ol>
        </div>
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
              <DistinctProductFrame chrome="app" accent="violet" density="compact" title="Assist" fit={{ width: 960, height: 600 }} caption="FIG 1 / Live call QA, scored as the call runs">
                <InsurtechLiveCallQa />
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
      <GateCard
        gate={2}
        when="Week 6"
        title="Pilot runs in production"
        note="Your COO can stop the pilot here."
        criteria={['Workflow live for one team', 'Owner trained and on call', 'Risk review signed']}
        transfers={['The workflow and its prompts', 'The review checklist']}
        signedBy="Your COO"
      />
      <GateCard
        gate={3}
        when="Week 12"
        title="Handover"
        criteria={['Runbook in your wiki', 'Two internal owners per workflow', 'Metrics reported for four weeks', 'Next quarter planned']}
        transfers={['Runbook, code and dashboards']}
        signedBy="Your leadership team"
      />
    </div>
  )
}
