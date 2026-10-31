'use client'

import React from 'react'
import {
  BookOpen,
  Database,
  GitBranch,
  Inbox,
  LineChart,
  Mail,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/src/components/prism'
import { ProductAppShell } from '../ProductAppShell'
import { clamp, progress } from '@/src/motion-studio/time'

const NAV = [
  { icon: Inbox, label: 'Inbox' },
  { icon: BookOpen, label: 'Knowledge', active: true },
  { icon: LineChart, label: 'Insights' },
]

const CANONICAL = [
  { q: 'Parking included · Sea-view residential', status: 'Published', lang: 'ES/EN', uses: 842 },
  { q: 'Community fee disclosure template', status: 'Review', lang: 'Multi', uses: 614 },
  { q: 'Viewing cancellation policy · EU', status: 'Published', lang: 'EN', uses: 391 },
]

const TRAINING_QUEUE = [
  { source: 'Historical email batch · Q3 2024', items: 48, state: 'Processing' },
  { source: 'Expert override · Senior advisor', items: 3, state: 'Ready' },
  { source: 'Client thread · #8842', items: 1, state: 'Promoted' },
]

/**
 * Simple force-directed-style graph as SVG. `assemble` (0..1) builds it node by
 * node with edges drawing in; 1 (the default) is the settled graph.
 */
function KnowledgeGraph({ assemble = 1 }: { assemble?: number }) {
  const nodes = [
    { id: 'expert', x: 50, y: 28, label: 'Expert corpus', size: 14 },
    { id: 'email', x: 18, y: 55, label: 'Email archive', size: 11 },
    { id: 'canonical', x: 50, y: 72, label: 'Canonical answers', size: 16 },
    { id: 'lang', x: 82, y: 50, label: 'Language layer', size: 12 },
    { id: 'pii', x: 30, y: 38, label: 'PII filter', size: 9 },
    { id: 'rag', x: 70, y: 68, label: 'RAG retrieval', size: 13 },
  ]
  const edges = [
    ['expert', 'canonical'],
    ['email', 'pii'],
    ['pii', 'canonical'],
    ['canonical', 'lang'],
    ['canonical', 'rag'],
    ['lang', 'rag'],
  ]
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      {edges.map(([a, b], i) => {
        const na = byId[a]
        const nb = byId[b]
        if (!na || !nb) return null
        const drawn = progress(assemble, 0.3 + i * 0.1, 0.55 + i * 0.1)
        return (
          <line
            key={`${a}-${b}`}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke="rgba(124,58,237,0.22)"
            strokeWidth={0.6}
            pathLength={1}
            strokeDasharray={drawn < 1 ? 1 : undefined}
            strokeDashoffset={drawn < 1 ? 1 - drawn : undefined}
          />
        )
      })}
      {nodes.map((n, i) => {
        const on = progress(assemble, i * 0.08, 0.3 + i * 0.08)
        return (
        <g
          key={n.id}
          opacity={on}
          transform={on < 1 ? `translate(${n.x} ${n.y}) scale(${0.6 + 0.4 * on}) translate(${-n.x} ${-n.y})` : undefined}
        >
          <circle
            cx={n.x}
            cy={n.y}
            r={n.size / 2}
            fill={
              n.id === 'canonical'
                ? 'url(#graphGrad)'
                : n.id === 'rag'
                  ? 'rgba(45,212,191,0.35)'
                  : 'rgba(124,58,237,0.18)'
            }
            stroke={n.id === 'canonical' ? 'var(--violet)' : 'rgba(124,58,237,0.35)'}
            strokeWidth={0.5}
          />
          <text
            x={n.x}
            y={n.y + n.size / 2 + 4}
            textAnchor="middle"
            className="fill-[rgba(15,15,17,0.55)]"
            style={{ fontSize: 3.2, fontFamily: 'system-ui' }}
          >
            {n.label}
          </text>
        </g>
        )
      })}
      <defs>
        <linearGradient id="graphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.45} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface ProptechKnowledgeStudioProps {
  /** 0..1: the graph assembles node by node. Defaults to the settled still. */
  graphProgress?: number
}

export function ProptechKnowledgeStudio({ graphProgress = 1 }: ProptechKnowledgeStudioProps = {}) {
  return (
    <ProductAppShell productName="Client assistant" clientBadge="Knowledge studio" nav={NAV}>
      <div className="flex h-full">
        <div className="flex w-[58%] flex-col border-r border-line-subtle">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-2" data-focus="answers">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-brand-violet-strong" />
              <span className="text-[11px] font-semibold text-ink">Knowledge graph</span>
            </div>
            <Badge tint="violet" size="sm">
              261 canonical
            </Badge>
          </div>
          <div className="relative flex-1 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.06),transparent_55%)] p-4">
            <KnowledgeGraph assemble={clamp(graphProgress)} />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-line-subtle bg-surface-frost px-3 py-2">
            {[
              { label: 'Email threads ingested', value: '4.2k' },
              { label: 'Languages', value: '6' },
              { label: 'Avg. grounding score', value: '96%' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-line-subtle bg-white px-2 py-1.5 text-center">
                <p className="text-sm font-semibold text-ink">{s.value}</p>
                <p className="text-[9px] text-ink-tertiary">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-line-subtle px-3 py-2">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-brand-cyan-strong" />
              <span className="text-[11px] font-semibold text-ink">Training & canonical answers</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Canonical library
            </p>
            <ul className="space-y-2">
              {CANONICAL.map((row) => (
                <li
                  key={row.q}
                  className="rounded-lg border border-line-subtle bg-white px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-medium text-ink">{row.q}</p>
                    <Badge tint={row.status === 'Published' ? 'emerald' : 'amber'} size="sm">
                      {row.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[9px] text-ink-tertiary">
                    {row.lang} · {row.uses} retrievals
                  </p>
                </li>
              ))}
            </ul>

            <p className="mb-2 mt-4 text-[9px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Historical training queue
            </p>
            <ul className="space-y-1.5">
              {TRAINING_QUEUE.map((row) => (
                <li
                  key={row.source}
                  className="flex items-center justify-between rounded-lg border border-line-subtle px-2.5 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Mail className="h-3 w-3 shrink-0 text-ink-tertiary" />
                    <div className="min-w-0">
                      <p className="truncate text-[10px] text-ink-secondary">{row.source}</p>
                      <p className="text-[9px] text-ink-tertiary">{row.items} items</p>
                    </div>
                  </div>
                  <Badge
                    tint={row.state === 'Promoted' ? 'emerald' : row.state === 'Ready' ? 'cyan' : 'neutral'}
                    size="sm"
                  >
                    {row.state}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line-subtle px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-violet-strong" />
              <p className="text-[10px] text-ink-secondary">
                Promote expert-approved drafts into canonical answers, one click from any thread.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProductAppShell>
  )
}
