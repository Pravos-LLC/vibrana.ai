'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FEEDBACK_UI } from '@/src/feedback-content'
import activity from '@/src/data/team-pr-activity.json'

const UI = FEEDBACK_UI.done.activity
const DAY = 86_400_000
const CELL = 22
const GAP = 5
const STEP = CELL + GAP
const LEFT = 34
const TOP = 22
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS: [number, string][] = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]
/** Count-up length, and the cell sweep's per-column delay. Both skipped under reduced motion. */
const COUNT_MS = 1600
const COLUMN_DELAY_MS = 45

type Cell = { col: number; row: number; count: number; level: number; label: string }

/** Levels 1 to 4 split the non-zero days into quartiles, the way GitHub shades its graph. */
function levels(counts: number[]): (n: number) => number {
  const sorted = counts.filter((n) => n > 0).sort((a, b) => a - b)
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 1
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)]
  return (n) => (n === 0 ? 0 : n <= a ? 1 : n <= b ? 2 : n <= c ? 3 : 4)
}

const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/**
 * The team's merged pull requests over the last 13 weeks as a GitHub-style contribution graph.
 * Data is a daily snapshot (scripts/team-pr-activity.mjs). On first view the cells sweep in column by
 * column and the total counts up.
 */
export function TeamActivity() {
  const ref = useRef<HTMLElement>(null)
  const [seen, setSeen] = useState(false)
  // Only ever rendered in the browser (the form shows a shell until its draft loads), so the start value can
  // depend on the motion setting without a hydration mismatch, and the heading never flashes the total first.
  const [shown, setShown] = useState(() =>
    typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : activity.total,
  )

  const { cells, months, cols } = useMemo(() => {
    const start = new Date(`${activity.start}T00:00:00Z`)
    const level = levels(activity.counts)
    const cells: Cell[] = activity.counts.map((count, i) => ({
      col: Math.floor(i / 7),
      row: i % 7,
      count,
      level: level(count),
      label: UI.cell(count, formatDate(new Date(start.getTime() + i * DAY))),
    }))
    const months: { col: number; label: string }[] = []
    for (let col = 0; col * 7 < activity.counts.length; col++) {
      const month = new Date(start.getTime() + col * 7 * DAY).getUTCMonth()
      const prev = col === 0 ? -1 : new Date(start.getTime() + (col - 1) * 7 * DAY).getUTCMonth()
      if (month !== prev) months.push({ col, label: MONTHS[month] })
    }
    // A label squeezed into the first column or two of a part month would collide with the next one.
    if (months.length > 1 && months[1].col - months[0].col < 3) months.shift()
    return { cells, months, cols: Math.ceil(activity.counts.length / 7) }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      setShown(activity.total)
      return
    }
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        setSeen(true)
        const t0 = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - t0) / COUNT_MS))
          setShown(Math.round(activity.total * (1 - Math.pow(1 - t, 3))))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const width = LEFT + cols * STEP + 12 // room for the last month label
  const height = TOP + 7 * STEP
  const total = activity.total.toLocaleString('en-US')

  return (
    <section ref={ref} className="fb-activity" data-seen={seen} aria-labelledby="fb-activity-heading">
      <p className="fb-activity-eyebrow">{UI.eyebrow}</p>
      <h2 id="fb-activity-heading" className="fb-activity-heading">
        <span className="sr-only">{UI.heading(total)}</span>
        <span aria-hidden>{UI.heading(shown.toLocaleString('en-US'))}</span>
      </h2>
      <div className="fb-activity-frame">
        <div className="fb-activity-scroll">
          <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={UI.heading(total)}>
            {months.map((m) => (
              <text key={m.col} x={LEFT + m.col * STEP} y={13} className="fb-activity-label">
                {m.label}
              </text>
            ))}
            {WEEKDAYS.map(([row, label]) => (
              <text key={label} x={0} y={TOP + row * STEP + CELL / 2 + 4} className="fb-activity-label">
                {label}
              </text>
            ))}
            {cells.map((c) => (
              <rect
                key={`${c.col}-${c.row}`}
                x={LEFT + c.col * STEP}
                y={TOP + c.row * STEP}
                width={CELL}
                height={CELL}
                rx={4}
                data-level={c.level}
                style={{ animationDelay: `${c.col * COLUMN_DELAY_MS + c.row * 30}ms` }}
              >
                <title>{c.label}</title>
              </rect>
            ))}
          </svg>
        </div>
        <div className="fb-activity-foot">
          <span>{UI.note}</span>
          <span className="fb-activity-legend" aria-hidden>
            {UI.less}
            {[0, 1, 2, 3, 4].map((l) => (
              <svg key={l} width={11} height={11}>
                <rect width={11} height={11} rx={2.5} data-level={l} />
              </svg>
            ))}
            {UI.more}
          </span>
        </div>
      </div>
    </section>
  )
}
