import React from 'react'
import type { LoopAccent } from '@/src/curriculum-loop-content'

/*
 * Spot glyphs for the flywheel section — inline SVG in the AIOS "vg" register:
 * greyscale chrome (currentColor / --text-tertiary), one rationed prism accent,
 * 1.25–1.6 hairline strokes with round caps, decorative (aria-hidden).
 */

const ACCENT_VAR: Record<LoopAccent, string> = {
  violet: 'var(--violet)',
  blue: 'var(--blue)',
  cyan: 'var(--cyan)',
  emerald: 'var(--emerald)',
}

type GlyphKind = 'review' | 'capture' | 'agent'

/** ~60px square roadmap-card glyph. `accent` colours the single rationed stop. */
export function LoopGlyph({ kind, accent }: { kind: GlyphKind; accent: LoopAccent }) {
  const a = ACCENT_VAR[accent]
  return (
    <svg
      viewBox="0 0 64 64"
      width={60}
      height={60}
      fill="none"
      aria-hidden="true"
      style={{ color: 'var(--text-tertiary)' }}
    >
      {kind === 'review' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* refresh loop arrow — a ring centred on the eye (32,32), gap at top */}
          <path
            d="M39.5 19 A15 15 0 1 1 24.5 19"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.7"
          />
          {/* arrowhead closing the loop at the top-left end */}
          <path
            d="M24.5 19 L20.5 20.5 M24.5 19 L25.5 23.5"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.7"
          />
          {/* the human eye reviewing the context — optical centre of the loop */}
          <path d="M23 32 Q32 24.5 41 32 Q32 39.5 23 32 Z" stroke={a} strokeWidth="1.5" />
          <circle cx="32" cy="32" r="2.6" fill={a} />
        </g>
      )}
      {kind === 'capture' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* three concentric signal waves radiating toward the funnel */}
          <path d="M21.1 24.9 A10 10 0 0 1 21.1 39.1" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
          <path d="M25.3 20.7 A16 16 0 0 1 25.3 43.3" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
          <path d="M29.6 16.4 A22 22 0 0 1 29.6 47.6" stroke="currentColor" strokeWidth="1.4" opacity="0.8" />
          {/* funnel / capture */}
          <path d="M38 22 H54 L47.5 31 V41 L44.5 44 V31 Z" stroke={a} strokeWidth="1.5" />
          <circle cx="46" cy="48" r="2" fill={a} />
        </g>
      )}
      {kind === 'agent' && (
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* standing agent node — pointy-top hex filling the box */}
          <path
            d="M32 15 L45 22.5 L45 37.5 L32 45 L19 37.5 L19 22.5 Z"
            stroke={a}
            strokeWidth="1.5"
          />
          <circle cx="32" cy="30" r="4.5" fill={a} />
          {/* stem + base — it stands */}
          <path d="M32 45 V52" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <path d="M26 53.5 H38" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        </g>
      )}
    </svg>
  )
}

/**
 * Family-agent capstone — one agent at the centre of one job family: four signal
 * spokes flow inward to the node.
 */
export function FamilyAgentGlyph({ spokes }: { spokes: readonly string[] }) {
  const W = 360
  const H = 220
  const cx = W / 2
  const cy = H / 2
  // four outer signal nodes (top-left, top-right, bottom-left, bottom-right)
  const outer = [
    { x: 70, y: 50 },
    { x: 290, y: 50 },
    { x: 70, y: 170 },
    { x: 290, y: 170 },
  ]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      aria-hidden="true"
      style={{ color: 'var(--text-tertiary)', display: 'block' }}
    >
      <defs>
        <marker
          id="fa-arrow-in"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9" fill="var(--text-tertiary)" />
        </marker>
        <radialGradient id="fa-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.16" />
          <stop offset="70%" stopColor="var(--violet)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft halo behind the agent */}
      <circle cx={cx} cy={cy} r={70} fill="url(#fa-halo)" />

      {/* spokes: signals in */}
      {outer.map((o, i) => {
        const dx = cx - o.x
        const dy = cy - o.y
        const len = Math.hypot(dx, dy)
        // stop short of the centre node + outer node
        const x1 = o.x + (dx / len) * 22
        const y1 = o.y + (dy / len) * 22
        const x2 = cx - (dx / len) * 42
        const y2 = cy - (dy / len) * 42
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.7"
            markerEnd="url(#fa-arrow-in)"
          />
        )
      })}

      {/* outer signal nodes + labels */}
      {outer.map((o, i) => (
        <g key={`o-${i}`}>
          <circle cx={o.x} cy={o.y} r={5} fill="var(--blue)" />
          <text
            x={o.x}
            y={o.y + (o.y < cy ? -14 : 22)}
            textAnchor="middle"
            fill="var(--text-secondary)"
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: '12px',
              letterSpacing: '0.04em',
            }}
          >
            {spokes[i]}
          </text>
        </g>
      ))}

      {/* centre agent node */}
      <rect
        x={cx - 26}
        y={cy - 26}
        width={52}
        height={52}
        rx={14}
        fill="var(--surface-inset)"
        stroke="var(--violet)"
        strokeWidth="1.75"
      />
      <circle cx={cx} cy={cy} r={7} fill="var(--violet)" />
    </svg>
  )
}
