/**
 * Landing kit motion and accent tokens. UI motion stays under 400 ms; each value has one job.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

/** Seconds. `swap` crossfades a state change, `draw` lines and strikes, `tick` a checkbox. */
export const DUR = { press: 0.16, swap: 0.24, draw: 0.38, tick: 0.22, reduced: 0.15 } as const

/** The two ends of the Prism gradient. A product or page takes one, never both. */
export const ACCENTS = {
  violet: { solid: '#7c3aed', text: 'var(--lk-violet-text)', tint: 'rgba(124, 58, 237, 0.10)', ring: 'rgba(124, 58, 237, 0.28)' },
  teal: { solid: '#2dd4bf', text: 'var(--lk-teal-text)', tint: 'rgba(45, 212, 191, 0.12)', ring: 'rgba(13, 148, 136, 0.30)' },
} as const
export type Accent = keyof typeof ACCENTS

/** The single gradient stroke used for strikes, progress and active markers. */
export const PRISM_STROKE = 'linear-gradient(90deg, #7c3aed 0%, #3b82f6 50%, #2dd4bf 100%)'
