'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/src/components/prism/utils/cn';

/**
 * PrismSidebar — the shadcn-docs-style left navigation for the /prism component
 * board. A sticky, grouped inventory index with scrollspy: the section
 * currently under the top of the viewport is highlighted, so you can see where
 * you are and jump straight to any component. Replicates the shadcn.com/docs
 * sidebar pattern (grouped labels, muted links, one active link accented with a
 * left indicator), not the heavier `Sidebar` app-shell primitive.
 *
 * Anchors live on the real sections/sub-sections in page.tsx + ResearchPreview.tsx
 * (each has `scroll-mt-24` so it lands below the fixed Nav). Keep this list in
 * sync with those ids.
 */

type NavLeaf = { id: string; label: string };
type NavGroup = { label: string; items: NavLeaf[] };

const NAV: NavGroup[] = [
  {
    label: 'Foundations',
    items: [
      { id: 'foundations', label: 'Tokens' },
      { id: 'typography', label: 'Typography' },
      { id: 'scroll-fill', label: 'ScrollFillText' },
    ],
  },
  {
    label: 'Inputs & actions',
    items: [
      { id: 'buttons', label: 'Buttons' },
      { id: 'forms', label: 'Forms' },
      { id: 'menus', label: 'Navigation' },
    ],
  },
  {
    label: 'Surfaces',
    items: [
      { id: 'data', label: 'Cards & data' },
      { id: 'metric-proof', label: 'MetricProof' },
      { id: 'accordions', label: 'Overlays & disclosure' },
    ],
  },
  {
    label: 'Backgrounds & ambient',
    items: [
      { id: 'background-field', label: 'Background' },
      { id: 'shader-field', label: 'ShaderField' },
      { id: 'wave-field', label: 'WaveField' },
      { id: 'scroll-motion', label: 'Scroll motion' },
      { id: 'ascii-field', label: 'AsciiField' },
      { id: 'motion', label: 'Motion & decoration' },
    ],
  },
  {
    label: 'Media & imagery',
    items: [
      { id: 'resolution-ladder', label: 'ResolutionLadder' },
      { id: 'punk-thumbnail', label: 'PunkThumbnail' },
      { id: 'film-roll', label: 'FilmRoll' },
    ],
  },
  {
    label: 'Annotations',
    items: [
      { id: 'marker-accents', label: 'Marker accents' },
      { id: 'marker-hover', label: 'MarkerHover' },
    ],
  },
  {
    label: 'Footers & CTAs',
    items: [{ id: 'newsletter-footer', label: 'NewsletterFooter' }],
  },
  {
    label: 'Substrate',
    items: [{ id: 'kit', label: 'shadcn kit' }],
  },
];

const ALL_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

export function PrismSidebar() {
  const [active, setActive] = useState<string>(ALL_IDS[0]);

  // Scrollspy: the active section is the last one whose top has crossed the
  // fixed-nav offset. rAF-throttled scroll listener — simple and reliable
  // across nested/variable-height sections (an IntersectionObserver with a
  // single threshold misbehaves when sections are taller than the viewport).
  useEffect(() => {
    const OFFSET = 120; // px below viewport top (clears the fixed Nav)
    let raf = 0;
    const compute = () => {
      raf = 0;
      let current = ALL_IDS[0];
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - OFFSET <= 0) current = id;
      }
      // If we're at the very bottom, force the last section active (short
      // trailing sections can never reach the offset otherwise).
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = ALL_IDS[ALL_IDS.length - 1];
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Also recompute whenever any section crosses the viewport — an
    // IntersectionObserver fires reliably on every scroll (independent of the
    // window 'scroll' event), so the active item stays correct even where the
    // scroll event is throttled or not delivered.
    const io = new IntersectionObserver(onScroll, {
      rootMargin: '0px 0px -70% 0px',
      threshold: [0, 1],
    });
    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const onClick = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    setActive(id);
  };

  return (
    <aside
      className="sticky top-24 hidden h-[calc(100vh-6rem)] w-60 shrink-0 self-start overflow-y-auto py-8 pr-4 lg:block"
      aria-label="Component inventory"
    >
      <p className="type-xs mb-4 px-3 font-medium uppercase tracking-wide text-tertiary-token">
        On this page
      </p>
      <nav className="space-y-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="type-xs mb-2 px-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => onClick(e, item.id)}
                      aria-current={isActive ? 'location' : undefined}
                      className={cn(
                        'block rounded-md border-l-2 py-1.5 pl-3 pr-2 text-[13px] leading-5 transition-colors',
                        isActive
                          ? 'border-l-(--violet) font-medium text-(--violet-strong)'
                          : 'border-l-transparent text-tertiary-token hover:border-l-(--border-subtle) hover:text-(--ink)',
                      )}
                      style={isActive ? { background: 'var(--surface-raised)' } : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
