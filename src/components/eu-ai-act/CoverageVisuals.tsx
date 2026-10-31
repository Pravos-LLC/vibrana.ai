'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CornerDownLeft, Star } from 'lucide-react'
import { LegalCite } from './LegalCite'
import { LoopVideo } from './LoopVideo'
import { cn } from '@/src/components/prism/utils/cn'

const EASE = [0.23, 1, 0.32, 1] as const

type Role = { title: string; body: string; findings: readonly string[] }
type Flow = { builds: string; uses: string; system: string; repurpose: string; findings: readonly string[] }

/** A connector that draws itself left to right, with a label riding above it. */
function Connector({ label, delay }: { label: string; delay: number }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-3 lg:py-0">
      <span className="mb-2 max-w-[9rem] text-center text-xs font-medium leading-4 text-ink-secondary">{label}</span>
      <div className="relative h-px w-full">
        <motion.span
          className="absolute inset-0 origin-left bg-line-strong"
          initial={{ scaleX: reduce ? 1 : 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '0px 0px -15% 0px' }}
          transition={{ duration: 0.9, delay, ease: EASE }}
        />
        <ArrowRight aria-hidden className="absolute -right-1 -top-[7px] h-3.5 w-3.5 text-ink-tertiary" />
      </div>
    </div>
  )
}

function RoleCard({ role, accent, className }: { role: Role; accent?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border bg-surface-base p-6',
        accent ? 'border-eu-ink/30 shadow-[0_18px_50px_-24px_rgba(0,51,153,0.35)]' : 'border-line-subtle',
        className,
      )}
    >
      <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{role.title}</h3>
      <div className="mt-3 text-sm leading-6 text-ink-secondary">{role.body}</div>
      <LegalCite findings={role.findings} className="mt-auto pt-4" />
    </div>
  )
}

/**
 * RoleFlow: who holds which role, as the flow it describes. A provider builds the AI system,
 * a deployer uses it, and a deployer who repurposes it into a high-risk use loops back into the
 * provider's place. The connectors draw in on scroll.
 */
export function RoleFlow({ roles, flow }: { roles: readonly Role[]; flow: Flow }) {
  // Content order is deployer, provider, becomes-provider; the flow reads provider -> deployer.
  const [deployer, provider, becomes] = roles
  return (
    <div>
      <div className="grid items-stretch gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)]">
        <RoleCard role={provider} />
        <div className="flex flex-col items-center justify-center lg:flex-row">
          <Connector label={flow.builds} delay={0.1} />
          <div className="relative my-1 flex-none rounded-full border border-eu-ink/30 bg-surface-base px-4 py-2 font-display text-sm font-semibold text-eu-ink shadow-[0_0_0_6px_rgba(0,51,153,0.06)]">
            {flow.system}
          </div>
          <Connector label={flow.uses} delay={0.5} />
        </div>
        <RoleCard role={deployer} accent />
      </div>
      <div className="mt-4 flex gap-4 rounded-2xl border border-brand-amber/45 bg-brand-amber/[0.06] p-6 md:gap-5">
        <CornerDownLeft aria-hidden className="mt-1 h-6 w-6 flex-none text-brand-amber-strong" />
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-brand-amber-strong">{flow.repurpose}</div>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">{becomes.title}</h3>
          <div className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">{becomes.body}</div>
          <LegalCite findings={becomes.findings} className="pt-3" />
        </div>
      </div>
    </div>
  )
}

/** Twelve gold stars on a circle: the EU marker, positioned by trig, not drawn by hand. */
function StarRing({ radius }: { radius: number }) {
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2
        return (
          <Star
            key={i}
            aria-hidden
            className="absolute h-[7%] w-[7%] -translate-x-1/2 -translate-y-1/2 fill-eu-gold text-eu-gold"
            style={{ left: `${(50 + radius * Math.cos(a)).toFixed(3)}%`, top: `${(50 + radius * Math.sin(a)).toFixed(3)}%` }}
          />
        )
      })}
    </>
  )
}

type RouteKind = 'market' | 'output'
type Route = { kind: RouteKind; who: string; when: string; findings: readonly string[] }
type Reach = { title: string; body: string; inside: string; routes: readonly Route[]; video: string; findings: readonly string[] }

/** Inbound arrows per route: placing on the market comes in from above, output flows in from below. */
const ROUTE_ANGLES: Record<RouteKind, readonly number[]> = { market: [225, 315], output: [135, 45] }

/**
 * The outer end of an inbound arrow. Market: a gold square (an AI product placed on the market)
 * on a solid line. Output: a white dot on a dashed line that dashes continuously (CSS, off under
 * reduced motion).
 */
function RouteMark({ kind, x, y }: { kind: RouteKind; x: number; y: number }) {
  return kind === 'market' ? (
    <rect x={x - 2} y={y - 2} width="4" height="4" rx="0.6" fill="#ffcc00" />
  ) : (
    <circle cx={x} cy={y} r="2.2" fill="#fff" />
  )
}

function routeStroke(kind: RouteKind) {
  return kind === 'market' ? { stroke: '#ffcc00', strokeWidth: 0.6 } : { stroke: '#ffcc00', strokeWidth: 0.5, strokeDasharray: '1.4 1.4' }
}

/** The legend glyph: the same arrow end and stroke as the diagram, drawn small. */
function RouteGlyph({ kind }: { kind: RouteKind }) {
  return (
    <svg viewBox="0 0 24 8" aria-hidden className="mt-1.5 h-2 w-6 flex-none overflow-visible">
      <line x1="4" y1="4" x2="24" y2="4" stroke="#ffcc00" strokeWidth={kind === 'market' ? 1.4 : 1.2} strokeDasharray={kind === 'market' ? undefined : '2.4 2'} />
      {kind === 'market' ? <rect x="0" y="0" width="8" height="8" rx="1.2" fill="#ffcc00" /> : <circle cx="4" cy="4" r="4" fill="#fff" />}
    </svg>
  )
}

/**
 * ReachPanel: the Act's territorial reach over real Brussels footage. Inside the ring of stars:
 * deployers established in the EU. From outside the ring, two routes in: providers anywhere that
 * place AI on the EU market or put it into service there (Art. 2(1)(a)), and providers and
 * deployers anywhere else whose output is used in the EU (Art. 2(1)(c)).
 */
export function ReachPanel({ reach }: { reach: Reach }) {
  const reduce = useReducedMotion() ?? false
  const arrows = reach.routes.flatMap((r) => ROUTE_ANGLES[r.kind].map((deg) => ({ kind: r.kind, a: (deg * Math.PI) / 180 })))
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] text-white">
      <LoopVideo name={reach.video} className="absolute inset-0 -z-20" sizes="(max-width: 1024px) 100vw, 72rem" />
      {/* EU-blue duotone over the footage: the city reads, the type stays legible (AA on the darkest stop). */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(100deg, rgba(0,32,110,0.94) 0%, rgba(0,40,130,0.86) 46%, rgba(0,51,153,0.55) 100%)' }}
      />
      <div className="grid items-center gap-8 p-7 md:p-12 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:gap-14">
        <div>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white md:text-4xl md:leading-[1.1]">{reach.title}</h3>
          <div className="mt-4 max-w-xl text-base leading-7 text-white/85">{reach.body}</div>
          <LegalCite findings={reach.findings} className="mt-4 text-white/70 [&_a]:decoration-white/40 [&_a:hover]:text-white" />
        </div>
        <div className="mx-auto w-full max-w-[26rem]">
          <div className="relative aspect-square w-full" aria-hidden>
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" strokeDasharray="1.2 1.6" />
              <circle cx="50" cy="50" r="24" fill="rgba(0,51,153,0.65)" stroke="rgba(255,204,0,0.5)" strokeWidth="0.3" />
              {arrows.map(({ kind, a }, i) => {
                const x1 = 50 + 44 * Math.cos(a)
                const y1 = 50 + 44 * Math.sin(a)
                const x2 = 50 + 27 * Math.cos(a)
                const y2 = 50 + 27 * Math.sin(a)
                return (
                  <g key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      {...routeStroke(kind)}
                      className={kind === 'output' && !reduce ? 'eu-flow-dash' : undefined}
                    />
                    <RouteMark kind={kind} x={x1 + 2 * Math.cos(a)} y={y1 + 2 * Math.sin(a)} />
                  </g>
                )
              })}
            </svg>
            <StarRing radius={18} />
            <div className="absolute inset-[36%] flex items-center justify-center text-center font-display text-[clamp(0.68rem,1.3vw,0.9rem)] font-semibold leading-tight text-white">
              {reach.inside}
            </div>
          </div>
          <ul className="mt-5 grid gap-3 text-sm leading-5 text-white/85 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {reach.routes.map((r) => (
              <li key={r.kind} className="flex gap-3">
                <RouteGlyph kind={r.kind} />
                <span>
                  <span className="font-semibold text-white">{r.who}</span> {r.when}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
