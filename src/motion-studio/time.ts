/**
 * Motion studio: deterministic time math.
 *
 * Every frame of a studio reel is a pure function of `t` (seconds). Nothing here
 * reads a clock, so a frame rendered twice is identical, and the Playwright
 * exporter can step frames at any rate. No setTimeout, setInterval, CSS
 * transitions or free-running requestAnimationFrame belong in a reel.
 */

export type Ease = (x: number) => number

export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x))
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p

/**
 * CSS-style cubic-bezier easing, solved with Newton-Raphson then bisection
 * (the same approach browsers use), so the curves match what designers expect.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  const ax = 3 * x1 - 3 * x2 + 1
  const bx = 3 * x2 - 6 * x1
  const cx = 3 * x1
  const ay = 3 * y1 - 3 * y2 + 1
  const by = 3 * y2 - 6 * y1
  const cy = 3 * y1
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s
  const slopeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx

  const solve = (x: number) => {
    let s = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(s) - x
      if (Math.abs(err) < 1e-6) return s
      const d = slopeX(s)
      if (Math.abs(d) < 1e-6) break
      s -= err / d
    }
    let lo = 0
    let hi = 1
    s = x
    for (let i = 0; i < 30; i++) {
      const v = sampleX(s)
      if (Math.abs(v - x) < 1e-6) return s
      if (x > v) lo = s
      else hi = s
      s = (lo + hi) / 2
    }
    return s
  }

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return sampleY(solve(x))
  }
}

/** The house curves. No linear easing in a reel. */
export const ease = {
  /** Long, soft landing: type and plates arriving. */
  out: cubicBezier(0.16, 1, 0.3, 1),
  /** Symmetric, for camera pushes and cross-dissolves. */
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  /** Gentle, for slow drifts across a whole beat. */
  drift: cubicBezier(0.45, 0.05, 0.25, 1),
  /** Leaving the frame. */
  in: cubicBezier(0.7, 0, 0.84, 0),
} satisfies Record<string, Ease>

/** 0..1 progress of `t` through [start, end], eased. */
export function progress(t: number, start: number, end: number, curve: Ease = ease.out) {
  if (end <= start) return t >= end ? 1 : 0
  return curve(clamp((t - start) / (end - start)))
}

/**
 * Presence envelope for an element that enters at `start` and leaves at `end`:
 * 0 before, rises over `inDur`, holds at 1, falls over `outDur`, 0 after.
 */
export function envelope(
  t: number,
  start: number,
  end: number,
  inDur = 0.6,
  outDur = 0.45,
) {
  const a = progress(t, start, start + inDur, ease.out)
  const b = 1 - progress(t, end - outDur, end, ease.in)
  return Math.min(a, b)
}

/** Stagger helper: progress for the i-th item of a group. */
export function stagger(
  t: number,
  start: number,
  i: number,
  gap: number,
  dur: number,
  curve: Ease = ease.out,
) {
  return progress(t, start + i * gap, start + i * gap + dur, curve)
}

/** Deterministic hash noise in [0, 1) for grain seeds and jitter. */
export function hash01(n: number) {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s)
}
