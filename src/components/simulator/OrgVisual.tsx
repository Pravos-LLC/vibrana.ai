'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import type { SimulatorResult } from '@/src/lib/simulator/types'
import { formatAbout } from '@/src/lib/simulator/format'
import { SIM_DASH, SIM_FUNCTION_SHORT } from '@/src/simulator-content'
import { NODE_ICON } from './dept'
import { RangeInput } from './RangeInput'
import { BRAIN, DOT_IDLE, GROWTH, HALO, VIEW, buildLayout, frameState, type Layout } from './org-layout'

const AIOS_MARK = '/brand/aios-mark.svg'

const c = SIM_DASH.efficiency
const TICKS = [0, 3, 6, 12, 18, 24]
const PLAY_MS = 11_000
const EASE = [0.22, 1, 0.36, 1] as const

const r2 = (v: number) => Math.round(v * 100) / 100

type SceneProps = {
  result: SimulatorResult
  layout: Layout
  month: number
  animated: boolean
  growthLabel: string
  /** Shows an agent node for each live workflow. */
  agents?: boolean
  /** No labels: the hero preview and small multiples. */
  bare?: boolean
}

/** The SVG itself. A pure function of (result, month): the same picture on screen, in the fallback and on the card. */
export function OrgScene({ result, layout, month, animated, growthLabel, agents = false, bare = false }: SceneProps) {
  const reduce = useReduced()
  const s = frameState(result, layout, month)
  const t = animated ? { duration: 0.5, ease: EASE } : { duration: 0 }
  const dotTransition = animated ? 'fill 450ms ease' : undefined

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label={`${c.month(Math.round(month))}: ${formatAbout(s.totalHours)} ${c.kpiUnit}`}
    >
      <defs>
        <radialGradient id="sim-brain-layer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.16} />
          <stop offset="55%" stopColor="#3b82f6" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sim-link" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Halos: area grows with hours freed (labeled in hours, never people). */}
      {layout.clusters.map((cl) => (
        <motion.circle
          key={`halo-${cl.id}`}
          cx={cl.cx}
          cy={cl.cy}
          initial={false}
          animate={{ r: r2(s.haloR[cl.id]), opacity: s.hours[cl.id] > 0 ? 1 - 0.5 * s.drift : 0 }}
          transition={t}
          fill={HALO.fill}
          stroke={HALO.stroke}
          strokeDasharray="3 4"
          strokeWidth={1}
        />
      ))}

      {/* A line from every team to the brain: knowledge goes in on one lane and comes back on the other. */}
      {layout.clusters.map((cl, k) => {
        const sp = layout.spokes[k]
        const st = s.spokes[k]
        return (
          <g key={`spoke-${cl.id}`}>
            <motion.path d={sp.path} fill="none" stroke="url(#sim-link)" strokeLinecap="round" initial={false} animate={{ opacity: st.opacity, strokeWidth: st.width }} transition={t} />
            <motion.path d={sp.backPath} fill="none" stroke="url(#sim-link)" strokeLinecap="round" strokeDasharray="2 5" initial={false} animate={{ opacity: st.opacity * 0.7, strokeWidth: st.width }} transition={t} />
            {animated && st.flow > 0 && !reduce && (
              <>
                <circle r={2.6} fill={cl.color}>
                  <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${(k * 0.37) % 2.6}s`} path={sp.path} />
                </circle>
                <circle r={2.6} fill="#7c3aed">
                  <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${(k * 0.37 + 1.3) % 2.6}s`} path={sp.backPath} />
                </circle>
              </>
            )}
          </g>
        )
      })}

      {/* Agents: one per live workflow, sitting on the line between a team and the brain. */}
      {agents &&
        layout.agentSlots.map((slots, k) =>
          slots.slice(0, s.agents[k]).map((a, j) => (
            <g key={`agent-${k}-${j}`}>
              <line x1={a.x} y1={a.y} x2={layout.clusters[k].cx} y2={layout.clusters[k].cy} stroke={layout.clusters[k].color} strokeOpacity={0.35} strokeDasharray="2 3" />
              <line x1={a.x} y1={a.y} x2={BRAIN.x} y2={BRAIN.y} stroke="#7c3aed" strokeOpacity={0.3} strokeDasharray="2 3" />
              <rect x={a.x - 4.5} y={a.y - 4.5} width={9} height={9} rx={2} transform={`rotate(45 ${a.x} ${a.y})`} fill={layout.clusters[k].color} fillOpacity={0.92} />
            </g>
          )),
        )}

      {/* Company brain: a node in the middle, always fully visible, with the AIOS mark. */}
      <g>
        <circle cx={BRAIN.x} cy={BRAIN.y} r={BRAIN.r + 52} fill="url(#sim-brain-layer)" />
        <motion.circle cx={BRAIN.x} cy={BRAIN.y} r={BRAIN.r + 10} fill="none" stroke="url(#sim-link)" strokeWidth={1.2} strokeDasharray="1 5" strokeLinecap="round" initial={false} animate={{ opacity: 0.35 + 0.5 * s.brain }} transition={t} />
        <circle cx={BRAIN.x} cy={BRAIN.y} r={BRAIN.r} className="fill-surface-base" stroke="#7c3aed" strokeOpacity={0.55} strokeWidth={1.6} />
        <image href={AIOS_MARK} x={BRAIN.x - 27} y={BRAIN.y - 27} width={54} height={54} />
        {!bare && (
          <text x={BRAIN.x} y={BRAIN.y + BRAIN.r + 26} textAnchor="middle" className="fill-ink max-md:hidden" style={{ fontSize: 13, fontWeight: 600 }}>
            {c.brain}
          </text>
        )}
      </g>

      {/* Freed hours drifting toward capacity for growth. */}
      {s.drift > 0 &&
        layout.clusters.map((cl) =>
          s.hours[cl.id] > 0 ? (
            <line key={`drift-${cl.id}`} x1={cl.cx} y1={cl.cy} x2={GROWTH.x} y2={GROWTH.y} stroke={HALO.stroke} strokeOpacity={0.3 * s.drift} strokeDasharray="2 6" />
          ) : null,
        )}

      {/* People. Every dot stays, every month. */}
      {layout.clusters.map((cl) => (
        <g key={cl.id}>
          {cl.dots.map((d, i) => {
            const isLit = d.order < s.lit[cl.id]
            const isBuilder = d.order < s.builders[cl.id]
            return (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={isBuilder ? r2(layout.dotR * 0.62) : layout.dotR}
                fill={isLit ? cl.color : DOT_IDLE}
                style={{ transition: dotTransition }}
              />
            )
          })}
          {cl.dots
            .filter((d) => d.order < s.builders[cl.id])
            .map((d, i) => (
              <circle key={`b-${i}`} cx={d.x} cy={d.y} r={r2(layout.dotR + 1.6)} fill="none" stroke={cl.color} strokeWidth={1.2} />
            ))}
          {!bare && <ClusterLabel cl={cl} haloR={s.haloR[cl.id]} hours={s.hours[cl.id]} />}
        </g>
      ))}

      {/* Capacity for growth. */}
      <motion.g initial={false} animate={{ opacity: s.drift > 0 ? 1 : 0 }} transition={t}>
        <motion.circle cx={GROWTH.x} cy={GROWTH.y} initial={false} animate={{ r: r2(Math.max(8, s.growthR)) }} transition={t} fill="rgba(22,163,74,0.12)" stroke={HALO.stroke} strokeWidth={1.4} />
        {!bare && (
          <g className="max-md:hidden">
            <text x={GROWTH.x} y={GROWTH.y - Math.max(8, s.growthR) - 26} textAnchor="middle" className="fill-ink" style={{ fontSize: 14, fontWeight: 600 }}>
              {growthLabel}
            </text>
            <text x={GROWTH.x} y={GROWTH.y - Math.max(8, s.growthR) - 9} textAnchor="middle" style={{ fontSize: 13, fill: HALO.text, fontWeight: 600 }}>
              {`${formatAbout(s.totalHours * s.drift)} ${SIM_DASH.departments.hours}`}
            </text>
          </g>
        )}
      </motion.g>
    </svg>
  )
}

function ClusterLabel({ cl, haloR, hours }: { cl: Layout['clusters'][number]; haloR: number; hours: number }) {
  const Icon = NODE_ICON[cl.id]
  const cos = Math.cos(cl.outward)
  const sin = Math.sin(cl.outward)
  const dist = Math.max(haloR, cl.r) + 14
  const name = SIM_FUNCTION_SHORT[cl.id]
  // Icon sits inline, left of the name; the name's width is estimated from its length (14px semibold).
  const nameW = name.length * 8.2
  const block = nameW + 22
  const ax = cl.cx + dist * cos
  const left = Math.abs(cos) < 0.3 ? ax - block / 2 : cos > 0 ? ax : ax - block
  const x = r2(left + 22)
  const y = r2(Math.max(30, Math.min(VIEW.height - 34, cl.cy + dist * sin + (sin < -0.3 ? -22 : sin > 0.3 ? 10 : -6))))
  return (
    <g className="max-md:hidden">
      <Icon x={r2(left)} y={r2(y - 13)} width={16} height={16} color={cl.color} strokeWidth={2} aria-hidden />
      <text x={x} y={y} textAnchor="start" style={{ fontSize: 14 }}>
        <tspan className="fill-ink" style={{ fontWeight: 600 }}>{name}</tspan>
        {hours >= 1 && (
          <tspan x={x} dy={17} style={{ fill: HALO.text, fontSize: 12.5, fontWeight: 500 }}>
            {`${formatAbout(hours)} ${SIM_DASH.departments.hours}`}
          </tspan>
        )}
      </text>
    </g>
  )
}

/** Picks the reduced-motion preference after mount: the server can't know it, and a different first render would not hydrate. */
function useReduced() {
  const prefersReduced = useReducedMotion()
  const [reduce, setReduce] = useState(false)
  useEffect(() => setReduce(Boolean(prefersReduced)), [prefersReduced])
  return reduce
}

/** A still frame for previews (the hero sample, small multiples). */
export function OrgStill({ result, month, growthLabel }: { result: SimulatorResult; month: number; growthLabel: string }) {
  const layout = useMemo(() => buildLayout(result), [result])
  return <OrgScene result={result} layout={layout} month={month} animated={false} growthLabel={growthLabel} bare />
}

export function OrgVisual({ result, growthLabel }: { result: SimulatorResult; growthLabel: string }) {
  const reduce = useReduced()
  const layout = useMemo(() => buildLayout(result), [result])
  const [month, setMonth] = useState(12)
  const [playing, setPlaying] = useState(false)
  const [agents, setAgents] = useState(false)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    const start = performance.now() - (month >= 24 ? 0 : (month / 24) * PLAY_MS)
    const step = (now: number) => {
      const m = Math.min(24, ((now - start) / PLAY_MS) * 24)
      setMonth(m)
      if (m < 24) raf.current = requestAnimationFrame(step)
      else setPlaying(false)
    }
    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start month is read once per play
  }, [playing])

  if (reduce) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 3, 12, 24].map((m, i) => (
          <figure key={m} className="rounded-xl border border-line-subtle p-3">
            <OrgScene result={result} layout={layout} month={m} animated={false} growthLabel={growthLabel} agents={agents} bare />
            <figcaption className="mt-2 px-1">
              <p className="type-sm font-semibold text-ink">
                {c.month(m)}: {c.frames[i].title}
              </p>
              <p className="mt-0.5 type-xs text-ink-secondary">{c.frames[i].body}</p>
            </figcaption>
          </figure>
        ))}
        <div className="md:col-span-2">
          <Legend layout={layout} agents={agents} />
        </div>
      </div>
    )
  }

  const s = frameState(result, layout, month)
  const frame = c.frames[s.frame]
  const rounded = Math.round(month)

  return (
    <div>
      <p className="font-display type-sm font-semibold text-ink">
        <span className="tabular-nums text-ink-tertiary">{c.month(rounded)}</span>
        <span className="mx-2 text-ink-tertiary" aria-hidden>
          /
        </span>
        {frame.title}
      </p>

      <div className="mt-2">
        <OrgScene result={result} layout={layout} month={month} animated growthLabel={growthLabel} agents={agents} />
      </div>

      <div className="mt-1 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            if (!playing && month >= 24) setMonth(0)
            setPlaying((p) => !p)
          }}
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-ink transition-[border-color,transform] hover:border-brand-violet active:scale-95"
          aria-label={playing ? c.pause : c.play}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="relative flex-1">
          <RangeInput
            min={0}
            max={24}
            step={1}
            value={rounded}
            onChange={(v) => {
              setPlaying(false)
              setMonth(v)
            }}
            label={c.scrub}
            valueText={c.month(rounded)}
          />
          <div className="pointer-events-none relative mt-1 h-4">
            {TICKS.map((tick) => (
              <span key={tick} className="absolute -translate-x-1/2 type-xs text-ink-tertiary tabular-nums" style={{ left: `${(tick / 24) * 100}%` }}>
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={agents}
          onClick={() => setAgents((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 type-xs font-medium transition-colors ${agents ? 'border-brand-violet bg-[rgba(124,58,237,0.08)] text-ink' : 'border-line text-ink-secondary hover:text-ink'}`}
        >
          <svg width="12" height="12" aria-hidden>
            <rect x="3" y="3" width="6" height="6" rx="1.2" transform="rotate(45 6 6)" fill="#7c3aed" />
          </svg>
          {c.agents.toggle}
        </button>
        {agents && <p className="type-xs text-ink-tertiary">{c.agents.note}</p>}
      </div>
      <Legend layout={layout} agents={agents} />
    </div>
  )
}

function Legend({ layout, agents }: { layout: Layout; agents: boolean }) {
  return (
    <div className="mt-4 space-y-3">
      {/* Teams: on small screens the picture drops its labels, so this carries them. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-2 type-xs text-ink-secondary">
        {layout.clusters.map((cl) => {
          const Icon = NODE_ICON[cl.id]
          return (
            <li key={cl.id} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" style={{ color: cl.color }} aria-hidden />
              {SIM_FUNCTION_SHORT[cl.id]}
            </li>
          )
        })}
      </ul>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 type-xs text-ink-tertiary">
        <li className="flex items-center gap-2">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="4" fill="#7c3aed" />
          </svg>
          {c.dotLegend(layout.peoplePerDot)}
        </li>
        <li className="flex items-center gap-2">
          <svg width="14" height="14" aria-hidden>
            <circle cx="7" cy="7" r="3" fill="#2563eb" />
            <circle cx="7" cy="7" r="5.6" fill="none" stroke="#2563eb" strokeWidth="1.2" />
          </svg>
          {c.builderLegend}
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="10" aria-hidden>
            <path d="M1 8 Q11 0 21 8" fill="none" stroke="#6d28d9" strokeWidth="1.6" strokeOpacity="0.6" />
          </svg>
          {c.linkLegend}
        </li>
        {agents && (
          <li className="flex items-center gap-2">
            <svg width="14" height="14" aria-hidden>
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" transform="rotate(45 7 7)" fill="#7c3aed" />
            </svg>
            {c.agents.legend}
          </li>
        )}
      </ul>
    </div>
  )
}
