import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * True when the user has requested reduced motion. GSAP entrance animations
 * should early-return on this — the opacity:0 start-state is only ever applied
 * by the tween itself, so skipping leaves content at its natural visible state.
 * (Audit F-MOTION-02: the CSS prefers-reduced-motion block can't touch GSAP's JS.)
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -5 * x)
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

export { gsap, ScrollTrigger }
