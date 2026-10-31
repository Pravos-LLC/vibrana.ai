'use client';
import { siteContent } from '@/src/site-content'

/**
 * SplashPage — logo, wordmark, tagline. Prism Light (strict DS).
 */

import React from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Background } from '@/src/components/prism';

export default function SplashPage() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="prism-light relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <Background mouseX={mouseX} mouseY={mouseY} scrollProgress={0} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.img
          src={siteContent("media.c3JjL3ZpZXdzL1NwbGFzaFBhZ2UudHN4OjA", "/assets/vibrana-v-prism-96.webp")}
          alt="Vibrana Logo"
          className="h-24 w-24 object-contain md:h-32 md:w-32"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        <motion.h1
          className="mt-4 font-display text-3xl font-semibold tracking-[0.2em] text-ink md:text-5xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          VIBRANA
        </motion.h1>

        <motion.p
          className="mt-4 type-sm font-body uppercase tracking-[0.15em] text-ink-secondary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Learn to Build Products with AI
        </motion.p>
      </motion.div>
    </div>
  );
}
