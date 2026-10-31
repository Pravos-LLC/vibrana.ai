'use client';

import React from 'react';
import { MotionValue } from 'framer-motion';
import { Background } from './Background';

/**
 * BackgroundRich — back-compat wrapper. The richness this prototype
 * introduced (structural paths, denser nodes, dot-grid, bokeh) folded into
 * `Background.tsx` as `variant="rich"` during the BackgroundRich finalize
 * round — the two files were >90% identical (same props, same spring/
 * parallax rig, same noise-overlay technique), so a shared implementation
 * with a richness preset was the cleaner API than two parallel components.
 *
 * Kept only so existing `import { BackgroundRich } from '@/src/components/
 * prism'` call sites keep working. Prefer `<Background variant="rich" />`
 * (or `variant="quiet"` — the recommended production richness, see
 * Background.tsx's preset comments) in new code.
 */
interface BackgroundRichProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollProgress: number;
}

export function BackgroundRich(props: BackgroundRichProps) {
  return <Background {...props} variant="rich" />;
}
