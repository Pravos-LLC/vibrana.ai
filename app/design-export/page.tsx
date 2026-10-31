import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { REGISTRY } from '@/src/design-export/registry';

/**
 * Design-export surface for the Claude Design (claude.ai/design) sync.
 *
 * Renders every registry entry as an isolated `<article data-ds-*>` block inside
 * `.prism-light`, so `scripts/export-design-bundle.mjs` can slice each one into a
 * self-contained HTML preview. NOT a human board — that's `/prism`. Kept out of
 * the sitemap and search. See src/design-export/registry.tsx.
 *
 * Not needed in production: `scripts/export-design-bundle.mjs` renders the
 * registry offline via esbuild + renderToStaticMarkup — it never fetches this
 * route — so there's no reason for it to be reachable on the live site.
 */
export const metadata: Metadata = {
  title: 'Vibrana Design Export',
  robots: { index: false, follow: false },
};

export default function DesignExport() {
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }

  return (
    <div className="prism-light" data-ds-root>
      {REGISTRY.map((entry) => (
        <article
          key={entry.slug}
          data-ds-card
          data-ds-slug={entry.slug}
          data-ds-group={entry.group}
          data-ds-name={entry.name}
          data-ds-subtitle={entry.subtitle}
          data-ds-width={entry.width ?? 640}
          style={{ padding: '2rem' }}
        >
          {entry.render()}
        </article>
      ))}
    </div>
  );
}
