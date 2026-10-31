'use client';

import React, { useRef } from 'react';
import { useMotionValue, useScroll, useSpring } from 'framer-motion';
import { Background } from './Background';
import { Nav, type NavProps } from './Nav';

/**
 * PageShell — the Prism Light page frame. Provides the `.prism-light` scope
 * (so every DS class inside resolves), the recolored Background with mouse/
 * scroll parallax, the Nav, a main region, and an optional footer slot.
 * Replaces EnterprisePageShell.
 */
export interface PageShellProps {
  children: React.ReactNode;
  nav: NavProps;
  footer?: React.ReactNode;
  background?: boolean;
}

export function PageShell({ children, nav, footer, background = true }: PageShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100 });

  const handleMouseMove = (event: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    mouseX.set(event.clientX / window.innerWidth);
    mouseY.set(event.clientY / window.innerHeight);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="prism-light relative min-h-screen overflow-x-clip"
    >
      {background && (
        <Background
          mouseX={mouseX}
          mouseY={mouseY}
          scrollProgress={smoothScrollProgress}
          variant="quiet"
          coverage="page"
        />
      )}
      <Nav {...nav} />
      <main className="relative z-10">{children}</main>
      {footer}
    </div>
  );
}
