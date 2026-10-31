import { PublicDemoImg } from '@/src/components/PublicDemoImage'
/**
 * Footer — site footer (Prism Light, strict DS). Token-driven, no theme reads.
 * Renders inside the `.prism-light` scope (PageShell), so token vars resolve.
 */
import React from 'react';
import { Heart } from 'lucide-react';
import { Twitter, Instagram, Linkedin, Github } from '@/src/components/icons/BrandIcons';
import Link from 'next/link';
import { NAV_CTA, NAV_ITEMS } from '../constants';
import { Eyebrow } from '@/src/components/prism';
import { FOOTER_CONTENT } from '@/src/footer-content';

const linkClass =
  'block type-sm transition-colors text-ink-secondary hover:text-ink';
const metaLinkClass =
  'type-xs transition-colors text-ink-tertiary hover:text-ink';
const socialClass =
  'transition-transform hover:scale-110 text-ink-tertiary hover:text-brand-violet';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line-subtle px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="font-display mb-4 flex items-center gap-3 text-xl font-semibold tracking-widest text-ink">
              <PublicDemoImg src="/assets/vibrana-v-prism-96.webp" alt="Vibrana logo" width={32} height={32} className="h-8 w-auto" />
              VIBRANA
            </div>
            <p className="type-sm max-w-sm leading-relaxed text-ink-secondary">
              {FOOTER_CONTENT.tagline}
            </p>
          </div>

          <div>
            <Eyebrow className="mb-4">Navigate</Eyebrow>
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow className="mb-4">Get started</Eyebrow>
            <div className="space-y-2">
              <Link href={NAV_CTA.href} className={linkClass}>
                {NAV_CTA.label}
              </Link>
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 border-t border-line-subtle pb-8 pt-8">
          <Link
            href="https://john-ellison.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 type-sm text-ink-secondary transition-colors hover:text-ink"
          >
            Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> by John Ellison
          </Link>

          <div className="flex items-center gap-6">
            <a href="https://twitter.com/iamjohnellison" target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="Twitter/X">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://www.instagram.com/iamjohnellison" target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/iamjohnellison" target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://github.com/johnellison" target="_blank" rel="noopener noreferrer" className={socialClass} aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-line-subtle pt-4 md:flex-row">
          <div className="type-xs text-ink-tertiary">
            {FOOTER_CONTENT.copyright}
          </div>
          <div className="flex items-center gap-6">
            <Link href="/swag" className={metaLinkClass}>Swag</Link>
            <Link href="/privacy" className={metaLinkClass}>Privacy</Link>
            <Link href="/terms" className={metaLinkClass}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
