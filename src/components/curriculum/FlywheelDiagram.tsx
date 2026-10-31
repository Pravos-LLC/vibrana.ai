'use client'

import React from 'react'
import { cn } from '@/src/components/prism'
import styles from './flywheel.module.css'
import type { LoopAccent } from '@/src/curriculum-loop-content'

/** Minimal shape the wheel needs; full copy lives in the parent's data. */
export interface WheelNode {
  id: string
  kicker: string
  accent: LoopAccent
  highlight?: boolean
}

export interface FlywheelDiagramProps {
  nodes: WheelNode[]
  activeId: string
  onSelect: (id: string) => void
  /** Unique prefix so marker ids don't collide when two wheels share a page. */
  idPrefix: string
  /** Accessible name for the tablist. */
  label: string
  className?: string
  /**
   * When the parent drives the orbiting signal (the synced gallery), it passes a
   * ref to the signal dot and sets `controlled` so the CSS orbit animation is
   * disabled and the dot position is written imperatively each frame.
   */
  signalRef?: React.Ref<SVGCircleElement>
  controlled?: boolean
}

const ACCENT_VAR: Record<LoopAccent, string> = {
  violet: 'var(--violet)',
  blue: 'var(--blue)',
  cyan: 'var(--cyan)',
  emerald: 'var(--emerald)',
}

// Geometry — deterministic, so SSR and client render identically.
const VB = 320
const C = VB / 2 // 160
const R = 116 // node-centre radius
const LABEL_R = R + 28 // kicker label radius
const NODE_R = 16 // node marker radius (smaller ring so labels never collide)
const GAP_DEG = 24 // angular clearance around each node for the arc connectors

const rad = (deg: number) => (deg * Math.PI) / 180
const pt = (angleDeg: number, radius: number) => ({
  x: +(C + radius * Math.cos(rad(angleDeg))).toFixed(3),
  y: +(C + radius * Math.sin(rad(angleDeg))).toFixed(3),
})

export function FlywheelDiagram({
  nodes,
  activeId,
  onSelect,
  idPrefix,
  label,
  className,
  signalRef,
  controlled,
}: FlywheelDiagramProps) {
  const refs = React.useRef<(SVGGElement | null)[]>([])
  const n = nodes.length
  // First node at the top (-90°), then clockwise.
  const angleOf = (i: number) => -90 + (360 / n) * i

  const focusIndex = (i: number) => {
    const idx = ((i % n) + n) % n
    onSelect(nodes[idx].id)
    refs.current[idx]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        focusIndex(i + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        focusIndex(i - 1)
        break
      case 'Home':
        e.preventDefault()
        focusIndex(0)
        break
      case 'End':
        e.preventDefault()
        focusIndex(n - 1)
        break
    }
  }

  // Full-ring path for the orbiting "signal" (clockwise circle from the top).
  const ringPath = `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C} ${C + R} A ${R} ${R} 0 1 1 ${C} ${C - R} Z`

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn(styles.wheel, className)}
      role="tablist"
      aria-label={label}
    >
      <defs>
        <marker
          id={`${idPrefix}-arrow`}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L9,5 L0,9" className={styles.arrowhead} />
        </marker>
      </defs>

      {/* Dotted guide ring (slow dash drift; symmetric so labels are unaffected). */}
      <circle className={cn(styles.ring, styles.spinGroup)} cx={C} cy={C} r={R} />

      {/* Arc connectors between consecutive nodes, pointing clockwise. */}
      {nodes.map((_, i) => {
        const a1 = angleOf(i) + GAP_DEG
        const a2 = angleOf(i + 1) - GAP_DEG
        const p1 = pt(a1, R)
        const p2 = pt(a2, R)
        return (
          <path
            key={`edge-${i}`}
            className={styles.edge}
            d={`M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`}
            markerEnd={`url(#${idPrefix}-arrow)`}
          />
        )
      })}

      {/* Travelling signal token. Free-running via the stylesheet, OR parent-driven
          (controlled) so it stays locked to the active node in the synced gallery.
          Reduced-motion is handled by the stylesheet (free) / parent (controlled). */}
      <circle
        ref={signalRef}
        r={4.5}
        className={styles.signal}
        style={
          controlled
            ? { offsetPath: `path('${ringPath}')`, offsetDistance: '0%', animation: 'none' }
            : { offsetPath: `path('${ringPath}')` }
        }
      />

      {/* Nodes. */}
      {nodes.map((node, i) => {
        const ang = angleOf(i)
        const p = pt(ang, R)
        const lp = pt(ang, LABEL_R)
        const cosA = Math.cos(rad(ang))
        const sinA = Math.sin(rad(ang))
        // Radial-aware label so it sits outside the node, never over it.
        const anchor = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'
        const baseline = sinA > 0.5 ? 'hanging' : sinA < -0.5 ? 'auto' : 'middle'
        const isActive = node.id === activeId
        const accent = ACCENT_VAR[node.accent]
        return (
          <g
            key={node.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            className={cn(styles.node, isActive && styles.active)}
            style={{ '--n': accent } as React.CSSProperties}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            aria-label={node.kicker}
            onClick={() => onSelect(node.id)}
            onMouseEnter={() => onSelect(node.id)}
            onFocus={() => onSelect(node.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {/* Generous transparent hit-target. */}
            <circle className={styles.nodeHit} cx={p.x} cy={p.y} r={NODE_R + 12} />
            {node.highlight && <circle className={styles.halo} cx={p.x} cy={p.y} r={NODE_R + 9} />}
            <circle className={styles.nodeRing} cx={p.x} cy={p.y} r={NODE_R} />
            <circle className={styles.nodeDot} cx={p.x} cy={p.y} r={isActive ? 7 : 5} />
            <text
              className={styles.nodeLabel}
              x={lp.x}
              y={lp.y}
              textAnchor={anchor}
              dominantBaseline={baseline}
            >
              {node.kicker}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
