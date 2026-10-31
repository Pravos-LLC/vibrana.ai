'use client'

import { useEffect } from 'react'
import { useMotionValue, useReducedMotion, type MotionValue } from 'framer-motion'

/**
 * Reduced motion as a MotionValue (0 or 1) that only flips after mount.
 *
 * Scroll-linked styles are computed during render, and the server cannot know
 * the visitor's preference. Feeding this into `useTransform([progress, rm], …)`
 * keeps the first client render identical to the server's (no hydration
 * mismatch), then settles every mapped style to rest once the preference is
 * known.
 */
export function useReducedMotionValue(): MotionValue<number> {
  const reduce = useReducedMotion()
  const rm = useMotionValue(0)
  useEffect(() => {
    rm.set(reduce ? 1 : 0)
  }, [reduce, rm])
  return rm
}
