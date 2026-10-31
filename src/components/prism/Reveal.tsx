'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reveal — the standard Prism entrance motion (fade + slide-up on scroll into
 * view). Honours `prefers-reduced-motion` with a short plain fade. Replaces ad-hoc `motion.div whileInView` blocks.
 */
export interface RevealProps {
  children: React.ReactNode;
  as?: keyof typeof motion;
  y?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
}

export function Reveal({
  children,
  as = 'div',
  y = 40,
  delay = 0,
  duration = 0.8,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = (motion[as] ?? motion.div) as typeof motion.div;

  // Same markup on server and client: only the transition varies with
  // reduced motion (MotionConfig strips the slide; this keeps a short fade).
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={reduce ? { duration: 0.35 } : { duration, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </MotionTag>
  );
}
