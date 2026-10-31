/**
 * Motion tokens for the Prism scroll system (homepage overhaul, 2026-10).
 *
 * The previous reveals (24px, 0.5s, fired 80px before the element arrived)
 * finished before anyone looked, so the page read as static. These values are
 * tuned to be clearly perceptible and still restrained: one ease, generous
 * travel, a short stagger, and a trigger that waits until the block is
 * actually on screen.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

export const DIST = { item: 48, block: 64 } as const
export const DUR = { item: 1.05, block: 1.2, reduced: 0.35 } as const
export const STAGGER = { base: 0.14, dense: 0.04 } as const

/**
 * Fire once, when any part of the element has risen past the bottom 12% of the
 * viewport. Margin-based rather than a visible-fraction threshold, so a group
 * taller than the screen (the 20-role grid on a phone) still triggers.
 */
export const VIEWPORT = { once: true, margin: '0px 0px -18% 0px' } as const
