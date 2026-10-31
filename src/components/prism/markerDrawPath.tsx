'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * MarkerDrawPath — internal helper, not exported from the Prism index. Shared
 * by MarkerUnderline, MarkerCircle, and MarkerArrow: a single authored stroke
 * path that draws itself in on scroll-into-view using the `pathLength`
 * normalization trick (pathLength=1 + dasharray/dashoffset in 0-1 space, so
 * the same dash math works regardless of the path's actual authored length).
 *
 * Honours `prefers-reduced-motion`: renders the stroke fully drawn and static,
 * no animation, no dash setup at all.
 */
export function MarkerDrawPath({
  d,
  stroke,
  strokeWidth,
  opacity = 1,
  delay = 0,
  duration = 0.55,
}: {
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
  delay?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      initial={{ strokeDashoffset: 1 }}
      whileInView={{ strokeDashoffset: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration, delay, ease: [0.65, 0, 0.35, 1] }}
    />
  );
}
