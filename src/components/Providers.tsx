'use client';

import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/src/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // reducedMotion="user" makes every framer-motion animation (whileInView entrance
  // reveals across the course views, etc.) honour the OS prefers-reduced-motion
  // setting globally. (Audit F-MOTION-01/03.)
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>{children}</ThemeProvider>
    </MotionConfig>
  );
}
